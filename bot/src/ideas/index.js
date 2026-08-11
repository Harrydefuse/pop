/**
 * Trade ideas end to end.
 *
 * candidates → structure → setup → confluence → explanation → ranked list
 *
 * The ordering is the same discipline the memecoin engine uses: everything
 * mechanical runs first and throws most candidates away, and the model is only
 * asked about the ones that already survived. Most symbols never produce an
 * idea — that is the expected outcome, not a bug. A tool that always finds a
 * trade is a tool that is not screening.
 */
import { chunk } from '../util.js';
import { log } from '../log.js';
import { fetchCandles, fetchSymbols } from '../ta/screener.js';
import { analyseStructure } from './levels.js';
import { buildSetup, confluence, drawings } from './setup.js';
import { explain } from './rationale.js';

/** Analyse one symbol's candles into a complete idea, or a reasoned rejection. */
export function analyseSymbol(symbol, candles, { interval = '4h', setupOptions = {} } = {}) {
  if (candles.length < 60) {
    return { symbol, interval, ok: false, reason: 'fewer than 60 bars of history' };
  }

  const structure = analyseStructure(candles);
  const setup = buildSetup(structure, candles, setupOptions);
  if (!setup.ok) {
    return { symbol, interval, ok: false, reason: setup.reason, structure, riskReward: setup.riskReward };
  }

  const factors = confluence(structure, candles, setup);
  return {
    symbol,
    interval,
    ok: true,
    price: structure.price,
    structure,
    setup,
    confluence: factors,
    drawings: drawings(structure, setup),
    candles: candles.slice(-120),
    /**
     * Rank on agreement first, reward-to-risk second. A 5R setup that only one
     * factor supports is a lottery ticket; a 2R setup everything agrees on is a
     * trade.
     */
    rank: factors.score * 0.65 + Math.min(setup.riskReward / 4, 1) * 0.35,
  };
}

/**
 * Find ideas across a set of symbols.
 *
 * @param {object} options
 *   symbols     explicit list, or omitted to scan the exchange's perpetuals
 *   minRank     drop anything below this before spending a model call
 *   explainTop  how many of the survivors to have Claude write up
 */
export async function findIdeas(config, {
  symbols,
  interval = '4h',
  bars = 300,
  quote = 'USDT',
  contains = '',
  minRank = 0.55,
  explainTop = 5,
  concurrency = 6,
  setupOptions = {},
  anthropic,
  signal,
  sources = {},
} = {}) {
  const getSymbols = sources.fetchSymbols ?? fetchSymbols;
  const getCandles = sources.fetchCandles ?? fetchCandles;

  const universe = symbols?.length
    ? symbols.map((symbol) => ({ symbol: symbol.toUpperCase() }))
    : await getSymbols({ quote, contains, signal });

  log.debug(`analysing ${universe.length} symbols on ${interval}`);

  const ideas = [];
  const rejected = [];

  for (const batch of chunk(universe, concurrency)) {
    const settled = await Promise.allSettled(
      batch.map(async (entry) => {
        const candles = await getCandles(entry.symbol, { interval, limit: bars, signal });
        return analyseSymbol(entry.symbol, candles, { interval, setupOptions });
      }),
    );

    for (const [index, result] of settled.entries()) {
      if (result.status === 'rejected') {
        rejected.push({ symbol: batch[index].symbol, reason: result.reason?.message ?? 'fetch failed' });
        continue;
      }
      if (result.value.ok) ideas.push(result.value);
      else rejected.push({ symbol: result.value.symbol, reason: result.value.reason });
    }
  }

  ideas.sort((a, b) => b.rank - a.rank);
  const qualifying = ideas.filter((idea) => idea.rank >= minRank);

  // Only the top few get an explanation — each is an API call.
  const toExplain = qualifying.slice(0, explainTop);
  for (const idea of toExplain) {
    idea.rationale = await explain(idea, config.narrative, { client: anthropic });
  }

  return {
    interval,
    scanned: universe.length,
    ideas: qualifying,
    belowThreshold: ideas.filter((idea) => idea.rank < minRank).length,
    rejected,
    explained: toExplain.length,
  };
}

export { analyseStructure } from './levels.js';
export { buildSetup, confluence, drawings } from './setup.js';
export { explain } from './rationale.js';
