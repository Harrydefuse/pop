/**
 * End-to-end pipeline test with stubbed transports: DexScreener and the Solana
 * RPC are served by a fake `fetch`, and Claude by a fake client. Proves the
 * wiring — discovery through to a persisted paper trade — without a network.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { afterEach, beforeEach } from 'node:test';

import { loadConfig } from '../src/config.js';
import { runCycle } from '../src/trade/engine.js';
import { Portfolio } from '../src/trade/portfolio.js';
import { readJsonl } from '../src/store.js';
import { setLevel } from '../src/log.js';

setLevel('silent');

const HOUR = 3_600_000;
const realFetch = globalThis.fetch;

function pairFixture({ address, symbol, name, liquidityUsd = 150_000, buys5m = 45, sells5m = 15, change1h = 20 }) {
  return {
    chainId: 'solana',
    dexId: 'raydium',
    pairAddress: `PAIR-${address}`,
    url: `https://dexscreener.com/solana/PAIR-${address}`,
    baseToken: { address, name, symbol },
    quoteToken: { symbol: 'SOL' },
    priceUsd: '0.0015',
    liquidity: { usd: liquidityUsd, base: 50_000_000 },
    fdv: 1_500_000,
    marketCap: 1_500_000,
    pairCreatedAt: Date.now() - 5 * HOUR,
    txns: {
      m5: { buys: buys5m, sells: sells5m },
      h1: { buys: 340, sells: 160 },
      h6: { buys: 900, sells: 700 },
      h24: { buys: 2400, sells: 1900 },
    },
    volume: { m5: 11_000, h1: 70_000, h6: 260_000, h24: 700_000 },
    priceChange: { m5: 4, h1: change1h, h6: 45, h24: 70 },
    info: {
      description: `${name} is a coin`,
      imageUrl: 'https://img',
      websites: [{ url: 'https://example.test' }],
      socials: [{ type: 'twitter', url: 'https://x.com/example' }],
    },
  };
}

const TOKENS = [
  pairFixture({ address: 'GOODMINT', symbol: 'GOOD', name: 'Good Coin' }),
  // Thin pool: must be rejected by the safety screen before anything else runs.
  pairFixture({ address: 'THINMINT', symbol: 'THIN', name: 'Thin Coin', liquidityUsd: 3_000 }),
];

/** Live mint authority on THINMINT; clean on everything else. */
function rpcResponse(body) {
  if (body.method === 'getAccountInfo') {
    const mint = body.params[0];
    return {
      value: {
        data: {
          parsed: {
            info: {
              mintAuthority: mint === 'THINMINT' ? 'AttackerWallet' : null,
              freezeAuthority: null,
              decimals: 6,
              supply: '1000000000000000',
              isInitialized: true,
            },
          },
        },
      },
    };
  }
  if (body.method === 'getTokenLargestAccounts') {
    return {
      value: [
        { address: 'poolVault', uiAmount: 50_000_000 },
        { address: 'whale', uiAmount: 40_000_000 },
        { address: 'holder', uiAmount: 20_000_000 },
      ],
    };
  }
  throw new Error(`unstubbed rpc method: ${body.method}`);
}

let calls;

function installFetchStub({ priceOverrides = {} } = {}) {
  calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    calls.push(href);
    const json = (data) => ({ ok: true, status: 200, json: async () => data });

    if (href.startsWith('https://rpc.test')) {
      return json({ jsonrpc: '2.0', id: 1, result: rpcResponse(JSON.parse(options.body)) });
    }
    if (href.includes('/token-profiles/latest/v1')) {
      return json(TOKENS.map((pair) => ({ chainId: 'solana', tokenAddress: pair.baseToken.address })));
    }
    if (href.includes('/token-boosts/')) return json([]);
    if (href.includes('/tokens/v1/solana/')) {
      const requested = new Set(decodeURIComponent(href.split('/tokens/v1/solana/')[1]).split(','));
      return json(
        TOKENS.filter((pair) => requested.has(pair.baseToken.address)).map((pair) => {
          const override = priceOverrides[pair.baseToken.address];
          return override ? { ...pair, priceUsd: String(override) } : pair;
        }),
      );
    }
    throw new Error(`unstubbed fetch: ${href}`);
  };
}

function fakeAnthropic(assessments) {
  return {
    beta: {
      messages: {
        create: async () => ({
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: JSON.stringify({ assessments }) }],
        }),
      },
    },
  };
}

function testConfig(dataDir, overrides = {}) {
  return loadConfig(
    {
      dataDir,
      solana: { rpcUrl: 'https://rpc.test/' },
      discovery: { sources: ['token-profiles'] },
      ...overrides,
    },
    { ANTHROPIC_API_KEY: 'test-key' },
  );
}

beforeEach(() => installFetchStub());
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('a full cycle screens, scores and opens a paper position', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-cycle-'));
  const config = testConfig(dir);

  const cycle = await runCycle(config, {
    anthropic: fakeAnthropic([
      { address: 'GOODMINT', score: 0.8, category: 'animal', verdict: 'compelling', rationale: 'clear concept', redFlags: [] },
    ]),
  });

  assert.equal(cycle.analyzed, 2);

  const good = cycle.results.find((r) => r.token.symbol === 'GOOD');
  const thin = cycle.results.find((r) => r.token.symbol === 'THIN');

  assert.equal(good.decision.action, 'enter');
  assert.equal(good.narrative.score, 0.8);
  assert.equal(thin.decision.action, 'reject');
  assert.ok(thin.safety.hardFails.length > 0);

  assert.equal(cycle.opened.length, 1);
  assert.equal(cycle.opened[0].symbol, 'GOOD');
  assert.ok(cycle.portfolio.state.cashUsd < config.risk.startingCashUsd);

  const signals = readJsonl(dir, 'signals.jsonl');
  assert.equal(signals.length, 2);
  assert.ok(readJsonl(dir, 'trades.jsonl').some((t) => t.type === 'open'));
});

test('narrative scoring is skipped for tokens that fail the safety screen', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-skip-'));
  const consulted = [];
  const client = {
    beta: {
      messages: {
        create: async (request) => {
          consulted.push(request);
          return {
            stop_reason: 'end_turn',
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  assessments: [
                    { address: 'GOODMINT', score: 0.7, category: 'animal', verdict: 'plausible', rationale: 'ok', redFlags: [] },
                  ],
                }),
              },
            ],
          };
        },
      },
    },
  };

  await runCycle(testConfig(dir), { anthropic: client, dryRun: true });

  assert.equal(consulted.length, 1, 'one batched call');
  const prompt = consulted[0].messages[0].content;
  assert.match(prompt, /GOODMINT/);
  assert.doesNotMatch(prompt, /THINMINT/, 'rejected tokens must never reach the model');
});

test('dry run analyses without opening positions', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-dry-'));
  const config = testConfig(dir);
  const cycle = await runCycle(config, {
    anthropic: fakeAnthropic([
      { address: 'GOODMINT', score: 0.9, category: 'animal', verdict: 'compelling', rationale: 'ok', redFlags: [] },
    ]),
    dryRun: true,
  });

  assert.equal(cycle.opened.length, 0);
  assert.equal(cycle.portfolio.state.cashUsd, config.risk.startingCashUsd);
});

test('a failed narrative call degrades to neutral instead of blocking the cycle', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-degrade-'));
  const broken = {
    beta: {
      messages: {
        create: async () => {
          throw new Error('upstream unavailable');
        },
      },
    },
  };

  const cycle = await runCycle(testConfig(dir), { anthropic: broken, dryRun: true });
  const good = cycle.results.find((r) => r.token.symbol === 'GOOD');
  assert.equal(good.narrative.score, 0.5);
  assert.equal(good.narrative.unavailable, true);
  assert.ok(good.decision.score > 0);
});

test('the next cycle marks an open position and exits it on the stop loss', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-exit-'));
  const config = testConfig(dir);
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);

  await runCycle(config, {
    portfolio,
    anthropic: fakeAnthropic([
      { address: 'GOODMINT', score: 0.85, category: 'animal', verdict: 'compelling', rationale: 'ok', redFlags: [] },
    ]),
  });
  assert.equal(portfolio.openPositions.length, 1);

  // Price halves before the next cycle.
  installFetchStub({ priceOverrides: { GOODMINT: 0.00075 } });
  const second = await runCycle(config, { portfolio, anthropic: fakeAnthropic([]) });

  assert.equal(second.closed.length, 1);
  assert.match(second.closed[0].exitReason, /stop loss/);
  assert.equal(portfolio.openPositions.length, 0);
  assert.ok(portfolio.summary().totalPnlUsd < 0);
});

test('a held token is not re-analysed as a fresh candidate', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-held-'));
  const config = testConfig(dir);
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  const narrative = fakeAnthropic([
    { address: 'GOODMINT', score: 0.85, category: 'animal', verdict: 'compelling', rationale: 'ok', redFlags: [] },
  ]);

  await runCycle(config, { portfolio, anthropic: narrative });
  const second = await runCycle(config, { portfolio, anthropic: narrative });

  assert.ok(!second.results.some((r) => r.token.address === 'GOODMINT'));
  assert.equal(portfolio.openPositions.length, 1, 'no double entry across cycles');
});
