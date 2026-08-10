/**
 * Combines the three independent scores into one decision.
 *
 * The composite is a weighted average, but safety is not just a weight — a bad
 * safety score vetoes the trade outright, and unconfirmed momentum downgrades a
 * candidate to watch-only. A high narrative score can never rescue either.
 */
import { clamp } from '../util.js';

export const ACTIONS = {
  ENTER: 'enter',
  WATCH: 'watch',
  SKIP: 'skip',
  REJECT: 'reject',
};

export function composite({ safety, momentum, narrative }, weights) {
  const total = weights.safety + weights.momentum + weights.narrative;
  if (!(total > 0)) return 0;
  return clamp(
    (safety * weights.safety + momentum * weights.momentum + narrative * weights.narrative) / total,
  );
}

/**
 * @param {object} parts   { safety, momentum, narrative } analysis results
 * @param {object} scoring config.scoring
 */
export function decide(parts, scoring) {
  const { safety, momentum, narrative } = parts;
  const narrativeScore = narrative?.score ?? 0.5;

  const score = composite(
    { safety: safety.score, momentum: momentum.score, narrative: narrativeScore },
    scoring.weights,
  );

  const reasons = [];
  let action = ACTIONS.SKIP;

  if (!safety.passed) {
    action = ACTIONS.REJECT;
    reasons.push(...safety.hardFails.map((fail) => `failed: ${fail}`));
  } else if (safety.score < scoring.safetyVeto) {
    action = ACTIONS.REJECT;
    reasons.push(`safety score ${safety.score.toFixed(2)} below veto ${scoring.safetyVeto}`);
  } else if (narrative?.verdict === 'suspicious') {
    action = ACTIONS.REJECT;
    reasons.push(`narrative flagged suspicious: ${narrative.rationale}`);
  } else if (score >= scoring.entryThreshold && momentum.confirmed) {
    action = ACTIONS.ENTER;
    reasons.push(`composite ${score.toFixed(2)} ≥ ${scoring.entryThreshold} with confirmed momentum`);
  } else if (score >= scoring.entryThreshold) {
    action = ACTIONS.WATCH;
    const failed = Object.entries(momentum.gates)
      .filter(([, pass]) => !pass)
      .map(([gate]) => gate);
    reasons.push(`score qualifies but momentum unconfirmed (${failed.join(', ')})`);
  } else {
    action = ACTIONS.SKIP;
    reasons.push(`composite ${score.toFixed(2)} below ${scoring.entryThreshold}`);
  }

  return {
    score,
    action,
    reasons,
    breakdown: {
      safety: safety.score,
      momentum: momentum.score,
      narrative: narrativeScore,
    },
  };
}
