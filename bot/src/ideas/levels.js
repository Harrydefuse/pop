/**
 * Market structure: swing points, support/resistance, and trend.
 *
 * This is the part that produces the *drawings* — the horizontal levels a
 * trader would put on a chart by hand. Everything here is derived from price
 * alone, deterministically, so the same candles always produce the same lines.
 *
 * **A pivot is not known when it happens.** A swing high at bar `i` can only be
 * confirmed once `lookback` more bars have printed without exceeding it. Every
 * pivot therefore carries `confirmedAt`, and anything building a signal must use
 * that index, not `index`. Treating a pivot as known on the bar it formed is
 * lookahead, and it is the quiet reason hand-drawn levels backtest so well.
 */
import { atr, ema } from '../ta/indicators.js';
import { num } from '../util.js';

/**
 * Fractal swing points: a bar whose high exceeds every high within `lookback`
 * bars on both sides (and the mirror for lows).
 */
export function pivots(candles, lookback = 5) {
  const highs = [];
  const lows = [];

  for (let i = lookback; i < candles.length - lookback; i += 1) {
    let isHigh = true;
    let isLow = true;

    // Asymmetric comparison, and it matters: a plateau of equal highs would
    // disqualify every bar in it under a symmetric >=, yielding no pivot at all
    // where a trader plainly sees one. Strict on the left, tolerant on the
    // right, so a flat top produces exactly one pivot — its first bar.
    for (let j = i - lookback; j <= i + lookback; j += 1) {
      if (j === i) continue;
      const left = j < i;
      if (left ? candles[j].high >= candles[i].high : candles[j].high > candles[i].high) isHigh = false;
      if (left ? candles[j].low <= candles[i].low : candles[j].low < candles[i].low) isLow = false;
      if (!isHigh && !isLow) break;
    }

    // confirmedAt is when a live system could first have known about this pivot.
    if (isHigh) highs.push({ index: i, confirmedAt: i + lookback, price: candles[i].high, time: candles[i].openTime });
    if (isLow) lows.push({ index: i, confirmedAt: i + lookback, price: candles[i].low, time: candles[i].openTime });
  }

  return { highs, lows };
}

/**
 * Collapse nearby pivots into levels.
 *
 * A level touched four times matters more than one touched once, and a level
 * last touched 200 bars ago matters less than one touched yesterday — both are
 * folded into `strength` so the chart shows a handful of meaningful lines
 * rather than every wiggle.
 */
export function clusterLevels(points, { tolerance, totalBars = 1 } = {}) {
  if (points.length === 0) return [];

  const sorted = [...points].sort((a, b) => a.price - b.price);
  const clusters = [];
  let current = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const reference = current[0].price;
    if (Math.abs(sorted[i].price - reference) <= tolerance) current.push(sorted[i]);
    else {
      clusters.push(current);
      current = [sorted[i]];
    }
  }
  clusters.push(current);

  return clusters
    .map((group) => {
      const price = group.reduce((sum, point) => sum + point.price, 0) / group.length;
      const lastIndex = Math.max(...group.map((point) => point.index));
      // Recency in [0,1]: a touch at the right edge of the window scores 1.
      const recency = totalBars > 1 ? lastIndex / (totalBars - 1) : 1;
      return {
        price,
        touches: group.length,
        lastIndex,
        lastConfirmedAt: Math.max(...group.map((point) => point.confirmedAt)),
        strength: group.length * (0.5 + 0.5 * recency),
      };
    })
    .sort((a, b) => a.price - b.price);
}

/**
 * Keep the strongest levels **on each side of price separately**.
 *
 * Ranking all levels together and truncating is the obvious approach and it is
 * wrong: in a trend the strongest clusters pile up on one side, and the chart
 * comes back with six resistances and no support — which is exactly when a
 * long setup cannot be built at all.
 */
export function selectLevels(levels, price, perSide = 3) {
  const strongest = (subset) =>
    [...subset].sort((a, b) => b.strength - a.strength).slice(0, perSide);

  const support = strongest(levels.filter((level) => level.price < price)).sort((a, b) => b.price - a.price);
  const resistance = strongest(levels.filter((level) => level.price >= price)).sort((a, b) => a.price - b.price);

  return {
    support,
    resistance,
    all: [...support, ...resistance].sort((a, b) => a.price - b.price),
  };
}

/**
 * Trend from two independent readings that must agree:
 * a moving-average stack, and the shape of the swing structure itself.
 * Disagreement is reported as `mixed` rather than resolved arbitrarily — a
 * market with no trend is a real answer, and the most common one.
 */
export function trend(candles, { fast = 20, slow = 50, swings } = {}) {
  const closes = candles.map((candle) => candle.close);
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);
  const last = candles.length - 1;

  const fastValue = fastEma[last];
  const slowValue = slowEma[last];
  const stack = fastValue === null || slowValue === null ? null : fastValue > slowValue ? 'up' : 'down';

  const structure = swingStructure(swings ?? pivots(candles));

  let direction = 'mixed';
  if (stack === 'up' && structure === 'up') direction = 'up';
  else if (stack === 'down' && structure === 'down') direction = 'down';

  return {
    direction,
    stack,
    structure,
    fastEma: fastValue,
    slowEma: slowValue,
    // How far price sits above/below the slow average, in fractional terms.
    extension: slowValue ? closes[last] / slowValue - 1 : null,
  };
}

/** Higher highs and higher lows, or the reverse. */
export function swingStructure({ highs, lows }) {
  const lastTwo = (points) => points.slice(-2);
  const [priorHigh, latestHigh] = lastTwo(highs);
  const [priorLow, latestLow] = lastTwo(lows);
  if (!latestHigh || !latestLow || !priorHigh || !priorLow) return 'unknown';

  const higherHighs = latestHigh.price > priorHigh.price;
  const higherLows = latestLow.price > priorLow.price;
  if (higherHighs && higherLows) return 'up';
  if (!higherHighs && !higherLows) return 'down';
  return 'mixed';
}

/**
 * Everything the setup builder and the chart need, in one pass.
 * Levels are split into those below price (support) and above it (resistance).
 */
export function analyseStructure(candles, { lookback = 5, atrPeriod = 14, maxLevels = 6 } = {}) {
  const swings = pivots(candles, lookback);
  const atrSeries = atr(candles, atrPeriod);
  const last = candles.length - 1;
  const currentAtr = atrSeries[last] ?? null;
  const price = candles[last].close;

  // Cluster tolerance scales with volatility: a fixed percentage would merge
  // everything on a quiet symbol and nothing on a violent one.
  const tolerance = currentAtr ? currentAtr * 0.75 : price * 0.01;

  const clustered = clusterLevels([...swings.highs, ...swings.lows], {
    tolerance,
    totalBars: candles.length,
  });
  const { support, resistance, all } = selectLevels(clustered, price, Math.ceil(maxLevels / 2));

  return {
    price,
    atr: currentAtr,
    atrPct: currentAtr ? currentAtr / price : null,
    swings,
    levels: all,
    support,
    resistance,
    trend: trend(candles, { swings }),
    /** Where price sits in the recent range, 0 = bottom, 1 = top. */
    rangePosition: rangePosition(candles.slice(-60)),
  };
}

function rangePosition(window) {
  if (window.length === 0) return null;
  const high = Math.max(...window.map((candle) => candle.high));
  const low = Math.min(...window.map((candle) => candle.low));
  if (high === low) return 0.5;
  return (num(window.at(-1).close) - low) / (high - low);
}
