/**
 * The "why" behind a setup, written by Claude.
 *
 * Everything numeric is computed before the model is called — levels, entry,
 * stop, targets, reward-to-risk, every confluence factor. The model's only job
 * is to turn that evidence into an explanation a person can read and argue
 * with. It cannot move a price, change a direction, or invent a factor, because
 * it is never asked for one.
 *
 * That split matters: a model asked to "find a trade" will find one every time.
 * A model asked to explain a trade the rules already produced, and to state the
 * case against it, is doing work it is actually good at.
 */
import Anthropic from '@anthropic-ai/sdk';
import { log } from '../log.js';

const SYSTEM_PROMPT = `You explain technical trade setups that have already been
computed by a rules engine. You are a writer and a critic, not a signal source.

Hard rules:
- Use ONLY the numbers and factors given to you. Never introduce a price level,
  indicator reading, news event, or fundamental that is not in the input.
- Never change the side, entry, stop, or targets. They are decided.
- Do not predict. Describe the setup's logic and what would invalidate it.
- No hype, no price predictions, no "this will run". Write like a desk analyst
  explaining a trade to a colleague who will push back.
- The "against" case is mandatory and must be specific. If the factors listed as
  unsupportive are weak, say the setup is thin — do not manufacture balance.

Style: plain, concrete, no adjectives doing work that numbers should do.`;

const SCHEMA = {
  type: 'object',
  properties: {
    thesis: {
      type: 'string',
      description: 'One or two sentences: what this trade is betting on, in plain language.',
    },
    supporting: {
      type: 'array',
      items: { type: 'string' },
      description: 'Each supporting factor restated as a concrete sentence citing its number. Max 4.',
    },
    against: {
      type: 'array',
      items: { type: 'string' },
      description: 'The specific case against, drawn from the unsupportive factors. Never empty. Max 3.',
    },
    invalidation: {
      type: 'string',
      description: 'What price action would prove this idea wrong, in one sentence.',
    },
    conviction: {
      type: 'string',
      enum: ['thin', 'moderate', 'strong'],
      description: 'How much the evidence actually supports the setup. Be conservative.',
    },
  },
  required: ['thesis', 'supporting', 'against', 'invalidation', 'conviction'],
  additionalProperties: false,
};

function describe(idea) {
  const { symbol, interval, structure, setup, confluence: factors } = idea;
  const lines = [
    `symbol: ${symbol}`,
    `timeframe: ${interval}`,
    `current price: ${structure.price.toPrecision(6)}`,
    `ATR: ${structure.atr?.toPrecision(4)} (${((structure.atrPct ?? 0) * 100).toFixed(2)}% of price)`,
    `trend: ${structure.trend.direction} (MA stack ${structure.trend.stack}, structure ${structure.trend.structure})`,
    `position in 60-bar range: ${((structure.rangePosition ?? 0) * 100).toFixed(0)}%`,
    '',
    `side: ${setup.side}`,
    `entry: ${setup.entry.toPrecision(6)}`,
    `stop: ${setup.stop.toPrecision(6)}`,
    `targets: ${setup.targets.map((target) => target.toPrecision(6)).join(', ')}`,
    `reward-to-risk: ${setup.riskReward.toFixed(2)}`,
    `break-even win rate needed: ${(setup.breakEvenWinRate * 100).toFixed(0)}%`,
    '',
    'levels on the chart:',
    ...structure.levels.map(
      (level) => `  ${level.price.toPrecision(6)} — touched ${level.touches}x, strength ${level.strength.toFixed(1)}`,
    ),
    '',
    'factors that SUPPORT this direction:',
    ...factors.factors.filter((factor) => factor.supports).map((factor) => `  ${factor.label} — ${factor.detail}`),
    '',
    'factors that DO NOT support it:',
    ...(factors.against.length
      ? factors.against.map((factor) => `  ${factor.label} — ${factor.detail}`)
      : ['  (none — say so plainly rather than inventing one)']),
  ];
  return lines.join('\n');
}

function fallback(idea, reason) {
  const supporting = idea.confluence.factors.filter((factor) => factor.supports);
  return {
    thesis: `${idea.setup.side === 'long' ? 'Long' : 'Short'} ${idea.symbol} against the ${
      idea.setup.side === 'long' ? 'support' : 'resistance'
    } at ${(idea.setup.side === 'long' ? idea.structure.support[0]?.price : idea.structure.resistance[0]?.price)?.toPrecision(6)}, risking to ${idea.setup.stop.toPrecision(6)} for ${idea.setup.riskReward.toFixed(2)}R.`,
    supporting: supporting.map((factor) => `${factor.label} — ${factor.detail}`),
    against: idea.confluence.against.map((factor) => `${factor.label} — ${factor.detail}`),
    invalidation: idea.setup.invalidation,
    conviction: idea.confluence.score > 0.7 ? 'moderate' : 'thin',
    generated: false,
    note: `written from the rules alone (${reason})`,
  };
}

/**
 * Explain one setup. Never throws — a missing or failing model degrades to a
 * mechanically-generated explanation rather than losing the idea.
 */
export async function explain(idea, settings, { client } = {}) {
  if (!settings.enabled) return fallback(idea, settings.disabledReason ?? 'narrative scoring disabled');

  const anthropic = client ?? new Anthropic();
  const request = {
    model: settings.model,
    max_tokens: 2000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: settings.effort, format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: describe(idea) }],
  };

  try {
    let message;
    try {
      message = await anthropic.beta.messages.create({
        ...request,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
    } catch (error) {
      if (error?.status !== 400) throw error;
      message = await anthropic.messages.create(request);
    }

    if (message.stop_reason === 'refusal') throw new Error('model declined');
    const text = message.content.filter((block) => block.type === 'text').map((block) => block.text).join('');
    return { ...JSON.parse(text), generated: true };
  } catch (error) {
    log.warn(`could not explain ${idea.symbol}: ${error.message}`);
    return fallback(idea, error.message);
  }
}

export const _internals = { SYSTEM_PROMPT, SCHEMA, describe, fallback };
