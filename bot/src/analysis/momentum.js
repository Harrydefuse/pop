/**
 * Early-momentum scoring.
 *
 * The entry we want is a token whose activity is *accelerating* on a rising
 * price with more buyers than sellers, while liquidity is still deep enough to
 * exit. All four have to hold — accelerating volume with a falling price is a
 * distribution, not an entry.
 */
import { clamp, num, ramp } from '../util.js';

function ratio(numerator, denominator) {
  if (!(denominator > 0)) return numerator > 0 ? Number.POSITIVE_INFINITY : 0;
  return numerator / denominator;
}

/** Share of trades that were buys, 0.5 when there is nothing to measure. */
export function buyRatio(window) {
  const total = num(window.buys) + num(window.sells);
  return total === 0 ? 0.5 : num(window.buys) / total;
}

/**
 * 5m volume extrapolated to an hour, over actual 1h volume. Above 1 means the
 * last five minutes were busier than the hour that preceded them.
 */
export function acceleration(token) {
  const projected = num(token.m5.volumeUsd) * 12;
  const actual = num(token.h1.volumeUsd);
  if (!(actual > 0)) return projected > 0 ? 3 : 0;
  return projected / actual;
}

export function assessMomentum(token, settings) {
  const signals = [];
  const add = (id, label, value, score, weight, detail) =>
    signals.push({ id, label, value, score: clamp(score), weight, detail });

  // Volume acceleration on two timescales, so a single 5m print can't carry it.
  const accel = acceleration(token);
  add(
    'acceleration',
    '5m volume vs 1h pace',
    accel,
    ramp(accel, 0.6, 2.5),
    2,
    `${Number.isFinite(accel) ? accel.toFixed(2) : '∞'}x`,
  );

  const hourlyAccel = ratio(num(token.h1.volumeUsd) * 6, num(token.h6.volumeUsd));
  add(
    'acceleration-1h',
    '1h volume vs 6h pace',
    hourlyAccel,
    ramp(hourlyAccel, 0.6, 2.5),
    1.5,
    `${Number.isFinite(hourlyAccel) ? hourlyAccel.toFixed(2) : '∞'}x`,
  );

  // Buy pressure. 0.5 is balanced; above ~0.62 is real one-sided demand.
  const buys5m = buyRatio(token.m5);
  add('buy-pressure-5m', 'Buy share (5m)', buys5m, ramp(buys5m, 0.45, 0.72), 2, `${(buys5m * 100).toFixed(0)}%`);

  const buys1h = buyRatio(token.h1);
  add('buy-pressure-1h', 'Buy share (1h)', buys1h, ramp(buys1h, 0.45, 0.68), 1.5, `${(buys1h * 100).toFixed(0)}%`);

  // Trade count — a handful of trades is noise regardless of the ratios.
  const trades5m = num(token.m5.buys) + num(token.m5.sells);
  add('participation', 'Trades (5m)', trades5m, ramp(trades5m, settings.minTxns5m, settings.minTxns5m * 6), 1.5, `${trades5m}`);

  // Price trend. Reward a steady climb; penalise a vertical print that has
  // already run — buying +300% in an hour is buying someone else's exit.
  const change1h = num(token.h1.priceChangePct);
  const trendScore = change1h <= 0 ? ramp(change1h, -0.2, 0.02) : change1h <= 1 ? ramp(change1h, 0, 0.35) : clamp(1 - ramp(change1h, 1, 4));
  add('trend-1h', 'Price change (1h)', change1h, trendScore, 2, `${(change1h * 100).toFixed(1)}%`);

  const change6h = num(token.h6.priceChangePct);
  add('trend-6h', 'Price change (6h)', change6h, change6h < 0 ? ramp(change6h, -0.5, 0) : clamp(1 - ramp(change6h, 3, 10)), 1, `${(change6h * 100).toFixed(1)}%`);

  // Liquidity depth relative to the flow through it: can we get out?
  const turnover = ratio(num(token.h1.volumeUsd), num(token.liquidityUsd));
  add('depth', 'Hourly turnover', turnover, ramp(turnover, 0.05, 0.8) * clamp(1 - ramp(turnover, 3, 12)), 1, `${Number.isFinite(turnover) ? turnover.toFixed(2) : '∞'}x`);

  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const earned = signals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);
  const score = totalWeight > 0 ? earned / totalWeight : 0;

  const gates = {
    buyRatio: buys5m >= settings.minBuyRatio5m,
    acceleration: accel >= settings.minAcceleration,
    participation: trades5m >= settings.minTxns5m,
  };

  return {
    score: clamp(score),
    signals,
    gates,
    /** All three gates must hold before momentum counts as confirmed. */
    confirmed: Object.values(gates).every(Boolean),
  };
}
