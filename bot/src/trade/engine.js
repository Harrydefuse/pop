/**
 * The cycle: discover -> enrich -> screen -> score -> decide -> (paper) trade.
 *
 * Ordering is deliberate and cost-driven. The cheap mechanical filters run
 * first and throw away most candidates; the on-chain RPC calls run only on
 * survivors; Claude is consulted last and only on tokens that already look
 * tradeable. Reversing that order would work but would cost roughly 20x more.
 */
import * as dex from '../sources/dexscreener.js';
import { inspectToken } from '../sources/solana.js';
import { assessSafety } from '../analysis/safety.js';
import { assessMomentum } from '../analysis/momentum.js';
import { assessNarratives } from '../analysis/narrative.js';
import { ACTIONS, decide } from '../analysis/score.js';
import { Portfolio } from './portfolio.js';
import { appendJsonl } from '../store.js';
import { log } from '../log.js';
import { num, uniqueBy } from '../util.js';

/** Pull candidate token addresses from every configured discovery source. */
export async function discover(config, { signal } = {}) {
  const { sources, searchTerms, maxTokensPerCycle } = config.discovery;
  const candidates = [];

  const collect = (entries, source) => {
    for (const entry of entries ?? []) {
      if (entry?.chainId !== config.chain || !entry?.tokenAddress) continue;
      candidates.push({ address: entry.tokenAddress, source, hint: entry.description ?? '' });
    }
  };

  const jobs = [];
  if (sources.includes('token-profiles')) {
    jobs.push(dex.latestTokenProfiles({ signal }).then((r) => collect(r, 'profiles')));
  }
  if (sources.includes('token-boosts')) {
    jobs.push(dex.latestBoosts({ signal }).then((r) => collect(r, 'boosts')));
  }
  if (sources.includes('top-boosts')) {
    jobs.push(dex.topBoosts({ signal }).then((r) => collect(r, 'top-boosts')));
  }
  for (const term of searchTerms ?? []) {
    jobs.push(
      dex.searchPairs(term, { signal }).then((pairs) => {
        for (const pair of pairs) {
          if (pair?.chainId !== config.chain || !pair?.baseToken?.address) continue;
          candidates.push({ address: pair.baseToken.address, source: `search:${term}`, hint: '' });
        }
      }),
    );
  }

  const settled = await Promise.allSettled(jobs);
  for (const result of settled) {
    if (result.status === 'rejected') log.warn('discovery source failed:', result.reason?.message ?? result.reason);
  }

  return uniqueBy(candidates, (c) => c.address).slice(0, maxTokensPerCycle);
}

/** Fetch market data for candidate addresses and normalise it. */
export async function enrich(addresses, config, { signal } = {}) {
  if (addresses.length === 0) return [];
  const pairs = await dex.pairsForTokens(config.chain, addresses, { signal });
  const now = Date.now();
  return [...dex.groupByBaseToken(pairs).values()].map((pair) => dex.normalizePair(pair, now));
}

/**
 * Full analysis for a set of normalised tokens. Safety and momentum run for
 * everything; narrative runs only for tokens whose mechanical score already
 * clears `narrative.minCompositeToConsult`.
 */
export async function analyze(tokens, config, { signal, anthropic } = {}) {
  const onChain = new Map();
  if (config.chain === 'solana') {
    // Sequential on purpose: the public RPC punishes bursts, and this list is
    // already short by the time we get here.
    for (const token of tokens) {
      onChain.set(
        token.address,
        await inspectToken(config.solana.rpcUrl, {
          mint: token.address,
          poolBaseAmount: token.liquidityBase,
          signal,
        }),
      );
    }
  }

  const partial = tokens.map((token) => {
    const safety = assessSafety(token, onChain.get(token.address), config.safety);
    const momentum = assessMomentum(token, config.momentum);
    return { token, safety, momentum, chainInfo: onChain.get(token.address) };
  });

  // Only pay for narrative scoring where it could still change the outcome.
  const { weights } = config.scoring;
  const mechanicalCeiling = (row) =>
    (row.safety.score * weights.safety + row.momentum.score * weights.momentum + 1 * weights.narrative) /
    (weights.safety + weights.momentum + weights.narrative);

  const worthConsulting = partial.filter(
    (row) => row.safety.passed && mechanicalCeiling(row) >= config.narrative.minCompositeToConsult,
  );

  log.debug(`narrative: consulting on ${worthConsulting.length}/${partial.length} tokens`);
  const narratives = await assessNarratives(
    worthConsulting.map((row) => row.token),
    config.narrative,
    { client: anthropic },
  );

  return partial.map((row) => {
    const narrative = narratives.get(row.token.address) ?? {
      score: 0.5,
      verdict: 'plausible',
      rationale: 'not consulted (below narrative threshold)',
      redFlags: [],
      unavailable: true,
    };
    return {
      ...row,
      narrative,
      decision: decide({ safety: row.safety, momentum: row.momentum, narrative }, config.scoring),
    };
  });
}

/** Mark open positions and close any that hit an exit rule. */
export async function managePositions(portfolio, config, { signal } = {}) {
  const open = portfolio.openPositions;
  if (open.length === 0) return { marked: 0, closed: [] };

  const prices = await dex.pricesForTokens(config.chain, open.map((p) => p.address), { signal });
  const closed = [];
  const now = Date.now();

  for (const position of open) {
    const quote = prices.get(position.address);
    if (!quote || !(quote.priceUsd > 0)) {
      log.warn(`no price for ${position.symbol} (${position.address}) — holding`);
      continue;
    }
    portfolio.mark(position.address, quote.priceUsd);
    const signalResult = portfolio.exitSignal(position, quote.priceUsd, now);
    if (signalResult.exit) {
      const record = portfolio.close(position.address, {
        priceUsd: quote.priceUsd,
        liquidityUsd: quote.liquidityUsd,
        reason: signalResult.reason,
        now,
      });
      if (record) closed.push(record);
    }
  }

  portfolio.save();
  return { marked: prices.size, closed };
}

/**
 * One full cycle. Returns everything it looked at so the CLI can render it.
 *
 * @param {object} options.dryRun  analyse and report, but never open positions
 */
export async function runCycle(
  config,
  { signal, anthropic, dryRun = false, portfolio, onProgress = () => {} } = {},
) {
  const started = Date.now();
  const book = portfolio ?? new Portfolio(config.dataDirAbsolute, config.risk);

  onProgress('managing', { open: book.openPositions.length });
  const managed = await managePositions(book, config, { signal });
  for (const trade of managed.closed) {
    log.info(
      `closed ${trade.symbol}: ${(trade.pnlPct * 100).toFixed(1)}% ($${trade.pnlUsd.toFixed(2)}) — ${trade.exitReason}`,
    );
    appendJsonl(config.dataDirAbsolute, 'trades.jsonl', { type: 'close', ...trade });
  }

  onProgress('discovering', {});
  const candidates = await discover(config, { signal });
  log.debug(`discovered ${candidates.length} candidate addresses`);

  onProgress('enriching', { candidates: candidates.length });
  const tokens = await enrich(candidates.map((c) => c.address), config, { signal });
  log.debug(`enriched ${tokens.length} tokens with market data`);

  // Skip what we already hold (managePositions owns those) and what we just
  // closed — re-analysing either wastes an API call on a token we can't buy.
  const fresh = tokens.filter((token) => !book.has(token.address) && !book.isCoolingDown(token.address));
  onProgress('analyzing', { tokens: fresh.length });
  const results = await analyze(fresh, config, { signal, anthropic });
  results.sort((a, b) => b.decision.score - a.decision.score);

  onProgress('trading', { entries: results.filter((r) => r.decision.action === ACTIONS.ENTER).length });
  const opened = [];
  for (const result of results) {
    if (result.decision.action !== ACTIONS.ENTER) continue;
    if (dryRun) {
      log.info(`[dry run] would enter ${result.token.symbol} at ${result.decision.score.toFixed(2)}`);
      continue;
    }
    const size = book.sizeFor(result.token);
    if (!(size > 0)) {
      log.debug(`no room for ${result.token.symbol} (position limit or pool too thin)`);
      continue;
    }
    const position = book.open(result.token, {
      sizeUsd: size,
      score: result.decision.score,
      reason: result.decision.reasons.join('; '),
    });
    if (position) {
      opened.push(position);
      log.info(
        `opened ${position.symbol} — $${size.toFixed(2)} at $${position.entryPriceUsd.toPrecision(4)} (score ${result.decision.score.toFixed(2)})`,
      );
      appendJsonl(config.dataDirAbsolute, 'trades.jsonl', { type: 'open', ...position });
    }
  }

  for (const result of results) {
    appendJsonl(config.dataDirAbsolute, 'signals.jsonl', {
      at: new Date().toISOString(),
      address: result.token.address,
      symbol: result.token.symbol,
      score: result.decision.score,
      action: result.decision.action,
      breakdown: result.decision.breakdown,
      reasons: result.decision.reasons,
      liquidityUsd: num(result.token.liquidityUsd),
      priceUsd: num(result.token.priceUsd),
    });
  }

  return {
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    candidates: candidates.length,
    analyzed: results.length,
    results,
    opened,
    closed: managed.closed,
    portfolio: book,
  };
}
