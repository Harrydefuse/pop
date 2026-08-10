/**
 * Runner + HTTP bridge, against stubbed transports. Covers the contract the
 * dashboard depends on: the state shape, the event stream, and the fact that
 * every number crossing the wire survives JSON.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test, { afterEach, beforeEach } from 'node:test';

import { loadConfig } from '../src/config.js';
import { BotRunner } from '../src/trade/runner.js';
import { createServer } from '../src/server.js';
import { setLevel } from '../src/log.js';

setLevel('silent');

const HOUR = 3_600_000;
const realFetch = globalThis.fetch;

const PAIRS = [
  pair({ address: 'GOODMINT', symbol: 'GOOD', name: 'Good Coin', liquidityUsd: 150_000 }),
  pair({ address: 'THINMINT', symbol: 'THIN', name: 'Thin Coin', liquidityUsd: 3_000 }),
];

function pair({ address, symbol, name, liquidityUsd }) {
  return {
    chainId: 'solana',
    dexId: 'raydium',
    pairAddress: `P-${address}`,
    url: `https://dexscreener.com/solana/P-${address}`,
    baseToken: { address, name, symbol },
    quoteToken: { symbol: 'SOL' },
    priceUsd: '0.0015',
    liquidity: { usd: liquidityUsd, base: 50_000_000 },
    fdv: 1_500_000,
    marketCap: 1_500_000,
    pairCreatedAt: Date.now() - 5 * HOUR,
    txns: {
      m5: { buys: 45, sells: 15 },
      h1: { buys: 340, sells: 160 },
      h6: { buys: 900, sells: 700 },
      h24: { buys: 2400, sells: 1900 },
    },
    volume: { m5: 11_000, h1: 70_000, h6: 260_000, h24: 700_000 },
    priceChange: { m5: 4, h1: 20, h6: 45, h24: 70 },
    info: { description: `${name} coin`, imageUrl: '', websites: [{ url: 'https://x.test' }], socials: [] },
  };
}

function installFetchStub() {
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const json = (data) => ({ ok: true, status: 200, json: async () => data });
    if (href.startsWith('https://rpc.test')) {
      const body = JSON.parse(options.body);
      if (body.method === 'getAccountInfo') {
        return json({
          result: {
            value: {
              data: {
                parsed: {
                  info: {
                    mintAuthority: body.params[0] === 'THINMINT' ? 'Attacker' : null,
                    freezeAuthority: null,
                    decimals: 6,
                    supply: '1000000000000000',
                    isInitialized: true,
                  },
                },
              },
            },
          },
        });
      }
      return json({ result: { value: [{ address: 'pool', uiAmount: 50_000_000 }] } });
    }
    if (href.includes('/token-profiles/')) {
      return json(PAIRS.map((p) => ({ chainId: 'solana', tokenAddress: p.baseToken.address })));
    }
    if (href.includes('/token-boosts/')) return json([]);
    if (href.includes('/tokens/v1/solana/')) {
      const want = new Set(decodeURIComponent(href.split('/tokens/v1/solana/')[1]).split(','));
      return json(PAIRS.filter((p) => want.has(p.baseToken.address)));
    }
    throw new Error(`unstubbed fetch: ${href}`);
  };
}

const anthropic = {
  beta: {
    messages: {
      create: async () => ({
        stop_reason: 'end_turn',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              assessments: [
                { address: 'GOODMINT', score: 0.85, category: 'animal', verdict: 'compelling', rationale: 'ok', redFlags: [] },
              ],
            }),
          },
        ],
      }),
    },
  },
};

function makeRunner() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-server-'));
  const config = loadConfig(
    { dataDir: dir, solana: { rpcUrl: 'https://rpc.test/' }, discovery: { sources: ['token-profiles'] } },
    { ANTHROPIC_API_KEY: 'test-key' },
  );
  return { runner: new BotRunner(config, { anthropic }), dir };
}

/** Boot the server on an ephemeral port and hand back a fetch helper. */
async function withServer(runner, fn) {
  const server = createServer(runner);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(base, server);
  } finally {
    server.close();
  }
}

/** The server is under test, so talk to it with node:http, not the stubbed fetch. */
function request(url, { method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

beforeEach(() => installFetchStub());
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('runner emits a cycle and records an equity sample', async () => {
  const { runner } = makeRunner();
  const seen = [];
  runner.on('cycle:start', () => seen.push('start'));
  runner.on('cycle:end', () => seen.push('end'));
  runner.on('decisions', (decisions) => seen.push(`decisions:${decisions.length}`));

  await runner.runOnce();

  assert.deepEqual(seen, ['start', 'decisions:2', 'end']);
  assert.equal(runner.cycleCount, 1);
  assert.equal(runner.feed.length, 2);
  assert.equal(runner.equityHistory().length, 2, 'baseline anchor plus one sample');
});

test('runner reports stage progress in pipeline order', async () => {
  const { runner } = makeRunner();
  const stages = [];
  runner.on('stage', ({ stage }) => stages.push(stage));

  await runner.runOnce();

  assert.deepEqual(stages, ['managing', 'discovering', 'enriching', 'analyzing', 'trading', 'idle']);
});

test('a concurrent runOnce joins the in-flight cycle instead of starting a second', async () => {
  const { runner } = makeRunner();
  let starts = 0;
  runner.on('cycle:start', () => (starts += 1));

  await Promise.all([runner.runOnce(), runner.runOnce()]);

  assert.equal(starts, 1);
  assert.equal(runner.cycleCount, 1);
});

test('a failing cycle is captured rather than thrown', async () => {
  const { runner } = makeRunner();
  globalThis.fetch = async () => {
    throw new Error('network down');
  };

  const errors = [];
  runner.on('cycle:error', (payload) => errors.push(payload.message));
  await runner.runOnce();

  // Discovery swallows per-source failures, so the cycle completes with nothing
  // found; either way the runner must stay alive and keep serving state.
  assert.equal(runner.stage, 'idle');
  assert.ok(runner.summary().portfolio.equityUsd > 0);
  assert.ok(errors.length <= 1);
});

test('GET /api/state returns everything the dashboard first paints', async () => {
  const { runner } = makeRunner();
  await runner.runOnce();

  await withServer(runner, async (base) => {
    const { status, body } = await request(`${base}/api/state`);
    assert.equal(status, 200);
    const state = JSON.parse(body);

    for (const key of ['portfolio', 'positions', 'feed', 'activity', 'equity', 'risk', 'recentTrades', 'stage']) {
      assert.ok(key in state, `missing ${key}`);
    }
    assert.equal(state.chain, 'solana');
    assert.equal(state.narrativeEnabled, true);
    assert.equal(state.feed.length, 2);
    // Risk settings drive the stop/target track in the UI.
    assert.equal(state.risk.stopLossPct, 0.3);
  });
});

test('summary numbers survive JSON — no Infinity leaking through as null', async () => {
  const { runner } = makeRunner();
  await runner.runOnce();

  await withServer(runner, async (base) => {
    const { body } = await request(`${base}/api/state`);
    const { portfolio } = JSON.parse(body);
    for (const [key, value] of Object.entries(portfolio)) {
      if (typeof value === 'number') {
        assert.ok(Number.isFinite(value), `${key} is not finite over the wire: ${value}`);
      }
    }
    // No losing trades yet, so profit factor is explicitly undefined, not null-by-accident.
    assert.equal(portfolio.profitFactor, null);
  });
});

test('decision payloads carry the reasoning the UI renders', async () => {
  const { runner } = makeRunner();
  await runner.runOnce();

  await withServer(runner, async (base) => {
    const { body } = await request(`${base}/api/decisions`);
    const decisions = JSON.parse(body);
    const rejected = decisions.find((d) => d.symbol === 'THIN');

    assert.equal(rejected.action, 'reject');
    assert.ok(rejected.hardFails.length > 0);
    assert.ok(rejected.reasons.length > 0);
    assert.ok('safety' in rejected.breakdown && 'momentum' in rejected.breakdown && 'narrative' in rejected.breakdown);
  });
});

test('unknown routes 404 rather than hanging', async () => {
  const { runner } = makeRunner();
  await withServer(runner, async (base) => {
    const { status } = await request(`${base}/api/nope`);
    assert.equal(status, 404);
  });
});

test('the event stream opens with a snapshot and forwards runner events', async () => {
  const { runner } = makeRunner();

  await withServer(runner, async (base) => {
    const chunks = await new Promise((resolve, reject) => {
      const received = [];
      const req = http.get(`${base}/api/stream`, (res) => {
        assert.match(res.headers['content-type'], /text\/event-stream/);
        res.on('data', (chunk) => {
          received.push(chunk.toString());
          // Snapshot, then a full cycle's worth of events.
          if (received.join('').includes('event: cycle:end')) {
            req.destroy();
            resolve(received.join(''));
          }
        });
      });
      req.on('error', (error) => (error.code === 'ECONNRESET' ? resolve(received.join('')) : reject(error)));
      setTimeout(() => runner.runOnce(), 50);
      setTimeout(() => reject(new Error('timed out waiting for stream events')), 15_000);
    });

    assert.match(chunks, /event: snapshot/);
    assert.match(chunks, /event: cycle:start/);
    assert.match(chunks, /event: decisions/);
    assert.match(chunks, /event: cycle:end/);
  });
});

test('POST /api/scan triggers a cycle and returns immediately', async () => {
  const { runner } = makeRunner();

  await withServer(runner, async (base) => {
    const started = new Promise((resolve) => runner.once('cycle:start', resolve));
    const { status, body } = await request(`${base}/api/scan`, { method: 'POST' });

    assert.equal(status, 202);
    assert.equal(JSON.parse(body).accepted, true);
    await started;
    await runner.cycleInFlight;
    assert.equal(runner.cycleCount, 1);
  });
});

test('a disconnected stream client does not break broadcasting', async () => {
  const { runner } = makeRunner();

  await withServer(runner, async (base, server) => {
    await new Promise((resolve) => {
      const req = http.get(`${base}/api/stream`, (res) => {
        res.once('data', () => {
          req.destroy();
          resolve();
        });
      });
    });

    // Give the socket close a tick to land, then prove the runner still works.
    await new Promise((resolve) => setTimeout(resolve, 50));
    await runner.runOnce();
    assert.equal(runner.cycleCount, 1);
    assert.ok(server.clientCount <= 1);
  });
});
