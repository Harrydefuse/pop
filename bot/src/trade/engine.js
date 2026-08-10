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
import { safetyFor, venueAllowed, venueFor } from '../venues/index.js';
import { assessMomentum } from '../analysis/momentum.js';
import { assessNarratives } from '../analysis/narrative.js';
import { ACTIONS, decide } from '../analysis/score.js';
import { Portfolio } from './portfolio.js';
import { createExecutor } from '../execute/index.js';
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
export async function enrich(addresses, config, { signal, ignoreVenueFilter = false } = {}) {
  if (addresses.length === 0) return [];
  const pairs = await dex.pairsForTokens(config.chain, addresses, { signal });
  const now = Date.now();
  const tokens = [...dex.groupByBaseToken(pairs).values()].map((pair) => dex.normalizePair(pair, now));

  // Venue is a hard filter, not a score: if we cannot execute on it, there is
  // no point paying to analyse it.
  const allowed = ignoreVenueFilter ? [] : config.discovery.venues;
  return tokens
    .filter((token) => venueAllowed(token.dexId, allowed))
    .map((token) => ({ ...token, venue: venueFor(token.dexId) }));
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
    // Bonding-curve tokens are judged against their own thresholds; see
    // safety.venueOverrides in config.js for why.
    const safety = assessSafety(token, onChain.get(token.address), safetyFor(token.dexId, config.safety));
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

/**
 * Mark open positions and close any that hit an exit rule.
 *
 * Exits go through the executor, so a live position is sold on chain rather
 * than merely removed from the ledger.
 */
export async function managePositions(portfolio, config, { signal, executor } = {}) {
  const open = portfolio.openPositions;
  if (open.length === 0) return { marked: 0, closed: [], failedExits: [] };

  const prices = await dex.pricesForTokens(config.chain, open.map((p) => p.address), { signal });
  const closed = [];
  const failedExits = [];
  const now = Date.now();

  for (const position of open) {
    const quote = prices.get(position.address);
    if (!quote || !(quote.priceUsd > 0)) {
      log.warn(`no price for ${position.symbol} (${position.address}) — holding`);
      continue;
    }
    portfolio.mark(position.address, quote.priceUsd);
    const signalResult = portfolio.exitSignal(position, quote.priceUsd, now);
    if (!signalResult.exit) continue;

    const result = await executor.sell(position, {
      priceUsd: quote.priceUsd,
      liquidityUsd: quote.liquidityUsd,
      reason: signalResult.reason,
      token: quote.pair ? dex.normalizePair(quote.pair, now) : undefined,
      signal,
    });

    if (result.ok) closed.push(result.trade);
    else {
      // A position we cannot exit stays open and is reported — silently
      // dropping it from the ledger would be worse than the failure itself.
      failedExits.push({ symbol: position.symbol, address: position.address, reason: result.reason, detail: result.detail });
      log.error(`could not exit ${position.symbol}: ${result.reason}`);
    }
  }

  portfolio.save();
  return { marked: prices.size, closed, failedExits };
}

/**
 * One full cycle. Returns everything it looked at so the CLI can render it.
 *
 * @param {object} options.dryRun  analyse and report, but never open positions
 */
export async function runCycle(
  config,
  { signal, anthropic, dryRun = false, portfolio, executor, onProgress = () => {} } = {},
) {
  const started = Date.now();
  const book = portfolio ?? new Portfolio(config.dataDirAbsolute, config.risk);
  const orders = executor ?? createExecutor(config, { portfolio: book });

  onProgress('managing', { open: book.openPositions.length });
  const managed = await managePositions(book, config, { signal, executor: orders });
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
  const rejectedOrders = [];
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

    const filled = await orders.buy(result.token, {
      sizeUsd: size,
      score: result.decision.score,
      reason: result.decision.reasons.join('; '),
      signal,
    });

    if (!filled.ok) {
      // Refusals are normal — a guard limit, a missing route, a bad quote.
      // Record them so the operator can see why nothing was bought.
      rejectedOrders.push({ symbol: result.token.symbol, reason: filled.reason, detail: filled.detail });
      log.debug(`order for ${result.token.symbol} not filled: ${filled.reason}`);
      continue;
    }

    const position = filled.position;
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
    mode: orders.mode,
    results,
    opened,
    rejectedOrders,
    closed: managed.closed,
    failedExits: managed.failedExits ?? [],
    portfolio: book,
  };
}
