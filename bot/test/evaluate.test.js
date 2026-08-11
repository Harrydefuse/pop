/**
 * Signal evaluation: does the score predict anything?
 *
 * The important tests here are the ones about honesty — that unmeasurable
 * signals are surfaced rather than dropped (dropping rugs makes any strategy
 * look good), and that a correlation from a handful of samples is not reported
 * as a finding.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { attribute, calibrate, correlationIsMeaningful, isMonotonic, pearson, rank, report, spearman } from '../src/evaluate/calibration.js';
import { collectOutcomes, isDue, keyFor, loadOutcomes, measure } from '../src/evaluate/outcomes.js';
import { loadConfig } from '../src/config.js';
import { appendJsonl, readJsonl } from '../src/store.js';
import { setLevel } from '../src/log.js';

setLevel('silent');

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 0, 10, 12, 0, 0);
const realFetch = globalThis.fetch;

function tempConfig() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-eval-'));
  return loadConfig({ dataDir: dir }, { ANTHROPIC_API_KEY: 'k' });
}

function signal({ address, score, hoursAgo, price = 1, breakdown }) {
  return {
    at: new Date(NOW - hoursAgo * HOUR).toISOString(),
    address,
    symbol: address,
    score,
    action: 'watch',
    breakdown: breakdown ?? { safety: score, momentum: score, narrative: score },
    liquidityUsd: 50_000,
    priceUsd: price,
  };
}

const WEIGHTS = { safety: 0.4, momentum: 0.35, narrative: 0.25 };

// ── rank / correlation ───────────────────────────────────────────────────────

test('rank averages ties', () => {
  assert.deepEqual(rank([10, 20, 30]), [1, 2, 3]);
  assert.deepEqual(rank([10, 10, 30]), [1.5, 1.5, 3]);
  assert.deepEqual(rank([5, 5, 5, 5]), [2.5, 2.5, 2.5, 2.5]);
});

test('pearson finds a perfect linear relationship and rejects a flat one', () => {
  assert.ok(Math.abs(pearson([1, 2, 3, 4], [2, 4, 6, 8]) - 1) < 1e-12);
  assert.ok(Math.abs(pearson([1, 2, 3, 4], [8, 6, 4, 2]) + 1) < 1e-12);
  assert.equal(pearson([1, 1, 1], [1, 2, 3]), null, 'no variance means no correlation');
});

test('spearman survives an outlier that would hijack pearson', () => {
  // Monotone relationship with one violent outlier — exactly the shape of
  // memecoin returns, where a single +900% token can invent a correlation.
  const scores = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
  const returns = [-0.1, -0.05, 0, 0.05, 0.1, 0.15, 40];

  assert.equal(spearman(scores, returns), 1, 'ranks are unaffected by magnitude');
  assert.ok(pearson(scores, returns) < 0.95, 'pearson is dominated by the outlier');
});

test('a correlation from too few samples is not called meaningful', () => {
  assert.equal(correlationIsMeaningful(0.5, 4), false, 'n below 8 is never enough');
  assert.equal(correlationIsMeaningful(0.15, 50), false, 'small r at moderate n');
  assert.equal(correlationIsMeaningful(0.6, 50), true);
  assert.equal(correlationIsMeaningful(null, 100), false);
});

test('isMonotonic ignores empty bands', () => {
  assert.equal(isMonotonic([0.1, 0.2, 0.3]), true);
  assert.equal(isMonotonic([0.1, null, 0.3]), true);
  assert.equal(isMonotonic([0.3, 0.1]), false);
  assert.equal(isMonotonic([0.5]), false, 'a single band proves nothing');
});

// ── measurement ──────────────────────────────────────────────────────────────

test('only signals older than the horizon are measured', () => {
  assert.equal(isDue(signal({ address: 'A', score: 0.5, hoursAgo: 30 }), { horizonHours: 24, now: NOW }), true);
  assert.equal(isDue(signal({ address: 'B', score: 0.5, hoursAgo: 3 }), { horizonHours: 24, now: NOW }), false);
});

test('measure computes forward return against the recorded entry price', () => {
  const signals = [signal({ address: 'A', score: 0.7, hoursAgo: 25, price: 2 })];
  const prices = new Map([['A', { priceUsd: 3, liquidityUsd: 60_000 }]]);

  const { measured, missing } = measure(signals, prices, { horizonHours: 24, now: NOW });

  assert.equal(missing.length, 0);
  assert.equal(measured.length, 1);
  assert.ok(Math.abs(measured[0].forwardReturn - 0.5) < 1e-12, '2 → 3 is +50%');
  assert.ok(measured[0].elapsedHours >= 24);
});

test('a token with no current price is reported, never silently dropped', () => {
  // This is the survivorship trap: rugs are exactly the tokens that stop
  // returning a price, and discarding them flatters every strategy.
  const signals = [
    signal({ address: 'ALIVE', score: 0.7, hoursAgo: 25, price: 1 }),
    signal({ address: 'RUGGED', score: 0.9, hoursAgo: 25, price: 1 }),
  ];
  const prices = new Map([['ALIVE', { priceUsd: 1.2 }]]);

  const { measured, missing } = measure(signals, prices, { horizonHours: 24, now: NOW });

  assert.equal(measured.length, 1);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].address, 'RUGGED');
  assert.match(missing[0].reason, /delisted|rugged/i);
});

test('a signal with no recorded entry price is skipped rather than divided by zero', () => {
  const signals = [signal({ address: 'A', score: 0.7, hoursAgo: 25, price: 0 })];
  const { measured, missing } = measure(signals, new Map([['A', { priceUsd: 5 }]]), {
    horizonHours: 24,
    now: NOW,
  });
  assert.equal(measured.length, 0);
  assert.equal(missing.length, 0);
});

test('collectOutcomes measures once and skips already-measured signals', async (t) => {
  const config = tempConfig();
  const signals = [
    signal({ address: 'A', score: 0.7, hoursAgo: 30, price: 1 }),
    signal({ address: 'B', score: 0.4, hoursAgo: 2, price: 1 }),
  ];
  for (const entry of signals) appendJsonl(config.dataDirAbsolute, 'signals.jsonl', entry);

  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes('/tokens/v1/')) {
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            chainId: 'solana',
            dexId: 'pumpswap',
            baseToken: { address: 'A', symbol: 'A', name: 'A' },
            quoteToken: { symbol: 'SOL' },
            priceUsd: '1.5',
            liquidity: { usd: 40_000 },
          },
        ],
      };
    }
    throw new Error(`unstubbed ${href}`);
  };
  t.after(() => {
    globalThis.fetch = realFetch;
  });

  const first = await collectOutcomes(config, { horizonHours: 24, now: NOW });
  assert.equal(first.measured.length, 1, 'only the aged signal');
  assert.equal(first.skipped, 1, 'the fresh one waits');
  assert.ok(Math.abs(first.measured[0].forwardReturn - 0.5) < 1e-12);

  // Running again must not double-count.
  const second = await collectOutcomes(config, { horizonHours: 24, now: NOW });
  assert.equal(second.measured.length, 0);
  assert.equal(readJsonl(config.dataDirAbsolute, 'outcomes.jsonl').length, 1);
});

test('keyFor identifies one token in one cycle', () => {
  const a = signal({ address: 'A', score: 0.5, hoursAgo: 1 });
  assert.equal(keyFor(a), `A@${a.at}`);
  assert.notEqual(keyFor(a), keyFor(signal({ address: 'A', score: 0.5, hoursAgo: 2 })));
});

test('loadOutcomes separates measured from unmeasurable', () => {
  const config = tempConfig();
  appendJsonl(config.dataDirAbsolute, 'outcomes.jsonl', { address: 'A', forwardReturn: 0.1, score: 0.6 });
  appendJsonl(config.dataDirAbsolute, 'outcomes.jsonl', { address: 'B', unmeasurable: true, score: 0.9 });

  const { measured, unmeasurable } = loadOutcomes(config);
  assert.equal(measured.length, 1);
  assert.equal(unmeasurable.length, 1);
});

// ── calibration ──────────────────────────────────────────────────────────────

function outcome(score, forwardReturn, breakdown) {
  return { score, forwardReturn, breakdown: breakdown ?? { safety: score, momentum: score, narrative: score } };
}

test('calibrate buckets outcomes and reports both mean and median', () => {
  const outcomes = [
    outcome(0.35, -0.2),
    outcome(0.45, -0.1),
    outcome(0.55, 0.05),
    outcome(0.65, 0.2),
    outcome(0.75, 0.4),
  ];

  const bands = calibrate(outcomes);
  const populated = bands.filter((band) => band.count > 0);
  assert.equal(populated.length, 5);
  assert.equal(populated[0].count, 1);
  assert.ok(populated.at(-1).medianReturn > populated[0].medianReturn);
});

test('calibrate exposes a band carried by one outlier via mean vs median', () => {
  // Four small losses and one huge winner: the mean is positive, the median is
  // not. A report showing only the mean would call this band profitable.
  const outcomes = [
    outcome(0.65, -0.1),
    outcome(0.66, -0.1),
    outcome(0.67, -0.1),
    outcome(0.68, -0.1),
    outcome(0.69, 20),
  ];
  const band = calibrate(outcomes).find((entry) => entry.low === 0.6);

  assert.equal(band.count, 5);
  assert.ok(band.meanReturn > 0, 'mean is dragged positive');
  assert.ok(band.medianReturn < 0, 'median tells the truth');
  assert.equal(band.best, 20);
});

test('attribute measures each component and the lift from the narrative score', () => {
  // Momentum tracks the outcome perfectly; narrative is pure noise.
  const outcomes = Array.from({ length: 40 }, (_, i) => {
    const momentum = i / 40;
    return {
      score: momentum,
      forwardReturn: momentum - 0.5,
      breakdown: { safety: 0.8, momentum, narrative: (i % 7) / 7 },
    };
  });

  const result = attribute(outcomes, WEIGHTS);
  assert.equal(result.samples, 40);
  assert.ok(result.momentum.r > 0.9, 'momentum is the real driver');
  assert.equal(result.momentum.meaningful, true);
  assert.ok(Math.abs(result.narrative.r) < 0.5, 'narrative is noise here');
});

test('attribute returns null rather than a correlation from one sample', () => {
  assert.equal(attribute([outcome(0.5, 0.1)], WEIGHTS), null);
});

test('report warns loudly when signals could not be priced later', () => {
  const outcomes = Array.from({ length: 10 }, (_, i) => outcome(0.5 + i / 100, 0.05));
  const result = report(outcomes, { weights: WEIGHTS, unmeasurable: 6 });

  const joined = result.notes.join(' ');
  assert.match(joined, /could not be priced/);
  assert.match(joined, /optimistic/, 'must name the direction of the bias');
  assert.match(joined, /38%/, 'must quantify the share');
});

test('report refuses to draw conclusions from a small sample', () => {
  const result = report([outcome(0.5, 0.1), outcome(0.7, 0.3)], { weights: WEIGHTS });
  assert.match(result.notes.join(' '), /provisional/);
});

test('report distinguishes a redundant narrative score from a useless one', () => {
  // All three components identical: narrative predicts perfectly, yet removing
  // it changes nothing. The advice should say "redundant", not "no relationship".
  const outcomes = Array.from({ length: 60 }, (_, i) => {
    const value = i / 60;
    return {
      score: value,
      forwardReturn: value - 0.4,
      breakdown: { safety: value, momentum: value, narrative: value },
    };
  });

  const result = report(outcomes, { weights: WEIGHTS });
  assert.equal(result.attribution.narrative.meaningful, true, 'it does predict');
  assert.ok(result.attribution.narrativeLift <= 0.02, 'but adds nothing');

  const joined = result.notes.join(' ');
  assert.match(joined, /redundant, not wrong/);
  assert.doesNotMatch(joined, /no meaningful relationship/);
});

test('report flags a narrative score that is not earning its weight', () => {
  // Safety and momentum carry everything; narrative is random.
  const outcomes = Array.from({ length: 60 }, (_, i) => {
    const mechanical = i / 60;
    return {
      score: mechanical,
      forwardReturn: mechanical - 0.5,
      breakdown: { safety: mechanical, momentum: mechanical, narrative: ((i * 37) % 60) / 60 },
    };
  });

  const result = report(outcomes, { weights: WEIGHTS });
  assert.ok(result.attribution.narrativeLift <= 0.02);
  assert.equal(result.attribution.narrative.meaningful, false);
  assert.match(result.notes.join(' '), /no meaningful relationship/);
});

test('report stays quiet when every component genuinely earns its place', () => {
  // Narrative carries information the mechanical screens do not, so dropping it
  // measurably degrades the ranking. Returns follow the *composite*, so the
  // score bands separate cleanly too and there is nothing to warn about.
  const outcomes = Array.from({ length: 60 }, (_, i) => {
    const mechanical = ((i * 17) % 60) / 60;
    const narrative = i / 60;
    const score = mechanical * 0.75 + narrative * 0.25;
    return {
      score,
      forwardReturn: score - 0.5,
      breakdown: { safety: mechanical, momentum: mechanical, narrative },
    };
  });

  const result = report(outcomes, { weights: WEIGHTS, unmeasurable: 0 });
  assert.ok(result.attribution.narrativeLift > 0.02, `expected real lift, got ${result.attribution.narrativeLift}`);
  assert.equal(result.notes.length, 0, `unexpected warnings: ${result.notes.join(' | ')}`);
});
