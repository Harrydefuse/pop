/**
 * Is the score actually predictive, and is each component earning its weight?
 *
 * Two questions this answers with data instead of intuition:
 *
 *  1. **Calibration** — do higher score bands really produce higher forward
 *     returns? If the bands don't separate, the composite is noise however
 *     sensible the individual rules look.
 *  2. **Attribution** — does each of safety / momentum / narrative carry signal
 *     on its own? The narrative score costs money on every cycle, so "does the
 *     model add anything over the mechanical screens" is a question with a bill
 *     attached.
 *
 * Everything uses **Spearman rank correlation**, not Pearson. Memecoin returns
 * are violently heavy-tailed: one +900% outlier will drag a Pearson correlation
 * wherever it happens to sit, and manufacture a relationship out of a single
 * lucky token. Ranks are immune to that.
 */
import { wilsonInterval } from '../ta/stats.js';

/** Convert values to ranks, averaging ties. */
export function rank(values) {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);

  const ranks = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].value === indexed[i].value) j += 1;
    // Ties share the average of the positions they span.
    const shared = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[indexed[k].index] = shared;
    i = j + 1;
  }
  return ranks;
}

/** Pearson correlation of two equal-length arrays. */
export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  if (varianceX === 0 || varianceY === 0) return null;
  return covariance / Math.sqrt(varianceX * varianceY);
}

/** Spearman = Pearson over ranks. Robust to the outliers this domain is made of. */
export function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 2) return null;
  return pearson(rank(xs), rank(ys));
}

/**
 * Rough significance gate for a correlation.
 *
 * The standard error of a correlation is about 1/sqrt(n-1), so |r| below
 * ~2/sqrt(n) is indistinguishable from zero at 95%. Reporting r without this
 * invites reading a 0.3 from twelve samples as a finding.
 */
export function correlationIsMeaningful(r, n) {
  if (r === null || n < 8) return false;
  return Math.abs(r) > 2 / Math.sqrt(n);
}

const DEFAULT_BANDS = [
  [0, 0.4],
  [0.4, 0.5],
  [0.5, 0.6],
  [0.6, 0.7],
  [0.7, 1.01],
];

/** Group outcomes into score bands and describe what happened in each. */
export function calibrate(outcomes, { bands = DEFAULT_BANDS } = {}) {
  return bands.map(([low, high]) => {
    const inBand = outcomes.filter((outcome) => outcome.score >= low && outcome.score < high);
    const returns = inBand.map((outcome) => outcome.forwardReturn);
    const winners = returns.filter((value) => value > 0).length;

    const sorted = [...returns].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
    const winRate = inBand.length ? wilsonInterval(winners, inBand.length) : null;

    return {
      band: `${low.toFixed(2)}–${high >= 1 ? '1.00' : high.toFixed(2)}`,
      low,
      high,
      count: inBand.length,
      // Mean is reported alongside median deliberately: a large gap between
      // them is itself the finding — it means one token carried the band.
      meanReturn: returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : null,
      medianReturn: median,
      winRate: winRate?.point ?? null,
      winRateLow: winRate?.low ?? null,
      winRateHigh: winRate?.high ?? null,
      best: sorted.length ? sorted.at(-1) : null,
      worst: sorted.length ? sorted[0] : null,
    };
  });
}

/**
 * Does the composite rank tokens correctly, and does each component contribute?
 *
 * `narrativeFreeScore` re-weights safety and momentum alone. If its correlation
 * matches or beats the full composite, the model is not paying for itself.
 */
export function attribute(outcomes, weights) {
  if (outcomes.length < 2) return null;

  const returns = outcomes.map((outcome) => outcome.forwardReturn);
  const component = (key) => outcomes.map((outcome) => outcome.breakdown?.[key] ?? 0);

  const mechanicalTotal = weights.safety + weights.momentum;
  const narrativeFree = outcomes.map((outcome) => {
    const breakdown = outcome.breakdown ?? {};
    if (mechanicalTotal <= 0) return 0;
    return ((breakdown.safety ?? 0) * weights.safety + (breakdown.momentum ?? 0) * weights.momentum) / mechanicalTotal;
  });

  const n = outcomes.length;
  const of = (values) => {
    const r = spearman(values, returns);
    return { r, meaningful: correlationIsMeaningful(r, n) };
  };

  const composite = of(outcomes.map((outcome) => outcome.score));
  const withoutNarrative = of(narrativeFree);

  return {
    samples: n,
    composite,
    safety: of(component('safety')),
    momentum: of(component('momentum')),
    narrative: of(component('narrative')),
    withoutNarrative,
    /**
     * Positive means the narrative component improves ranking; near zero or
     * negative means the API spend is not buying predictive power.
     */
    narrativeLift:
      composite.r === null || withoutNarrative.r === null ? null : composite.r - withoutNarrative.r,
  };
}

/** Full report: calibration bands, attribution, and an honest verdict. */
export function report(outcomes, { weights, unmeasurable = 0, bands } = {}) {
  const n = outcomes.length;
  const calibration = calibrate(outcomes, { bands });
  const attribution = attribute(outcomes, weights);

  const populated = calibration.filter((band) => band.count > 0);
  const monotonic = isMonotonic(populated.map((band) => band.medianReturn));

  const notes = [];
  if (n < 30) {
    notes.push(`Only ${n} measured outcomes. Treat everything below as provisional — bands this small move on one token.`);
  }
  if (unmeasurable > 0) {
    const share = unmeasurable / (n + unmeasurable);
    notes.push(
      `${unmeasurable} signals (${(share * 100).toFixed(0)}%) could not be priced later. Those are disproportionately rugs and delistings, so every return below is optimistic by an unknown amount.`,
    );
  }
  if (attribution && !attribution.composite.meaningful) {
    notes.push('The composite score shows no statistically meaningful relationship with forward returns yet.');
  }
  // Two very different findings hide behind "no lift", and they call for
  // different responses: a score that predicts nothing is broken, while one
  // that predicts well but agrees with the mechanical screens is merely
  // redundant — still not worth paying for, but not evidence it is wrong.
  if (attribution && n >= 30 && attribution.narrativeLift !== null && attribution.narrativeLift < 0.02) {
    notes.push(
      attribution.narrative.meaningful
        ? 'The narrative score does predict returns, but adds no ranking power beyond safety and momentum — on this data it is redundant, not wrong. Lowering scoring.weights.narrative or raising narrative.minCompositeToConsult would cut the API spend without hurting results.'
        : 'The narrative score shows no meaningful relationship with forward returns and adds no ranking power. Consider lowering scoring.weights.narrative, or raising narrative.minCompositeToConsult to spend less on it.',
    );
  }
  if (populated.length >= 3 && !monotonic && n >= 30) {
    notes.push('Median return does not rise monotonically with score band — the weights are not ranking tokens correctly.');
  }

  return {
    samples: n,
    unmeasurable,
    calibration,
    attribution,
    monotonic,
    notes,
  };
}

/** Does the sequence increase (allowing equal steps)? */
export function isMonotonic(values) {
  const clean = values.filter((value) => value !== null);
  for (let i = 1; i < clean.length; i += 1) {
    if (clean[i] < clean[i - 1]) return false;
  }
  return clean.length > 1;
}
