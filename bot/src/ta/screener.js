/**
 * Futures screener.
 *
 * Answers "find every contract where RSI is below X and volume is Y times its
 * average, at the same time" against exchange data directly. No browser, no UI
 * automation, no scraping — a public REST API, which is faster, reproducible,
 * and doesn't put a charting account at risk.
 *
 * Default venue is Binance USDT-M perpetuals because the endpoints are public
 * and keyless. `fetchCandles`/`fetchSymbols` are injectable so another exchange
 * is a small adapter, not a rewrite.
 */
import { RateLimiter, chunk, withRetry } from '../util.js';
import { log } from '../log.js';
import { rsi, volumeRatio, zScore } from './indicators.js';

const BINANCE_FUTURES = 'https://fapi.binance.com';

// Binance's futures REST budget is generous but weighted; klines cost more than
// their raw request count suggests, so this stays conservative.
const limiter = new RateLimiter(600);

async function getJson(url, { signal } = {}) {
  await limiter.take();
  return withRetry(
    async () => {
      const response = await fetch(url, { headers: { accept: 'application/json' }, signal });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${new URL(url).pathname} -> ${response.status}: ${body.slice(0, 200)}`);
      }
      return response.json();
    },
    { attempts: 3, baseMs: 500, onRetry: (error, attempt) => log.debug(`screener retry ${attempt}: ${error.message}`) },
  );
}

/** Tradeable perpetual symbols, optionally filtered. */
export async function fetchSymbols({ quote = 'USDT', contains = '', signal } = {}) {
  const info = await getJson(`${BINANCE_FUTURES}/fapi/v1/exchangeInfo`, { signal });
  return (info.symbols ?? [])
    .filter((symbol) => symbol.status === 'TRADING')
    .filter((symbol) => symbol.contractType === 'PERPETUAL')
    .filter((symbol) => !quote || symbol.quoteAsset === quote)
    .filter((symbol) => !contains || symbol.symbol.includes(contains.toUpperCase()))
    .map((symbol) => ({
      symbol: symbol.symbol,
      base: symbol.baseAsset,
      quote: symbol.quoteAsset,
    }));
}

/**
 * OHLCV for one symbol, oldest first.
 *
 * The final candle Binance returns is the one still forming. It is dropped by
 * default: an indicator computed on a partial bar changes every few seconds and
 * will repaint, so a screener that keeps it reports signals that evaporate.
 */
export async function fetchCandles(symbol, { interval = '4h', limit = 200, includeUnclosed = false, signal } = {}) {
  const url = `${BINANCE_FUTURES}/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
  const raw = await getJson(url, { signal });

  const candles = raw.map((row) => ({
    openTime: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
    closeTime: Number(row[6]),
    quoteVolume: Number(row[7]),
    trades: Number(row[8]),
  }));

  if (includeUnclosed) return candles;
  return candles.filter((candle) => candle.closeTime < Date.now());
}

/**
 * Evaluate one symbol's candles against the criteria.
 * Returns the reading whether or not it matched, so near-misses are inspectable.
 */
export function evaluate(symbol, candles, criteria) {
  if (candles.length < criteria.rsiPeriod + 2) {
    return { symbol, matched: false, reason: 'not enough history' };
  }

  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);

  const rsiSeries = rsi(closes, criteria.rsiPeriod);
  const ratioSeries = volumeRatio(volumes, criteria.volumePeriod);
  const zSeries = zScore(volumes, criteria.volumePeriod);

  const last = candles.length - 1;
  const reading = {
    symbol,
    closeTime: candles[last].closeTime,
    price: closes[last],
    rsi: rsiSeries[last],
    volumeRatio: ratioSeries[last],
    volumeZ: zSeries[last],
    priceChangePct: closes[last] / closes[last - 1] - 1,
  };

  if (reading.rsi === null || reading.volumeRatio === null) {
    return { ...reading, matched: false, reason: 'indicators still in warm-up' };
  }

  const rsiOk = criteria.rsiBelow === null || reading.rsi < criteria.rsiBelow;
  const rsiAboveOk = criteria.rsiAbove === null || reading.rsi > criteria.rsiAbove;
  const volumeOk = reading.volumeRatio >= criteria.minVolumeRatio;

  return {
    ...reading,
    matched: rsiOk && rsiAboveOk && volumeOk,
    checks: { rsiOk, rsiAboveOk, volumeOk },
  };
}

/**
 * Run the screen across every symbol.
 *
 * @param {object} criteria
 *   rsiBelow        — RSI must be under this (null to ignore)
 *   rsiAbove        — RSI must be over this (null to ignore)
 *   minVolumeRatio  — volume as a multiple of its own average. NOTE: "+200%"
 *                     is ambiguous in every post that uses it; 3 means three
 *                     times the average, 2 means twice. State which you mean.
 */
export async function screen({
  interval = '4h',
  quote = 'USDT',
  contains = '',
  rsiPeriod = 14,
  rsiBelow = 30,
  rsiAbove = null,
  volumePeriod = 20,
  minVolumeRatio = 3,
  limit = 200,
  concurrency = 8,
  signal,
  sources = {},
} = {}) {
  const getSymbols = sources.fetchSymbols ?? fetchSymbols;
  const getCandles = sources.fetchCandles ?? fetchCandles;

  const symbols = await getSymbols({ quote, contains, signal });
  log.debug(`screening ${symbols.length} symbols on ${interval}`);

  const criteria = { rsiPeriod, rsiBelow, rsiAbove, volumePeriod, minVolumeRatio };
  const readings = [];
  const failures = [];

  // Bounded concurrency: enough to be quick, not enough to trip a rate limit.
  for (const batch of chunk(symbols, concurrency)) {
    const settled = await Promise.allSettled(
      batch.map(async (entry) => {
        const candles = await getCandles(entry.symbol, { interval, limit, signal });
        return evaluate(entry.symbol, candles, criteria);
      }),
    );
    for (const [index, result] of settled.entries()) {
      if (result.status === 'fulfilled') readings.push(result.value);
      else failures.push({ symbol: batch[index].symbol, error: result.reason?.message });
    }
  }

  const matches = readings
    .filter((reading) => reading.matched)
    .sort((a, b) => a.rsi - b.rsi);

  return {
    interval,
    criteria,
    scanned: readings.length,
    failed: failures,
    matches,
    /** Everything that cleared one condition but not the other. */
    nearMisses: readings
      .filter((r) => !r.matched && r.checks && (r.checks.rsiOk || r.checks.volumeOk))
      .sort((a, b) => (a.rsi ?? 99) - (b.rsi ?? 99))
      .slice(0, 20),
  };
}
