/**
 * Indicators, statistics and the backtest engine.
 *
 * The indicator tests use hand-computed expectations rather than a snapshot of
 * this implementation's own output — a snapshot test would happily lock in a
 * wrong formula, and RSI has a well-known wrong variant (plain EMA instead of
 * Wilder smoothing) that looks close enough to pass a loose eyeball check.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { atr, ema, roc, rsi, sma, stdev, volumeRatio, zScore } from '../src/ta/indicators.js';
import { bootstrapReturns, maxDrawdown, requiredSampleSize, summarise, wilsonInterval } from '../src/ta/stats.js';
import { backtest, rsiVolumeSignal } from '../src/ta/backtest.js';
import { evaluate, screen } from '../src/ta/screener.js';
import { screenerAlertScript, strategyScript, whaleMomentumScript } from '../src/ta/pine.js';

const close = (n) => Number(n.toFixed(10));

// ── indicators ───────────────────────────────────────────────────────────────

test('sma is null during warm-up and correct after', () => {
  const result = sma([1, 2, 3, 4, 5], 3);
  assert.deepEqual(result.slice(0, 2), [null, null]);
  assert.deepEqual(result.slice(2), [2, 3, 4]);
});

test('ema seeds from the SMA and tracks the input', () => {
  const result = ema([1, 2, 3, 4, 5], 3);
  assert.equal(result[1], null);
  assert.equal(result[2], 2, 'seed is the SMA of the first 3');
  // k = 2/(3+1) = 0.5 → 4*0.5 + 2*0.5 = 3
  assert.equal(result[3], 3);
  assert.equal(result[4], 4);
});

test('rsi matches values computed by hand with Wilder smoothing', () => {
  // closes: 10, 11, 10.5, 11.5, 11, 12  |  period 3
  // deltas:   +1, -0.5,   +1, -0.5,  +1
  //
  // Seed (first 3 deltas): avgGain = (1+0+1)/3 = 0.666…, avgLoss = 0.5/3 = 0.166…
  //   RS = 4          → RSI = 100 - 100/5   = 80
  // Next (-0.5): avgGain = (0.666…*2+0)/3 = 0.444…, avgLoss = (0.166…*2+0.5)/3 = 0.277…
  //   RS = 1.6        → RSI = 100 - 100/2.6 = 61.538…
  // Next (+1):   avgGain = (0.444…*2+1)/3 = 0.629…, avgLoss = (0.277…*2+0)/3 = 0.185…
  //   RS = 3.4        → RSI = 100 - 100/4.4 = 77.272…
  const result = rsi([10, 11, 10.5, 11.5, 11, 12], 3);

  assert.deepEqual(result.slice(0, 3), [null, null, null]);
  assert.equal(close(result[3]), 80);
  assert.ok(Math.abs(result[4] - (100 - 100 / 2.6)) < 1e-9, `got ${result[4]}`);
  assert.ok(Math.abs(result[5] - (100 - 100 / 4.4)) < 1e-9, `got ${result[5]}`);
});

test('rsi saturates rather than dividing by zero', () => {
  const rising = rsi([1, 2, 3, 4, 5, 6, 7], 3);
  assert.equal(rising.at(-1), 100, 'no losses in the window');

  const falling = rsi([7, 6, 5, 4, 3, 2, 1], 3);
  assert.equal(falling.at(-1), 0, 'no gains in the window');

  const flat = rsi([5, 5, 5, 5, 5, 5], 3);
  assert.equal(flat.at(-1), 50, 'no movement at all is neutral, not 100');
});

test('rsi uses Wilder 1/n smoothing, not a plain EMA', () => {
  // This pins the smoothing constant, which is the difference between this
  // implementation and the common wrong one. Wilder decays the running average
  // by (n-1)/n each bar; a plain EMA(n) would decay by (n-1)/(n+1). For n = 3
  // that is 2/3 versus 1/2 — far apart enough that these hand-computed values
  // cannot pass under the wrong formula.
  //
  // closes: 10, 11, 10.5, 11.5, then three bars of exactly -0.5.
  // Seed at index 3: avgGain = 2/3, avgLoss = 1/6.
  //   i=4: avgGain = 4/9      = 0.444444, avgLoss = 5/18     = 0.277778 → RS 1.600000
  //   i=5: avgGain = 8/27     = 0.296296, avgLoss = 19/54    = 0.351852 → RS 0.842105
  //   i=6: avgGain = 16/81    = 0.197531, avgLoss = 65/162   = 0.401235 → RS 0.492308
  const result = rsi([10, 11, 10.5, 11.5, 11, 10.5, 10], 3);

  const expected = [1.6, 0.8421052631578947, 0.4923076923076923].map((rs) => 100 - 100 / (1 + rs));
  assert.ok(Math.abs(result[4] - expected[0]) < 1e-9, `i=4: got ${result[4]}`);
  assert.ok(Math.abs(result[5] - expected[1]) < 1e-9, `i=5: got ${result[5]}`);
  assert.ok(Math.abs(result[6] - expected[2]) < 1e-9, `i=6: got ${result[6]}`);

  // Each successive avgGain is exactly 2/3 of the previous one. Under an EMA it
  // would be 1/2, which would put i=6 several points lower.
  assert.ok(result[6] > 32 && result[6] < 34, `Wilder decay expected ~32.99, got ${result[6]}`);
});

test('atr uses true range, including gaps', () => {
  const candles = [
    { high: 10, low: 9, close: 9.5 },
    { high: 12, low: 11, close: 11.5 }, // gap up: TR is 12-9.5 = 2.5, not 1
    { high: 12, low: 11, close: 11.5 },
    { high: 12, low: 11, close: 11.5 },
  ];
  const result = atr(candles, 2);
  assert.equal(result[0], null);
  assert.equal(result[1], null);
  // Seed = mean of TR[1..2] = (2.5 + 1)/2 = 1.75
  assert.equal(close(result[2]), 1.75);
});

test('volumeRatio measures against an average that includes the current bar', () => {
  // A deliberate choice, and a subtle one. The baseline SMA includes the bar
  // being measured, so a spike partly raises its own denominator: 30 against
  // [10, 10, 30] is 30/16.67 = 1.8x, not 30/10 = 3x.
  //
  // This is kept because it matches the TradingView idiom the generated Pine
  // uses (`volume > ta.sma(volume, n) * mult`). Consistency between the two
  // matters more than the marginally stronger signal of an exclusive window —
  // the whole point of emitting Pine is that it agrees with the local engine.
  const result = volumeRatio([10, 10, 10, 30], 3);
  assert.equal(result[2], 1, 'flat volume sits exactly on its average');
  assert.ok(Math.abs(result[3] - 30 / (50 / 3)) < 1e-12, `got ${result[3]}`);
  assert.ok(result[3] > 1.79 && result[3] < 1.81);
});

test('zScore and stdev handle a flat series without dividing by zero', () => {
  assert.equal(stdev([5, 5, 5, 5], 3).at(-1), 0);
  assert.equal(zScore([5, 5, 5, 5], 3).at(-1), null, 'no deviation means no meaningful z');
});

test('roc returns fractional change and null before the lookback', () => {
  const result = roc([100, 110, 121], 1);
  assert.equal(result[0], null);
  assert.ok(Math.abs(result[1] - 0.1) < 1e-12);
  assert.ok(Math.abs(result[2] - 0.1) < 1e-12);
});

// ── statistics ───────────────────────────────────────────────────────────────

test('wilson interval is wide at small n — the whole point', () => {
  // The claim that prompted this file: 83% from 9 trades.
  const small = wilsonInterval(7.5, 9);
  assert.ok(small.low < 0.6, `lower bound should admit near-coin-flip, got ${small.low}`);
  assert.ok(small.high > 0.9);

  // Same rate, far more trades: the interval tightens and the claim means something.
  const large = wilsonInterval(750, 900);
  assert.ok(large.high - large.low < 0.06);
  assert.ok(large.low > 0.8);
});

test('wilson interval stays inside [0,1] at the extremes', () => {
  const perfect = wilsonInterval(5, 5);
  assert.ok(perfect.high <= 1);
  assert.ok(perfect.low < 1, 'five wins is not proof of a 100% system');

  const none = wilsonInterval(0, 5);
  assert.ok(none.low >= 0);
});

test('requiredSampleSize quantifies how much evidence an edge needs', () => {
  assert.ok(requiredSampleSize(0.05) > 350, 'a 5-point edge needs hundreds of trades');
  assert.ok(requiredSampleSize(0.2) < requiredSampleSize(0.05));
  assert.equal(requiredSampleSize(0), Infinity);
});

test('maxDrawdown finds the worst peak-to-trough decline', () => {
  assert.ok(Math.abs(maxDrawdown([100, 120, 60, 90]) - 0.5) < 1e-12);
  assert.equal(maxDrawdown([100, 110, 120]), 0);
});

test('summarise refuses to call a 9-trade sample reliable', () => {
  const trades = Array.from({ length: 9 }, (_, i) => ({
    pnlUsd: i < 7 ? 600 : -400,
    pnlPct: i < 7 ? 0.06 : -0.04,
  }));

  const stats = summarise(trades);
  assert.equal(stats.trades, 9);
  assert.equal(stats.reliable, false);
  assert.match(stats.verdict, /too few/);
  assert.ok(stats.winRateLow < 0.6, 'the interval must reach down toward a coin flip');
  assert.ok(stats.expectancyUsd > 0, 'it can still be positive — just not established');
});

test('summarise returns a complete zeroed shape when there are no trades', () => {
  // A partial object here is a trap: any consumer not checking `trades` first
  // silently formats NaN into a report.
  const stats = summarise([]);
  for (const key of ['totalPnlUsd', 'expectancyUsd', 'winRate', 'winRateLow', 'winRateHigh', 'wins', 'losses']) {
    assert.equal(typeof stats[key], 'number', `${key} must be a number, got ${stats[key]}`);
  }
  assert.equal(stats.trades, 0);
  assert.equal(stats.reliable, false);
  assert.equal(stats.profitFactor, null);
  assert.match(stats.verdict, /No trades/);
});

test('summarise computes the break-even win rate from the payoff ratio', () => {
  // Wins of 100, losses of 100 → break-even is 50%.
  const even = summarise([
    { pnlUsd: 100, pnlPct: 0.01 },
    { pnlUsd: -100, pnlPct: -0.01 },
  ]);
  assert.ok(Math.abs(even.breakEvenWinRate - 0.5) < 1e-9);

  // Wins of 300, losses of 100 → break-even is 25%.
  const skewed = summarise([
    { pnlUsd: 300, pnlPct: 0.03 },
    { pnlUsd: -100, pnlPct: -0.01 },
  ]);
  assert.ok(Math.abs(skewed.breakEvenWinRate - 0.25) < 1e-9);
});

test('summarise marks a large, genuinely positive sample as reliable', () => {
  const trades = Array.from({ length: 200 }, (_, i) => ({
    pnlUsd: i % 3 === 0 ? -50 : 60,
    pnlPct: i % 3 === 0 ? -0.005 : 0.006,
  }));
  const stats = summarise(trades);
  assert.equal(stats.reliable, true);
  assert.ok(stats.winRateLow > 0.5);
});

test('bootstrap exposes how much of a result was sequence luck', () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const trades = Array.from({ length: 9 }, (_, i) => ({
    pnlUsd: i < 7 ? 600 : -400,
    pnlPct: i < 7 ? 0.06 : -0.04,
  }));

  const result = bootstrapReturns(trades, { iterations: 500, random });
  assert.ok(result.p05 < result.median && result.median < result.p95);
  assert.ok(result.probabilityOfLoss >= 0 && result.probabilityOfLoss <= 1);
});

// ── backtest ─────────────────────────────────────────────────────────────────

/** Build a synthetic series with a controllable shape. */
function series(closes, { volume = 100 } = {}) {
  return closes.map((value, i) => ({
    openTime: i * 3_600_000,
    closeTime: (i + 1) * 3_600_000 - 1,
    open: i === 0 ? value : closes[i - 1],
    high: Math.max(value, i === 0 ? value : closes[i - 1]) * 1.01,
    low: Math.min(value, i === 0 ? value : closes[i - 1]) * 0.99,
    close: value,
    volume: typeof volume === 'function' ? volume(i) : volume,
  }));
}

test('backtest never fills on the signal bar', () => {
  const candles = series([10, 10, 10, 10, 10, 10, 10, 10]);
  const signals = candles.map((_, i) => i === 3);

  const result = backtest(candles, signals, { atrPeriod: 2, maxBars: 2 });
  if (result.trades.length > 0) {
    // Entry must be at the open of bar 4, never bar 3.
    assert.ok(result.trades[0].entryTime >= candles[4].openTime);
  }
});

test('backtest resolves an ambiguous bar as the stop, not the target', () => {
  // A bar whose range spans both levels. Intrabar order is unknowable, so the
  // engine must take the pessimistic reading.
  const candles = series([100, 100, 100, 100, 100, 100]);
  candles[5] = { ...candles[5], high: 200, low: 1 };

  const signals = candles.map((_, i) => i === 3);
  const result = backtest(candles, signals, { atrPeriod: 2, stopAtrMult: 0.5, targetAtrMult: 0.5, maxBars: 10 });

  if (result.trades.length) {
    assert.equal(result.trades[0].reason, 'stop');
    assert.ok(result.trades[0].pnlUsd < 0);
  }
});

test('backtest charges costs on a round trip that goes nowhere', () => {
  const candles = series(Array.from({ length: 30 }, () => 100));
  const signals = candles.map((_, i) => i === 20);

  const result = backtest(candles, signals, {
    atrPeriod: 5,
    maxBars: 2,
    feePct: 0.001,
    slippagePct: 0.001,
  });

  for (const trade of result.trades) {
    assert.ok(trade.pnlUsd < 0, 'a flat round trip must lose the costs');
  }
});

test('backtest reports the assumptions it used', () => {
  const candles = series(Array.from({ length: 20 }, (_, i) => 100 + i));
  const result = backtest(candles, candles.map(() => false), {});
  assert.equal(result.assumptions.fill, 'next bar open');
  assert.equal(result.assumptions.ambiguousBars, 'resolved as stop');
});

test('rsiVolumeSignal only fires when both conditions hold', () => {
  // Falling price drives RSI down; a volume spike lands on the final bar only.
  const closes = Array.from({ length: 40 }, (_, i) => 100 - i);
  const candles = series(closes, { volume: (i) => (i === 39 ? 1000 : 100) });

  const signals = rsiVolumeSignal(candles, { rsiPeriod: 14, rsiBelow: 30, volumePeriod: 20, minVolumeRatio: 3 });

  assert.equal(signals[39], true, 'oversold and a volume surge together');
  assert.equal(signals[38], false, 'oversold but ordinary volume');
  assert.equal(signals.slice(0, 14).every((flag) => flag === false), true, 'never during warm-up');
});

// ── screener ─────────────────────────────────────────────────────────────────

test('screener evaluates both conditions and explains a near miss', () => {
  const closes = Array.from({ length: 40 }, (_, i) => 100 - i);
  const candles = series(closes, { volume: 100 });

  const reading = evaluate('TESTUSDT', candles, {
    rsiPeriod: 14,
    rsiBelow: 30,
    rsiAbove: null,
    volumePeriod: 20,
    minVolumeRatio: 3,
  });

  assert.equal(reading.matched, false);
  assert.equal(reading.checks.rsiOk, true);
  assert.equal(reading.checks.volumeOk, false, 'flat volume cannot be a surge');
});

test('screener drops symbols without enough history instead of guessing', () => {
  const reading = evaluate('SHORTUSDT', series([1, 2, 3]), {
    rsiPeriod: 14,
    rsiBelow: 30,
    rsiAbove: null,
    volumePeriod: 20,
    minVolumeRatio: 3,
  });
  assert.equal(reading.matched, false);
  assert.match(reading.reason, /not enough history/);
});

test('screen aggregates matches and survives a per-symbol failure', async () => {
  const hit = series(
    Array.from({ length: 40 }, (_, i) => 100 - i),
    { volume: (i) => (i === 39 ? 1000 : 100) },
  );
  const miss = series(Array.from({ length: 40 }, (_, i) => 100 + i), { volume: 100 });

  const result = await screen({
    sources: {
      fetchSymbols: async () => [
        { symbol: 'HITUSDT' },
        { symbol: 'MISSUSDT' },
        { symbol: 'BROKENUSDT' },
      ],
      fetchCandles: async (symbol) => {
        if (symbol === 'BROKENUSDT') throw new Error('delisted');
        return symbol === 'HITUSDT' ? hit : miss;
      },
    },
  });

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].symbol, 'HITUSDT');
  assert.equal(result.scanned, 2);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].symbol, 'BROKENUSDT');
});

// ── pine ─────────────────────────────────────────────────────────────────────

test('pine strategy pins the version and does not fill on the signal bar', () => {
  const script = strategyScript({ rsiBelow: 25 });
  assert.match(script, /\/\/@version=6/);
  assert.match(script, /process_orders_on_close\s*=\s*false/);
  assert.match(script, /rsiTrigger\s*=\s*input\.float\(25/);
  assert.match(script, /commission_type\s*=\s*strategy\.commission\.percent/);
});

test('pine oscillator states plainly that whale activity is a proxy', () => {
  const script = whaleMomentumScript();
  assert.match(script, /\/\/@version=6/);
  assert.match(script, /cannot see wallets/i);
  assert.match(script, /proxy/i);
  assert.match(script, /ta\.stdev\(volume/);
  assert.match(script, /alertcondition/);
});

test('pine screener alert emits one alert covering a watchlist', () => {
  const script = screenerAlertScript({ minVolumeRatio: 2.5 });
  assert.match(script, /alert\(/);
  assert.match(script, /volMult\s*=\s*input\.float\(2\.5/);
});

test('generated pine has balanced brackets', () => {
  for (const script of [strategyScript(), whaleMomentumScript(), screenerAlertScript()]) {
    for (const [open, shut] of [['(', ')'], ['[', ']']]) {
      const opens = script.split(open).length - 1;
      const shuts = script.split(shut).length - 1;
      assert.equal(opens, shuts, `unbalanced ${open}${shut}`);
    }
  }
});
