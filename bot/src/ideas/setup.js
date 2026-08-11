/**
 * Turning structure into an actual trade.
 *
 * A "signal" is not a trade. A trade needs a side, a place to get in, a place
 * the idea is proven wrong, a place to take profit, and a size. This builds all
 * five from the levels found in `levels.js`, and — importantly — **refuses to
 * produce a setup when the numbers do not work**.
 *
 * The most common failure in published trade ideas is a beautiful thesis with a
 * stop so far away that the reward-to-risk is under 1. A setup with R:R below
 * `minRiskReward` is rejected here no matter how good the narrative sounds,
 * because at that ratio you need a win rate most systems never reach.
 */
import { rsi, volumeRatio } from '../ta/indicators.js';
import { num } from '../util.js';

/** Win rate this setup must achieve just to break even, before costs. */
export function breakEvenWinRate(riskReward) {
  if (!(riskReward > 0)) return 1;
  return 1 / (1 + riskReward);
}

/**
 * Build a long or short setup around the nearest structural level.
 *
 * @param {object} structure  result of analyseStructure
 * @param {object[]} candles
 */
export function buildSetup(structure, candles, options = {}) {
  const {
    minRiskReward = 1.8,
    stopAtrBuffer = 0.5,
    maxEntryDistanceAtr = 1.5,
    riskPerTradePct = 0.01,
    equityUsd = 10_000,
  } = options;

  const { price, atr, support, resistance, trend: bias } = structure;
  if (!atr || !(price > 0)) return { ok: false, reason: 'not enough history for a volatility estimate' };

  if (support.length === 0 && resistance.length === 0) {
    // Distinguish "no structure at all" from "no level on the side we need" —
    // the first means the window is too smooth or too short to read, the second
    // is a genuine one-sided market.
    return { ok: false, reason: 'no swing structure in this window — nothing to anchor a level to' };
  }

  const side = bias.direction === 'down' ? 'short' : 'long';
  const built = side === 'long'
    ? buildLong({ price, atr, support, resistance, stopAtrBuffer })
    : buildShort({ price, atr, support, resistance, stopAtrBuffer });

  if (!built.ok) return built;

  const { entry, stop, targets } = built;
  const risk = Math.abs(entry - stop);
  if (!(risk > 0)) return { ok: false, reason: 'stop and entry coincide' };

  // Distance to entry matters: a setup 4 ATRs away is a watchlist item, not a
  // trade, and quoting an R:R for a price that may never print is misleading.
  const entryDistanceAtr = Math.abs(price - entry) / atr;
  if (entryDistanceAtr > maxEntryDistanceAtr) {
    return { ok: false, reason: `entry is ${entryDistanceAtr.toFixed(1)} ATR away — too far to be actionable` };
  }

  const reward = Math.abs(targets[0] - entry);
  const riskReward = reward / risk;
  if (riskReward < minRiskReward) {
    return {
      ok: false,
      reason: `reward-to-risk ${riskReward.toFixed(2)} is below the ${minRiskReward} minimum`,
      riskReward,
    };
  }

  const quantity = (equityUsd * riskPerTradePct) / risk;

  return {
    ok: true,
    side,
    entry,
    stop,
    targets,
    riskReward,
    riskPerUnit: risk,
    breakEvenWinRate: breakEvenWinRate(riskReward),
    entryDistanceAtr,
    positionSize: {
      quantity,
      notionalUsd: quantity * entry,
      riskUsd: equityUsd * riskPerTradePct,
      note: `sized so a stop-out costs ${(riskPerTradePct * 100).toFixed(1)}% of ${equityUsd.toLocaleString('en-US')}`,
    },
    invalidation: side === 'long'
      ? `a close below ${stop.toPrecision(6)} breaks the level this idea rests on`
      : `a close above ${stop.toPrecision(6)} breaks the level this idea rests on`,
  };
}

function buildLong({ price, atr, support, resistance, stopAtrBuffer }) {
  const level = support[0];
  if (!level) return { ok: false, reason: 'no support level below price to build a long against' };

  // Enter at the level, not at market: the edge is buying the retest.
  const entry = Math.min(price, level.price + atr * 0.15);
  const stop = level.price - atr * stopAtrBuffer;

  const above = resistance.filter((entryLevel) => entryLevel.price > entry * 1.001);
  const targets = above.length
    ? above.slice(0, 2).map((entryLevel) => entryLevel.price)
    // No resistance overhead — use a measured move so a target still exists.
    : [entry + atr * 3];

  return { ok: true, entry, stop, targets };
}

function buildShort({ price, atr, support, resistance, stopAtrBuffer }) {
  const level = resistance[0];
  if (!level) return { ok: false, reason: 'no resistance level above price to build a short against' };

  const entry = Math.max(price, level.price - atr * 0.15);
  const stop = level.price + atr * stopAtrBuffer;

  const below = support.filter((entryLevel) => entryLevel.price < entry * 0.999);
  const targets = below.length
    ? below.slice(0, 2).map((entryLevel) => entryLevel.price)
    : [entry - atr * 3];

  return { ok: true, entry, stop, targets };
}

/**
 * Independent reasons to like or dislike the setup.
 *
 * Kept as discrete, named factors rather than folded into one number so the
 * explanation can cite them and a human can disagree with any single one.
 */
export function confluence(structure, candles, setup, options = {}) {
  const { rsiPeriod = 14, volumePeriod = 20 } = options;
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const last = candles.length - 1;

  const rsiValue = rsi(closes, rsiPeriod)[last];
  const volume = volumeRatio(volumes, volumePeriod)[last];
  const factors = [];

  const add = (id, label, supports, detail) => factors.push({ id, label, supports, detail });
  const long = setup.side === 'long';

  add(
    'trend',
    `Trend is ${structure.trend.direction}`,
    structure.trend.direction === (long ? 'up' : 'down'),
    `moving-average stack ${structure.trend.stack ?? 'unknown'}, swing structure ${structure.trend.structure}`,
  );

  const level = long ? structure.support[0] : structure.resistance[0];
  add(
    'level',
    `${long ? 'Support' : 'Resistance'} touched ${level?.touches ?? 0} times`,
    (level?.touches ?? 0) >= 2,
    level ? `level at ${level.price.toPrecision(6)}, strength ${level.strength.toFixed(1)}` : 'no level found',
  );

  if (rsiValue !== null) {
    const favourable = long ? rsiValue < 45 : rsiValue > 55;
    add('rsi', `RSI ${rsiValue.toFixed(0)}`, favourable, long ? 'buying into weakness, not strength' : 'selling into strength');
  }

  if (volume !== null) {
    add('volume', `Volume ${volume.toFixed(2)}x average`, volume >= 1.2, 'participation behind the move');
  }

  if (structure.rangePosition !== null) {
    const favourable = long ? structure.rangePosition < 0.4 : structure.rangePosition > 0.6;
    add(
      'range',
      `Price sits ${(structure.rangePosition * 100).toFixed(0)}% up the 60-bar range`,
      favourable,
      long ? 'closer to the low end' : 'closer to the high end',
    );
  }

  add(
    'reward',
    `Reward-to-risk ${setup.riskReward.toFixed(2)}`,
    setup.riskReward >= 2,
    `needs a ${(setup.breakEvenWinRate * 100).toFixed(0)}% win rate to break even`,
  );

  const supporting = factors.filter((factor) => factor.supports).length;
  return {
    factors,
    supporting,
    total: factors.length,
    /** Fraction of independent checks that agree with the direction. */
    score: factors.length ? supporting / factors.length : 0,
    against: factors.filter((factor) => !factor.supports),
  };
}

/** Everything a chart needs to draw the idea. */
export function drawings(structure, setup) {
  if (!setup.ok) return { levels: structure.levels, zones: [] };

  return {
    levels: structure.levels.map((level) => ({
      price: level.price,
      kind: level.price < structure.price ? 'support' : 'resistance',
      touches: level.touches,
      strength: level.strength,
    })),
    zones: [
      { kind: 'entry', from: setup.entry, to: setup.entry, label: 'Entry' },
      { kind: 'stop', from: setup.stop, to: setup.entry, label: 'Risk' },
      { kind: 'target', from: setup.entry, to: setup.targets[0], label: 'Target 1' },
      ...(setup.targets[1] ? [{ kind: 'target2', from: setup.targets[0], to: setup.targets[1], label: 'Target 2' }] : []),
    ],
    side: setup.side,
    entry: setup.entry,
    stop: setup.stop,
    targets: setup.targets,
    price: structure.price,
    atr: num(structure.atr),
  };
}
