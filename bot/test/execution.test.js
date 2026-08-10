/**
 * Live-execution safety net.
 *
 * These are the tests that matter most in this repo: everything here decides
 * whether real money moves. The guard is exercised against each limit
 * independently, and the executor is driven with stub adapters so the
 * build → sign → send → read-fill path runs end to end without a network.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

import { loadConfig } from '../src/config.js';
import { ARM_PHRASE, GuardError, TradeGuard } from '../src/execute/guard.js';
import { createExecutor, LiveExecutor, PaperExecutor } from '../src/execute/index.js';
import { readBuyFill, readSellFill, solPriceFromPair, tokenDelta } from '../src/execute/fills.js';
import { Wallet, keypairFromSecret } from '../src/execute/wallet.js';
import { Portfolio } from '../src/trade/portfolio.js';
import { safetyFor, venueAllowed, venueFor } from '../src/venues/index.js';
import { setLevel } from '../src/log.js';

setLevel('silent');

const encodeBase58 = bs58.default?.encode ?? bs58.encode;
const OWNER = 'ownerPubkey1111111111111111111111111111111';
const MINT = 'MINT1111111111111111111111111111111111111';

function tempConfig(overrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-exec-'));
  return loadConfig({ dataDir: dir, ...overrides }, { ANTHROPIC_API_KEY: 'k' });
}

/** A config whose three arming conditions are all satisfied. */
function armedConfig(overrides = {}) {
  return tempConfig({
    mode: 'live',
    execution: { armPhrase: ARM_PHRASE, maxTradeUsd: 25, maxDailySpendUsd: 100, ...overrides.execution },
    ...overrides,
  });
}

const ARMED_ENV = { MEMEBOT_LIVE_ARMED: 'true' };

function order(overrides = {}) {
  return { sizeUsd: 10, mint: MINT, symbol: 'TEST', solBalance: 1, openPositions: 0, ...overrides };
}

// ── venues ───────────────────────────────────────────────────────────────────

test('venues: pump.fun is a bonding curve routed to its own adapter', () => {
  const pumpfun = venueFor('pumpfun');
  assert.equal(pumpfun.kind, 'curve');
  assert.equal(pumpfun.adapter, 'pumpportal');
  assert.equal(pumpfun.graduatesTo, 'pumpswap');

  const pumpswap = venueFor('pumpswap');
  assert.equal(pumpswap.kind, 'amm');
  assert.equal(pumpswap.adapter, 'jupiter');
});

test('venues: an unknown dex resolves rather than throwing', () => {
  const venue = venueFor('some-new-dex');
  assert.equal(venue.unknown, true);
  assert.equal(venue.adapter, 'jupiter');
});

test('venues: the allowlist gates by id, launchpad group, or wildcard', () => {
  assert.equal(venueAllowed('raydium', ['pumpfun', 'pumpswap']), false);
  assert.equal(venueAllowed('pumpfun', ['pumpfun', 'pumpswap']), true);
  assert.equal(venueAllowed('raydium', ['*']), true);
  assert.equal(venueAllowed('raydium', []), true, 'empty list means any venue');
  assert.equal(venueAllowed('moonshot', ['launchpads']), true);
  assert.equal(venueAllowed('orca', ['launchpads']), false);
});

test('venues: bonding-curve tokens get their own safety thresholds', () => {
  const config = tempConfig();
  const curve = safetyFor('pumpfun', config.safety);
  const amm = safetyFor('raydium', config.safety);

  assert.ok(curve.minLiquidityUsd < amm.minLiquidityUsd, 'a fresh curve cannot meet AMM depth');
  assert.equal(amm.minLiquidityUsd, config.safety.minLiquidityUsd);
  // Relaxing depth must not quietly relax the authority checks.
  assert.equal(curve.requireMintAuthorityRevoked, true);
  assert.equal(curve.requireFreezeAuthorityRevoked, true);
});

// ── wallet ───────────────────────────────────────────────────────────────────

test('wallet: accepts both base58 and JSON-array key formats', () => {
  const keypair = Keypair.generate();
  const fromBase58 = keypairFromSecret(encodeBase58(keypair.secretKey));
  const fromArray = keypairFromSecret(JSON.stringify([...keypair.secretKey]));

  assert.equal(fromBase58.publicKey.toBase58(), keypair.publicKey.toBase58());
  assert.equal(fromArray.publicKey.toBase58(), keypair.publicKey.toBase58());
});

test('wallet: a malformed key is rejected, not silently accepted', () => {
  assert.throws(() => keypairFromSecret('[1,2,3]'), /64-byte/);
  assert.throws(() => keypairFromSecret(encodeBase58(Buffer.alloc(32))), /64-byte/);
});

test('wallet: serialising never exposes the secret key', () => {
  const keypair = Keypair.generate();
  const wallet = new Wallet(keypair, 'test');
  const secretBase58 = encodeBase58(keypair.secretKey);

  const serialised = JSON.stringify({ wallet });
  assert.ok(!serialised.includes(secretBase58));
  assert.ok(!serialised.includes(String(keypair.secretKey[0]) + ',' + String(keypair.secretKey[1])));
  assert.match(serialised, /address/);
  assert.ok(!`${wallet}`.includes(secretBase58));
});

// ── guard: arming ────────────────────────────────────────────────────────────

test('guard: live trading needs all three arming conditions', () => {
  const guard = new TradeGuard(armedConfig());
  assert.equal(guard.armedStatus(ARMED_ENV).armed, true);

  assert.equal(new TradeGuard(tempConfig()).armedStatus(ARMED_ENV).armed, false, 'paper mode');
  assert.equal(
    new TradeGuard(armedConfig({ execution: { armPhrase: 'yes please' } })).armedStatus(ARMED_ENV).armed,
    false,
    'wrong arm phrase',
  );
  assert.equal(guard.armedStatus({}).armed, false, 'missing env var');
});

test('guard: the arm phrase must match exactly', () => {
  const guard = new TradeGuard(armedConfig({ execution: { armPhrase: `${ARM_PHRASE} ` } }));
  const { armed, reasons } = guard.armedStatus(ARMED_ENV);
  assert.equal(armed, false);
  assert.match(reasons.join(' '), /armPhrase/);
});

// ── guard: limits ────────────────────────────────────────────────────────────

test('guard: a trade above the per-trade cap is refused', () => {
  const guard = new TradeGuard(armedConfig({ execution: { armPhrase: ARM_PHRASE, maxTradeUsd: 25 } }));
  assert.doesNotThrow(() => guard.check(order({ sizeUsd: 25 }), ARMED_ENV));
  assert.throws(() => guard.check(order({ sizeUsd: 25.01 }), ARMED_ENV), (error) => {
    assert.ok(error instanceof GuardError);
    assert.equal(error.message, 'trade-cap-exceeded');
    return true;
  });
});

test('guard: the daily cap counts confirmed spend and survives a restart', () => {
  const config = armedConfig({
    execution: { armPhrase: ARM_PHRASE, maxTradeUsd: 30, maxDailySpendUsd: 50, minSecondsBetweenTrades: 0 },
  });
  const guard = new TradeGuard(config);

  guard.check(order({ sizeUsd: 30 }), ARMED_ENV);
  guard.recordSpend({ sizeUsd: 30, mint: MINT, symbol: 'A', signature: 'sig1' });
  assert.equal(guard.spentTodayUsd, 30);
  assert.equal(guard.remainingTodayUsd, 20);

  assert.throws(() => guard.check(order({ sizeUsd: 25 }), ARMED_ENV), /daily-cap-exceeded/);

  // A crash loop must not reset the budget.
  const reloaded = new TradeGuard(config);
  assert.equal(reloaded.spentTodayUsd, 30);
  assert.throws(() => reloaded.check(order({ sizeUsd: 25 }), ARMED_ENV), /daily-cap-exceeded/);
});

test('guard: the daily trade count is capped independently of spend', () => {
  const guard = new TradeGuard(
    armedConfig({
      execution: { armPhrase: ARM_PHRASE, maxTradeUsd: 1, maxDailySpendUsd: 1000, maxTradesPerDay: 2, minSecondsBetweenTrades: 0 },
    }),
  );

  for (let i = 0; i < 2; i += 1) {
    guard.check(order({ sizeUsd: 1 }), ARMED_ENV);
    guard.recordSpend({ sizeUsd: 1, mint: MINT, symbol: 'A', signature: `sig${i}` });
  }
  assert.throws(() => guard.check(order({ sizeUsd: 1 }), ARMED_ENV), /daily-trade-count-exceeded/);
});

test('guard: spending below the SOL reserve is refused', () => {
  const guard = new TradeGuard(armedConfig({ execution: { armPhrase: ARM_PHRASE, minSolReserve: 0.05 } }));
  assert.throws(() => guard.check(order({ solBalance: 0.01 }), ARMED_ENV), /sol-reserve-breached/);
  assert.doesNotThrow(() => guard.check(order({ solBalance: 0.5 }), ARMED_ENV));
});

test('guard: mint allow and deny lists are enforced', () => {
  const denied = new TradeGuard(armedConfig({ execution: { armPhrase: ARM_PHRASE, denyMints: [MINT] } }));
  assert.throws(() => denied.check(order(), ARMED_ENV), /mint-denied/);

  const restricted = new TradeGuard(armedConfig({ execution: { armPhrase: ARM_PHRASE, allowMints: ['OTHER'] } }));
  assert.throws(() => restricted.check(order(), ARMED_ENV), /mint-not-allowlisted/);
});

test('guard: trades are rate limited', () => {
  let clock = Date.UTC(2026, 0, 1, 12, 0, 0);
  const guard = new TradeGuard(
    armedConfig({ execution: { armPhrase: ARM_PHRASE, minSecondsBetweenTrades: 60 } }),
    { now: () => clock },
  );

  guard.check(order(), ARMED_ENV);
  guard.recordSpend({ sizeUsd: 10, mint: MINT, symbol: 'A', signature: 'sig' });

  clock += 30_000;
  assert.throws(() => guard.check(order(), ARMED_ENV), /rate-limited/);

  clock += 31_000;
  assert.doesNotThrow(() => guard.check(order(), ARMED_ENV));
});

test('guard: spend resets on a new UTC day', () => {
  let clock = Date.UTC(2026, 0, 1, 23, 0, 0);
  const config = armedConfig({ execution: { armPhrase: ARM_PHRASE, maxDailySpendUsd: 50, minSecondsBetweenTrades: 0 } });
  const guard = new TradeGuard(config, { now: () => clock });

  guard.recordSpend({ sizeUsd: 50, mint: MINT, symbol: 'A', signature: 'sig' });
  assert.equal(guard.spentTodayUsd, 50);

  clock = Date.UTC(2026, 0, 2, 1, 0, 0);
  assert.equal(guard.spentTodayUsd, 0);
  assert.doesNotThrow(() => guard.check(order({ sizeUsd: 25 }), ARMED_ENV));
});

// ── guard: kill switch ───────────────────────────────────────────────────────

test('guard: the kill switch disarms without touching config', () => {
  const guard = new TradeGuard(armedConfig());
  assert.equal(guard.armedStatus(ARMED_ENV).armed, true);

  const file = guard.engageKillSwitch('test');
  assert.ok(fs.existsSync(file));
  assert.equal(guard.armedStatus(ARMED_ENV).armed, false);
  assert.throws(() => guard.check(order(), ARMED_ENV), /not-armed/);

  guard.releaseKillSwitch();
  assert.equal(guard.armedStatus(ARMED_ENV).armed, true);
});

// ── fills ────────────────────────────────────────────────────────────────────

function buyTransaction({ solSpent = 0.1, tokensReceived = 1000, fee = 5000, err = null } = {}) {
  const lamports = 1_000_000_000;
  return {
    meta: {
      err,
      fee,
      preBalances: [2 * lamports, 0],
      postBalances: [Math.round((2 - solSpent) * lamports), 0],
      preTokenBalances: [{ owner: OWNER, mint: MINT, uiTokenAmount: { uiAmount: 0, decimals: 6 } }],
      postTokenBalances: [{ owner: OWNER, mint: MINT, uiTokenAmount: { uiAmount: tokensReceived, decimals: 6 } }],
    },
    transaction: { message: { staticAccountKeys: [{ toBase58: () => OWNER }, { toBase58: () => 'other' }] } },
  };
}

test('fills: a buy is read from the transaction, not the quote', () => {
  const fill = readBuyFill(buyTransaction({ solSpent: 0.1, tokensReceived: 1000 }), {
    owner: OWNER,
    mint: MINT,
    solPriceUsd: 200,
  });

  assert.equal(fill.quantity, 1000);
  assert.equal(fill.decimals, 6);
  assert.ok(Math.abs(fill.costUsd - 20) < 0.01, `expected ~$20, got ${fill.costUsd}`);
  assert.ok(Math.abs(fill.fillPriceUsd - 0.02) < 0.0001);
});

test('fills: a failed or unreadable transaction yields null, never a fake fill', () => {
  assert.equal(readBuyFill(buyTransaction({ err: { InstructionError: [0, 'custom'] } }), { owner: OWNER, mint: MINT, solPriceUsd: 200 }), null);
  assert.equal(readBuyFill(null, { owner: OWNER, mint: MINT, solPriceUsd: 200 }), null);
  assert.equal(readBuyFill(buyTransaction({ tokensReceived: 0 }), { owner: OWNER, mint: MINT, solPriceUsd: 200 }), null);
  // A buy transaction is not a sell.
  assert.equal(readSellFill(buyTransaction(), { owner: OWNER, mint: MINT, solPriceUsd: 200 }), null);
});

test('fills: token deltas ignore other wallets holding the same mint', () => {
  const transaction = buyTransaction();
  transaction.meta.postTokenBalances.unshift({
    owner: 'someoneElse',
    mint: MINT,
    uiTokenAmount: { uiAmount: 999_999, decimals: 6 },
  });
  assert.equal(tokenDelta(transaction, OWNER, MINT).delta, 1000);
});

test('fills: the SOL price is derived from the pair we already fetched', () => {
  assert.equal(solPriceFromPair({ quoteSymbol: 'SOL', priceUsd: 0.02, priceNative: 0.0001 }), 200);
  assert.equal(solPriceFromPair({ quoteSymbol: 'USDC', priceUsd: 0.02, priceNative: 0.02 }), null);
  assert.equal(solPriceFromPair({ quoteSymbol: 'SOL', priceUsd: 0, priceNative: 0.0001 }), null);
});

// ── executor selection ───────────────────────────────────────────────────────

test('executor: paper mode never returns a live executor', () => {
  const config = tempConfig();
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  const executor = createExecutor(config, { portfolio, env: ARMED_ENV });

  assert.ok(executor instanceof PaperExecutor);
  assert.equal(executor.mode, 'paper');
});

test('executor: an unarmed live config falls back to paper instead of trading', () => {
  const config = armedConfig();
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);

  // Live mode, correct phrase, but the environment variable is absent.
  const executor = createExecutor(config, { portfolio, env: {} });
  assert.ok(executor instanceof PaperExecutor, 'must degrade to paper, never trade unguarded');
});

test('executor: live mode without a wallet falls back to paper', () => {
  const config = armedConfig();
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  const executor = createExecutor(config, { portfolio, env: ARMED_ENV });
  assert.ok(executor instanceof PaperExecutor);
});

// ── live executor, with stub adapters ────────────────────────────────────────

function liveHarness({ execution = {}, adapters, transaction = buyTransaction(), balance = 1 } = {}) {
  const config = armedConfig({
    execution: { armPhrase: ARM_PHRASE, minSecondsBetweenTrades: 0, ...execution },
  });
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  const keypair = Keypair.generate();
  const wallet = new Wallet(keypair, 'test');
  // The fill reader keys off the owner address, so make the stub agree with it.
  Object.defineProperty(wallet, 'address', { value: OWNER });

  const sent = [];
  const connection = {
    getBalance: async () => balance * 1_000_000_000,
    sendRawTransaction: async (raw) => {
      sent.push(raw);
      return 'SIGNATURE111';
    },
    getSignatureStatuses: async () => ({ value: [{ err: null, confirmationStatus: 'confirmed' }] }),
    getTransaction: async () => transaction,
  };

  const built = [];
  const defaults = {
    jupiter: {
      buildBuy: async (args) => {
        built.push({ adapter: 'jupiter', ...args });
        return { adapter: 'jupiter', transactionBase64: 'AA==', priceImpact: 0.01 };
      },
      buildSell: async (args) => {
        built.push({ adapter: 'jupiter', side: 'sell', ...args });
        return { adapter: 'jupiter', transactionBase64: 'AA==' };
      },
    },
    pumpportal: {
      buildBuy: async (args) => {
        built.push({ adapter: 'pumpportal', ...args });
        return { adapter: 'pumpportal', transactionBase64: 'AA==', priceImpact: null };
      },
      buildSell: async (args) => {
        built.push({ adapter: 'pumpportal', side: 'sell', ...args });
        return { adapter: 'pumpportal', transactionBase64: 'AA==' };
      },
      bpsToPercent: (bps) => bps / 100,
    },
  };

  const guard = new TradeGuard(config);
  const executor = new LiveExecutor(config, {
    portfolio,
    wallet,
    connection,
    guard,
    adapters: adapters ?? defaults,
    env: ARMED_ENV,
  });
  // Signing a stub transaction is not what these tests are about.
  wallet.signBase64 = (base64) => base64;

  return { config, portfolio, executor, guard, built, sent };
}

function token(overrides = {}) {
  return {
    address: MINT,
    symbol: 'TEST',
    name: 'Test Coin',
    chainId: 'solana',
    dexId: 'pumpfun',
    url: 'https://dexscreener.com/solana/x',
    quoteSymbol: 'SOL',
    priceUsd: 0.02,
    priceNative: 0.0001,
    liquidityUsd: 50_000,
    ...overrides,
  };
}

test('live: a pump.fun token routes to the bonding-curve adapter', async () => {
  const { executor, built } = liveHarness();
  const result = await executor.buy(token({ dexId: 'pumpfun' }), { sizeUsd: 20, score: 0.8, reason: 'test' });

  assert.equal(result.ok, true);
  assert.equal(built[0].adapter, 'pumpportal');
  // PumpPortal takes percent, Jupiter takes basis points — a 100x mix-up here
  // would be catastrophic, so assert the unit conversion explicitly.
  assert.equal(built[0].slippagePercent, 3);
  assert.equal(result.position.venue, 'pumpfun');
});

test('live: a graduated token routes to the AMM aggregator', async () => {
  const { executor, built } = liveHarness();
  await executor.buy(token({ dexId: 'pumpswap' }), { sizeUsd: 20, score: 0.8, reason: 'test' });

  assert.equal(built[0].adapter, 'jupiter');
  assert.equal(built[0].slippageBps, 300);
});

test('live: the position records the on-chain fill, not the quote', async () => {
  const { executor, portfolio } = liveHarness({
    // 0.1 SOL at $200 = $20 for 1000 tokens, so $0.02 each.
    transaction: buyTransaction({ solSpent: 0.1, tokensReceived: 1000 }),
  });

  const result = await executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });

  assert.equal(result.position.quantity, 1000);
  assert.equal(result.position.live, true);
  assert.equal(result.position.signature, 'SIGNATURE111');
  assert.ok(Math.abs(result.position.costUsd - 20) < 0.01);
  assert.equal(portfolio.openPositions.length, 1);
});

test('live: the guard blocks the order before any transaction is built', async () => {
  const { executor, built } = liveHarness({ execution: { maxTradeUsd: 5 } });
  const result = await executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'trade-cap-exceeded');
  assert.equal(built.length, 0, 'nothing should reach the adapter');
});

test('live: spend is only recorded after the transaction confirms', async () => {
  const { executor, guard } = liveHarness({
    adapters: {
      jupiter: {
        buildBuy: async () => {
          throw new Error('no route');
        },
      },
      pumpportal: {
        buildBuy: async () => {
          throw new Error('no route');
        },
        bpsToPercent: (bps) => bps / 100,
      },
    },
  });

  const result = await executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'build-failed');
  assert.equal(guard.spentTodayUsd, 0, 'a failed order must not consume the daily budget');
});

test('live: a quote whose price impact exceeds the budget is not signed', async () => {
  const { executor, sent } = liveHarness({
    execution: { maxSlippageBps: 100 },
    adapters: {
      jupiter: {
        buildBuy: async () => ({ adapter: 'jupiter', transactionBase64: 'AA==', priceImpact: 0.25 }),
      },
      pumpportal: { bpsToPercent: (bps) => bps / 100 },
    },
  });

  const result = await executor.buy(token({ dexId: 'pumpswap' }), { sizeUsd: 20, score: 0.8, reason: 'test' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'price-impact-too-high');
  assert.equal(sent.length, 0);
});

test('live: an unreadable fill engages the kill switch instead of guessing', async () => {
  const { executor, guard, portfolio } = liveHarness({ transaction: { meta: null } });

  const result = await executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unreadable-fill');
  assert.equal(guard.killSwitchEngaged(), true);
  assert.equal(portfolio.openPositions.length, 0);
});

test('live: an on-chain failure surfaces as a failed order, not a phantom position', async () => {
  const { executor, portfolio, guard } = liveHarness();
  executor.connection.getSignatureStatuses = async () => ({
    value: [{ err: { InstructionError: [0, 'custom'] } }],
  });

  const result = await executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'send-failed');
  assert.equal(portfolio.openPositions.length, 0);
  assert.equal(guard.spentTodayUsd, 0);
});

test('live: a failed exit engages the kill switch and keeps the position open', async () => {
  const { executor, portfolio, guard } = liveHarness();
  await executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });
  const [position] = portfolio.openPositions;

  executor.connection.sendRawTransaction = async () => {
    throw new Error('blockhash not found');
  };

  const result = await executor.sell(position, { priceUsd: 0.01, reason: 'stop loss', token: token() });
  assert.equal(result.ok, false);
  assert.equal(portfolio.openPositions.length, 1, 'an unsellable position must stay on the books');
  assert.equal(guard.killSwitchEngaged(), true);
});

test('live: a successful exit closes against the real proceeds', async () => {
  const harness = liveHarness();
  await harness.executor.buy(token(), { sizeUsd: 20, score: 0.8, reason: 'test' });
  const [position] = harness.portfolio.openPositions;

  // Sell 1000 tokens back for 0.15 SOL = $30 at $200/SOL.
  harness.executor.connection.getTransaction = async () => ({
    meta: {
      err: null,
      fee: 5000,
      preBalances: [1_000_000_000, 0],
      postBalances: [1_150_000_000, 0],
      preTokenBalances: [{ owner: OWNER, mint: MINT, uiTokenAmount: { uiAmount: 1000, decimals: 6 } }],
      postTokenBalances: [{ owner: OWNER, mint: MINT, uiTokenAmount: { uiAmount: 0, decimals: 6 } }],
    },
    transaction: { message: { staticAccountKeys: [{ toBase58: () => OWNER }, { toBase58: () => 'other' }] } },
  });

  const result = await harness.executor.sell(position, { priceUsd: 0.03, reason: 'take profit', token: token() });

  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.trade.proceedsUsd - 30) < 0.01);
  assert.ok(result.trade.pnlUsd > 9, `expected ~+$10, got ${result.trade.pnlUsd}`);
  assert.equal(harness.portfolio.openPositions.length, 0);
});
