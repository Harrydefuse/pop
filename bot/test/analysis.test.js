import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULTS, loadConfig, merge } from '../src/config.js';
import { assessSafety } from '../src/analysis/safety.js';
import { acceleration, assessMomentum, buyRatio } from '../src/analysis/momentum.js';
import { ACTIONS, composite, decide } from '../src/analysis/score.js';
import { holderConcentration } from '../src/sources/solana.js';
import { normalizePair } from '../src/sources/dexscreener.js';
import { clamp, ramp, uniqueBy } from '../src/util.js';

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);
const HOUR = 3_600_000;

/** A healthy-looking token: deep pool, revoked authorities, real buy pressure. */
function goodPair(overrides = {}) {
  return normalizePair(
    merge(
      {
        chainId: 'solana',
        dexId: 'raydium',
        pairAddress: 'PAIR',
        url: 'https://dexscreener.com/solana/PAIR',
        baseToken: { address: 'MINT', name: 'Good Coin', symbol: 'GOOD' },
        quoteToken: { symbol: 'SOL' },
        priceUsd: '0.0012',
        liquidity: { usd: 120_000, base: 40_000_000 },
        fdv: 1_200_000,
        marketCap: 1_200_000,
        pairCreatedAt: NOW - 4 * HOUR,
        txns: {
          m5: { buys: 40, sells: 12 },
          h1: { buys: 300, sells: 150 },
          h6: { buys: 900, sells: 600 },
          h24: { buys: 2000, sells: 1500 },
        },
        volume: { m5: 9_000, h1: 60_000, h6: 220_000, h24: 600_000 },
        priceChange: { m5: 3, h1: 18, h6: 40, h24: 60 },
        info: {
          description: 'A coin about a good dog',
          imageUrl: 'https://img',
          websites: [{ url: 'https://good.coin' }],
          socials: [{ type: 'twitter', url: 'https://x.com/good' }],
        },
      },
      overrides,
    ),
    NOW,
  );
}

const cleanChain = {
  available: true,
  mintAuthority: null,
  freezeAuthority: null,
  decimals: 6,
  supply: 1_000_000_000,
  concentration: { topN: 10, poolExcluded: true, largestShare: 0.04, topShare: 0.18, sampledHolders: 19 },
};

test('util: ramp and clamp bound their outputs', () => {
  assert.equal(ramp(5, 0, 10), 0.5);
  assert.equal(ramp(-1, 0, 10), 0);
  assert.equal(ramp(99, 0, 10), 1);
  assert.equal(ramp(Number.NaN, 0, 10), 0);
  assert.equal(clamp(1.4), 1);
  assert.equal(clamp(-0.4), 0);
});

test('util: uniqueBy keeps the first occurrence', () => {
  const items = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }, { id: 'a', n: 3 }];
  assert.deepEqual(uniqueBy(items, (i) => i.id).map((i) => i.n), [1, 2]);
});

test('normalizePair converts percentages and computes age', () => {
  const token = goodPair();
  assert.equal(token.symbol, 'GOOD');
  assert.equal(token.priceUsd, 0.0012);
  assert.equal(token.h1.priceChangePct, 0.18);
  assert.equal(token.ageMs, 4 * HOUR);
  assert.equal(token.info.socials.length, 1);
});

test('safety: a clean token passes with a high score', () => {
  const result = assessSafety(goodPair(), cleanChain, DEFAULTS.safety);
  assert.equal(result.passed, true);
  assert.equal(result.hardFails.length, 0);
  assert.ok(result.score > 0.8, `expected > 0.8, got ${result.score}`);
});

test('safety: a live mint authority is a hard fail', () => {
  const result = assessSafety(
    goodPair(),
    { ...cleanChain, mintAuthority: 'AttackerWallet1111111111111111111111111111' },
    DEFAULTS.safety,
  );
  assert.equal(result.passed, false);
  assert.equal(result.score, 0);
  assert.match(result.hardFails.join(' '), /Mint authority/);
});

test('safety: thin liquidity is a hard fail', () => {
  const result = assessSafety(goodPair({ liquidity: { usd: 900, base: 1000 } }), cleanChain, DEFAULTS.safety);
  assert.equal(result.passed, false);
  assert.match(result.hardFails.join(' '), /Liquidity/);
});

test('safety: buys with zero sells at volume is a honeypot signature', () => {
  const result = assessSafety(
    goodPair({ txns: { m5: { buys: 40, sells: 0 }, h1: { buys: 300, sells: 0 } } }),
    cleanChain,
    DEFAULTS.safety,
  );
  assert.equal(result.passed, false);
  assert.match(result.hardFails.join(' '), /Sells observed/);
});

test('safety: unreachable chain data lowers confidence without claiming a rug', () => {
  const result = assessSafety(goodPair(), { available: false, reason: 'rpc timeout' }, DEFAULTS.safety);
  assert.equal(result.passed, true, 'an RPC outage must not be a hard fail');
  assert.equal(result.confidence, 0.6);
  assert.ok(result.score < 0.9, 'missing on-chain checks should cost score');
});

test('safety: high market-cap-to-liquidity ratio fails the float check', () => {
  const result = assessSafety(
    goodPair({ marketCap: 50_000_000, fdv: 50_000_000 }),
    cleanChain,
    DEFAULTS.safety,
  );
  const float = result.checks.find((check) => check.id === 'float');
  assert.equal(float.pass, false);
});

test('momentum: buyRatio and acceleration behave at the edges', () => {
  assert.equal(buyRatio({ buys: 0, sells: 0 }), 0.5);
  assert.equal(buyRatio({ buys: 3, sells: 1 }), 0.75);
  const token = goodPair();
  // 9k over 5m projects to 108k/h against 60k actual.
  assert.ok(acceleration(token) > 1.7);
});

test('momentum: accelerating token with buy pressure confirms', () => {
  const result = assessMomentum(goodPair(), DEFAULTS.momentum);
  assert.equal(result.confirmed, true);
  assert.ok(result.score > 0.6, `expected > 0.6, got ${result.score}`);
});

test('momentum: a dead token does not confirm', () => {
  const dead = goodPair({
    txns: { m5: { buys: 1, sells: 2 }, h1: { buys: 10, sells: 14 }, h6: { buys: 90, sells: 95 } },
    volume: { m5: 60, h1: 4_000, h6: 40_000, h24: 120_000 },
    priceChange: { m5: -1, h1: -6, h6: -20, h24: -35 },
  });
  const result = assessMomentum(dead, DEFAULTS.momentum);
  assert.equal(result.confirmed, false);
  assert.ok(result.score < 0.45, `expected < 0.45, got ${result.score}`);
});

test('momentum: a vertical print is penalised, not rewarded', () => {
  const calm = assessMomentum(goodPair(), DEFAULTS.momentum);
  const vertical = assessMomentum(goodPair({ priceChange: { m5: 40, h1: 350, h6: 900, h24: 1500 } }), DEFAULTS.momentum);
  assert.ok(
    vertical.score < calm.score,
    `+350% in an hour should score below +18%, got ${vertical.score} vs ${calm.score}`,
  );
});

test('score: composite respects weights', () => {
  const weights = { safety: 1, momentum: 1, narrative: 0 };
  assert.equal(composite({ safety: 1, momentum: 0, narrative: 1 }, weights), 0.5);
});

test('score: safety veto overrides a strong narrative', () => {
  const decision = decide(
    {
      safety: { score: 0.3, passed: true, hardFails: [] },
      momentum: { score: 0.95, confirmed: true, gates: {} },
      narrative: { score: 1, verdict: 'compelling' },
    },
    DEFAULTS.scoring,
  );
  assert.equal(decision.action, ACTIONS.REJECT);
});

test('score: suspicious narrative rejects an otherwise clean token', () => {
  const decision = decide(
    {
      safety: { score: 0.95, passed: true, hardFails: [] },
      momentum: { score: 0.9, confirmed: true, gates: {} },
      narrative: { score: 0.2, verdict: 'suspicious', rationale: 'impersonates an exchange' },
    },
    DEFAULTS.scoring,
  );
  assert.equal(decision.action, ACTIONS.REJECT);
  assert.match(decision.reasons.join(' '), /suspicious/);
});

test('score: unconfirmed momentum downgrades entry to watch', () => {
  const parts = {
    safety: { score: 0.95, passed: true, hardFails: [] },
    momentum: { score: 0.8, confirmed: false, gates: { buyRatio: false, acceleration: true, participation: true } },
    narrative: { score: 0.8, verdict: 'plausible' },
  };
  assert.equal(decide(parts, DEFAULTS.scoring).action, ACTIONS.WATCH);
  parts.momentum.confirmed = true;
  assert.equal(decide(parts, DEFAULTS.scoring).action, ACTIONS.ENTER);
});

test('holderConcentration excludes the pool vault', () => {
  const result = holderConcentration({
    holders: [
      { address: 'pool', amount: 400_000 },
      { address: 'whale', amount: 60_000 },
      { address: 'small', amount: 10_000 },
    ],
    supply: 1_000_000,
    poolBaseAmount: 400_000,
  });
  assert.equal(result.poolExcluded, true);
  // 70k of the 600k circulating supply.
  assert.ok(Math.abs(result.topShare - 70_000 / 600_000) < 1e-9);
});

test('holderConcentration returns null without usable inputs', () => {
  assert.equal(holderConcentration({ holders: [], supply: 100, poolBaseAmount: 0 }), null);
  assert.equal(holderConcentration({ holders: [{ amount: 1 }], supply: 0, poolBaseAmount: 0 }), null);
});

test('config: env vars override defaults with type coercion', () => {
  const config = loadConfig(
    {},
    {
      MEMEBOT_SAFETY_MIN_LIQUIDITY_USD: '50000',
      MEMEBOT_SAFETY_REQUIRE_MINT_AUTHORITY_REVOKED: 'false',
      MEMEBOT_DISCOVERY_SEARCH_TERMS: 'cat,dog',
      ANTHROPIC_API_KEY: 'test-key',
    },
  );
  assert.equal(config.safety.minLiquidityUsd, 50_000);
  assert.equal(config.safety.requireMintAuthorityRevoked, false);
  assert.deepEqual(config.discovery.searchTerms, ['cat', 'dog']);
  assert.equal(config.narrative.enabled, true);
});

test('config: narrative scoring turns itself off without credentials', () => {
  const config = loadConfig({}, {});
  assert.equal(config.narrative.enabled, false);
  assert.match(config.narrative.disabledReason, /ANTHROPIC_API_KEY/);
});
