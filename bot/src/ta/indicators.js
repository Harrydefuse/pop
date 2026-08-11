/**
 * Technical indicators.
 *
 * Pure functions over close/volume arrays: no I/O, no state, no lookahead.
 * Every series returned is the same length as its input, with `null` in the
 * warm-up positions where the indicator is not yet defined — never 0, and never
 * silently shortened. A backtest that treats an undefined warm-up value as a
 * real reading will trade on noise and look better than it is.
 */

/** Simple moving average. */
export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  if (period <= 0) return out;

  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Exponential moving average, seeded with the SMA of the first `period` values. */
export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;

  const k = 2 / (period + 1);
  let previous = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = previous;

  for (let i = period; i < values.length; i += 1) {
    previous = values[i] * k + previous * (1 - k);
    out[i] = previous;
  }
  return out;
}

/**
 * Wilder's RSI — the one TradingView's `ta.rsi` implements.
 *
 * Note this is *not* an EMA of gains: Wilder's smoothing uses 1/period, which
 * is equivalent to an EMA of period `2n-1`. Using a plain EMA here is a common
 * mistake and produces visibly different values, so a strategy tuned on one
 * will not reproduce on the other.
 */
export function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gainSum += delta;
    else lossSum -= delta;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = rsiFrom(avgGain, avgLoss);

  for (let i = period + 1; i < closes.length; i += 1) {
    const delta = closes[i] - closes[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = rsiFrom(avgGain, avgLoss);
  }

  return out;
}

function rsiFrom(avgGain, avgLoss) {
  // No losses in the window: RS is infinite, RSI saturates at 100.
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/** Wilder's Average True Range. Used for volatility-scaled stops. */
export function atr(candles, period = 14) {
  const out = new Array(candles.length).fill(null);
  if (candles.length <= period) return out;

  const trueRanges = candles.map((candle, i) => {
    if (i === 0) return candle.high - candle.low;
    const previousClose = candles[i - 1].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });

  let previous = trueRanges.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = previous;
  for (let i = period + 1; i < candles.length; i += 1) {
    previous = (previous * (period - 1) + trueRanges[i]) / period;
    out[i] = previous;
  }
  return out;
}

/**
 * Volume relative to its own recent average, as a multiple.
 *
 * "Volume +200%" is ambiguous in every post that uses it: it can mean 2x or 3x.
 * This returns the plain ratio (2.0 = twice the average) and the caller states
 * its own threshold, so the ambiguity is resolved once, explicitly.
 */
export function volumeRatio(volumes, period = 20) {
  const averages = sma(volumes, period);
  return volumes.map((volume, i) => {
    const average = averages[i];
    if (average === null || average === 0) return null;
    return volume / average;
  });
}

/**
 * Rolling standard deviation — the input to a z-score, which is a fairer way to
 * say "unusual volume" than a fixed multiple, because it adapts to how noisy
 * the symbol normally is.
 */
export function stdev(values, period) {
  const out = new Array(values.length).fill(null);
  const averages = sma(values, period);

  for (let i = period - 1; i < values.length; i += 1) {
    const mean = averages[i];
    if (mean === null) continue;
    let sumSquares = 0;
    for (let j = i - period + 1; j <= i; j += 1) sumSquares += (values[j] - mean) ** 2;
    out[i] = Math.sqrt(sumSquares / period);
  }
  return out;
}

/** How many standard deviations above its own mean the latest volume sits. */
export function zScore(values, period = 20) {
  const averages = sma(values, period);
  const deviations = stdev(values, period);
  return values.map((value, i) => {
    if (averages[i] === null || !deviations[i]) return null;
    return (value - averages[i]) / deviations[i];
  });
}

/** Percentage change over `lookback` bars, as a fraction. */
export function roc(values, lookback = 1) {
  return values.map((value, i) => {
    if (i < lookback) return null;
    const previous = values[i - lookback];
    if (!previous) return null;
    return value / previous - 1;
  });
}
