/**
 * The "AI" half of the bot: Claude reads what the mechanical screens can't —
 * the name, ticker, description and socials — and judges whether there is a
 * narrative here that could plausibly attract buyers, or whether it is a
 * template scam with the serial numbers filed off.
 *
 * Deliberately narrow: Claude never sees price data and never decides whether
 * to trade. It scores one axis, which is then weighted alongside the safety
 * and momentum scores. Keeping the model out of the trade decision means a
 * confident-but-wrong judgement can't override the risk rules.
 */
import Anthropic from '@anthropic-ai/sdk';
import { chunk, clamp, num } from '../util.js';
import { log } from '../log.js';

const SYSTEM_PROMPT = `You evaluate memecoin narratives for a trading research tool.

For each token you are given the on-chain name, ticker, description and links.
You never see price or volume — do not speculate about them, and do not give
financial advice or a buy/sell recommendation. Score one thing only: how
plausible it is that this token attracts and holds organic attention.

What scores high:
- A coherent, memorable concept a person could explain in one sentence.
- Timeliness: it references something people are actually talking about now.
- Signs of real effort: a working site, an active community link, art that
  isn't a stock template, a ticker that matches the concept.

What scores low:
- Generic slop: "Doge/Pepe/Shiba + adjective" with nothing else, AI-boilerplate
  descriptions, no links at all.
- Impersonation: pretending to be an established project, brand, exchange or
  person, or an "official" token for something that has no token.
- Copycat launches riding a name that already has a dominant token.
- Descriptions promising guaranteed returns, "100x", airdrops for buying, or
  anything that reads as a solicitation.

Impersonation and guaranteed-return promises are red flags regardless of how
polished the rest looks — say so in redFlags.

Be strict. Most tokens are slop and should score below 0.35. Reserve scores
above 0.7 for something you would genuinely expect people to share.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    assessments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'The token address exactly as given' },
          score: {
            type: 'number',
            description: 'Narrative strength from 0 (slop) to 1 (genuinely compelling)',
          },
          category: {
            type: 'string',
            enum: ['animal', 'political', 'tech-ai', 'celebrity', 'event', 'absurdist', 'finance', 'copycat', 'impersonation', 'unclear', 'other'],
          },
          verdict: {
            type: 'string',
            enum: ['compelling', 'plausible', 'weak', 'slop', 'suspicious'],
          },
          rationale: { type: 'string', description: 'One sentence, max 25 words' },
          redFlags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Short phrases; empty array when there are none',
          },
        },
        required: ['address', 'score', 'category', 'verdict', 'rationale', 'redFlags'],
        additionalProperties: false,
      },
    },
  },
  required: ['assessments'],
  additionalProperties: false,
};

function describeToken(token) {
  const socials = token.info.socials.map((s) => s.type ?? 'link').join(', ') || 'none';
  const sites = token.info.websites.length;
  const description = (token.info.description || '(no description)').slice(0, 400);
  return [
    `address: ${token.address}`,
    `name: ${token.name || '(unnamed)'}`,
    `ticker: ${token.symbol || '(none)'}`,
    `description: ${description}`,
    `socials: ${socials}`,
    `websites: ${sites}`,
    `has image: ${token.info.imageUrl ? 'yes' : 'no'}`,
  ].join('\n');
}

function neutral(token, reason) {
  return {
    address: token.address,
    score: 0.5,
    category: 'unclear',
    verdict: 'plausible',
    rationale: reason,
    redFlags: [],
    unavailable: true,
  };
}

function extractJson(message) {
  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
  if (!text.trim()) throw new Error('model returned no text content');
  return JSON.parse(text);
}

/**
 * Ask Claude to score one batch. Returns a Map of address -> assessment.
 * Any failure degrades to neutral scores rather than blocking the cycle.
 */
async function scoreBatch(client, tokens, settings) {
  const request = {
    model: settings.model,
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // Stable prefix across every cycle — worth a cache breakpoint.
        cache_control: { type: 'ephemeral' },
      },
    ],
    output_config: {
      effort: settings.effort,
      format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Score each of these ${tokens.length} tokens. Return one assessment per token, in the same order.\n\n${tokens
          .map(describeToken)
          .join('\n---\n')}`,
      },
    ],
  };

  let message;
  try {
    // Claude Opus 5's safety classifiers can decline a request; server-side
    // fallbacks re-run it on another model instead of returning the refusal.
    message = await client.beta.messages.create({
      ...request,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (error) {
    if (error?.status !== 400) throw error;
    log.debug('server-side fallbacks unavailable, retrying without:', error.message);
    message = await client.messages.create(request);
  }

  if (message.stop_reason === 'refusal') {
    throw new Error(`model declined (${message.stop_details?.category ?? 'unspecified'})`);
  }
  if (message.stop_reason === 'max_tokens') {
    throw new Error('response truncated at max_tokens — lower narrative.batchSize');
  }

  const parsed = extractJson(message);
  const byAddress = new Map();
  for (const assessment of parsed.assessments ?? []) {
    byAddress.set(assessment.address, { ...assessment, score: clamp(num(assessment.score, 0.5)) });
  }
  return byAddress;
}

/**
 * Score a list of normalised tokens.
 *
 * @returns {Promise<Map<string, object>>} address -> assessment
 */
export async function assessNarratives(tokens, settings, { client } = {}) {
  const results = new Map();
  if (tokens.length === 0) return results;

  if (!settings.enabled) {
    const reason = settings.disabledReason
      ? `narrative scoring off (${settings.disabledReason})`
      : 'narrative scoring disabled';
    for (const token of tokens) results.set(token.address, neutral(token, reason));
    return results;
  }

  // Zero-arg constructor: picks up ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or
  // an `ant auth login` profile, in that order.
  const anthropic = client ?? new Anthropic();

  for (const batch of chunk(tokens, settings.batchSize)) {
    try {
      const scored = await scoreBatch(anthropic, batch, settings);
      for (const token of batch) {
        results.set(token.address, scored.get(token.address) ?? neutral(token, 'no assessment returned'));
      }
    } catch (error) {
      log.warn('narrative scoring failed for a batch:', error.message);
      for (const token of batch) results.set(token.address, neutral(token, `scoring failed: ${error.message}`));
    }
  }

  return results;
}

export const _internals = { SYSTEM_PROMPT, RESPONSE_SCHEMA, describeToken, extractJson, scoreBatch };
