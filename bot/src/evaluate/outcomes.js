/**
 * Closing the loop: did the scores actually predict anything?
 *
 * The bot logs every decision to `signals.jsonl`, including the price at the
 * moment it scored. This module looks those tokens up again after a horizon has
 * elapsed and records the forward return, producing a labelled dataset of
 * (score → what happened next).
 *
 * Without this the weights in `scoring.weights` are guesses that never get
 * checked, and a strategy can run for months on intuition alone.
 *
 * **Survivorship bias is the trap here.** A token that rugged to zero, or whose
 * pair vanished from the API, is exactly the outcome that matters most — and it
 * is also the one most likely to go missing. Missing prices are counted and
 * reported rather than quietly dropped, because dropping them makes every
 * strategy look better than it is.
 */
import { HOUR, num, uniqueBy } from '../util.js';
import { appendJsonl, readJsonl } from '../store.js';
import { log } from '../log.js';
import * as dex from '../sources/dexscreener.js';

/** A signal is due for measurement once it is at least `horizonHours` old. */
export function isDue(signal, { horizonHours, now = Date.now() }) {
  const age = now - new Date(signal.at).getTime();
  return age >= horizonHours * HOUR;
}

/**
 * Pair each due signal with its current price and compute the forward return.
 *
 * @param {object[]} signals   entries from signals.jsonl
 * @param {Map} prices         address -> { priceUsd, liquidityUsd }
 */
export function measure(signals, prices, { horizonHours, now = Date.now() } = {}) {
  const measured = [];
  const missing = [];

  for (const signal of signals) {
    if (!isDue(signal, { horizonHours, now })) continue;

    const entryPrice = num(signal.priceUsd);
    if (!(entryPrice > 0)) continue;

    const quote = prices.get(signal.address);
    const exitPrice = num(quote?.priceUsd);

    if (!(exitPrice > 0)) {
      // Could be a rug, a delisting, or an API gap — we genuinely cannot tell
      // the difference, so it is recorded as unmeasurable rather than as a loss
      // (which would overstate) or dropped (which would understate).
      missing.push({
        at: signal.at,
        address: signal.address,
        symbol: signal.symbol,
        score: signal.score,
        action: signal.action,
        reason: 'no current price — delisted, rugged, or not returned by the API',
      });
      continue;
    }

    const elapsedHours = (now - new Date(signal.at).getTime()) / HOUR;
    measured.push({
      at: signal.at,
      measuredAt: new Date(now).toISOString(),
      address: signal.address,
      symbol: signal.symbol,
      score: signal.score,
      action: signal.action,
      breakdown: signal.breakdown,
      entryPriceUsd: entryPrice,
      exitPriceUsd: exitPrice,
      forwardReturn: exitPrice / entryPrice - 1,
      elapsedHours,
      liquidityUsdAtSignal: num(signal.liquidityUsd),
      liquidityUsdNow: num(quote?.liquidityUsd),
    });
  }

  return { measured, missing };
}

/**
 * Run one measurement pass and append the results.
 *
 * Already-measured signals are skipped, so this is safe to run repeatedly — the
 * outcome ledger accumulates rather than being recomputed from a moving "now".
 */
export async function collectOutcomes(config, { horizonHours = 24, now = Date.now(), signal } = {}) {
  const signals = readJsonl(config.dataDirAbsolute, 'signals.jsonl', { limit: 5000 });
  if (signals.length === 0) {
    return { measured: [], missing: [], skipped: 0, reason: 'no signals logged yet' };
  }

  const already = new Set(
    readJsonl(config.dataDirAbsolute, 'outcomes.jsonl', { limit: 20_000 }).map(keyFor),
  );
  const pending = signals.filter((entry) => !already.has(keyFor(entry)));
  const due = pending.filter((entry) => isDue(entry, { horizonHours, now }));

  if (due.length === 0) {
    return { measured: [], missing: [], skipped: pending.length, reason: 'nothing has aged past the horizon yet' };
  }

  const addresses = uniqueBy(due, (entry) => entry.address).map((entry) => entry.address);
  log.debug(`measuring ${due.length} signals across ${addresses.length} tokens`);

  const prices = await dex.pricesForTokens(config.chain, addresses, { signal });
  const { measured, missing } = measure(due, prices, { horizonHours, now });

  for (const outcome of measured) appendJsonl(config.dataDirAbsolute, 'outcomes.jsonl', outcome);
  for (const gap of missing) appendJsonl(config.dataDirAbsolute, 'outcomes.jsonl', { ...gap, unmeasurable: true });

  return { measured, missing, skipped: pending.length - due.length };
}

/** Stable identity for a signal: one token, one cycle. */
export function keyFor(entry) {
  return `${entry.address}@${entry.at}`;
}

/** Everything measured so far, excluding the unmeasurable entries. */
export function loadOutcomes(config, { limit = 20_000 } = {}) {
  const all = readJsonl(config.dataDirAbsolute, 'outcomes.jsonl', { limit });
  return {
    measured: all.filter((entry) => !entry.unmeasurable),
    unmeasurable: all.filter((entry) => entry.unmeasurable),
  };
}
