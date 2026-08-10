import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { DEFAULTS } from '../src/config.js';
import { Portfolio, slippageFor } from '../src/trade/portfolio.js';
import { JsonStore, appendJsonl, readJsonl } from '../src/store.js';

const HOUR = 3_600_000;

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-test-'));
}

function token(overrides = {}) {
  return {
    address: 'MINT',
    symbol: 'GOOD',
    name: 'Good Coin',
    chainId: 'solana',
    url: 'https://dexscreener.com/solana/PAIR',
    priceUsd: 0.001,
    liquidityUsd: 200_000,
    ...overrides,
  };
}

test('slippage grows with size and vanishes on a deep pool', () => {
  const small = slippageFor(100, 1_000_000);
  const large = slippageFor(50_000, 1_000_000);
  assert.ok(small < large);
  assert.ok(small < 0.001, `expected tiny slippage, got ${small}`);
  assert.equal(slippageFor(100, 0), 1, 'no liquidity means no fill');
});

test('opening a position debits cash and applies entry slippage', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  const position = portfolio.open(token(), { sizeUsd: 50, score: 0.8, reason: 'test' });

  assert.ok(position);
  assert.ok(position.entryPriceUsd > 0.001, 'fill should be worse than the quote');
  assert.equal(portfolio.state.cashUsd, DEFAULTS.risk.startingCashUsd - 50);
  assert.equal(portfolio.has('MINT'), true);
  assert.equal(portfolio.open(token(), { sizeUsd: 50 }), null, 'no double entry');
});

test('equity reflects the entry cost immediately, not only on exit', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  portfolio.open(token(), { sizeUsd: 100 });

  const equity = portfolio.equity();
  assert.ok(equity < DEFAULTS.risk.startingCashUsd, 'a fresh position must not mark at break-even');
  assert.ok(equity > DEFAULTS.risk.startingCashUsd - 10, `entry cost looks wrong: ${equity}`);
});

test('a round trip at the entry price loses money to fees and slippage', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  portfolio.open(token(), { sizeUsd: 100 });
  const trade = portfolio.close('MINT', { priceUsd: 0.001, liquidityUsd: 200_000, reason: 'test' });

  assert.ok(trade.pnlUsd < 0, 'costs must be modelled, not assumed away');
  assert.ok(trade.pnlPct > -0.1, `costs look implausibly large: ${trade.pnlPct}`);
  assert.equal(portfolio.openPositions.length, 0);
  assert.equal(portfolio.state.stats.trades, 1);
});

test('position sizing is capped by pool depth', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  // 0.5% of a $2,000 pool is $10, well below the $50 bankroll allocation.
  assert.equal(portfolio.sizeFor(token({ liquidityUsd: 2_000 })), 10);
  assert.equal(portfolio.sizeFor(token({ liquidityUsd: 10_000_000 })), 50);
});

test('position sizing respects the open-position limit', () => {
  const portfolio = new Portfolio(tempDir(), { ...DEFAULTS.risk, maxOpenPositions: 2 });
  portfolio.open(token({ address: 'A' }), { sizeUsd: 10 });
  portfolio.open(token({ address: 'B' }), { sizeUsd: 10 });
  assert.equal(portfolio.sizeFor(token({ address: 'C' })), 0);
});

test('exit rules fire in worst-case-first order', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  const position = portfolio.open(token(), { sizeUsd: 50 });
  const entry = position.entryPriceUsd;

  assert.equal(portfolio.exitSignal(position, entry * 1.1).exit, false);
  assert.match(portfolio.exitSignal(position, entry * 0.6).reason, /stop loss/);
  assert.match(portfolio.exitSignal(position, entry * 2).reason, /take profit/);

  // Run to +60%, then give back 30% of the peak: the trailing stop takes over.
  portfolio.mark('MINT', entry * 1.6);
  assert.match(portfolio.exitSignal(position, entry * 1.1).reason, /trailing stop/);
});

test('a stale position times out', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  const now = Date.now();
  const position = portfolio.open(token(), { sizeUsd: 50, now: now - 30 * HOUR });
  const signal = portfolio.exitSignal(position, position.entryPriceUsd, now);
  assert.equal(signal.exit, true);
  assert.match(signal.reason, /max hold/);
});

test('a closed token is blocked from re-entry until the cooldown expires', () => {
  const dir = tempDir();
  const risk = { ...DEFAULTS.risk, reentryCooldownHours: 2 };
  const portfolio = new Portfolio(dir, risk);
  const now = Date.now();

  portfolio.open(token(), { sizeUsd: 50, now });
  portfolio.close('MINT', { priceUsd: 0.0005, liquidityUsd: 200_000, reason: 'stop loss', now });

  assert.equal(portfolio.isCoolingDown('MINT', now), true);
  assert.equal(portfolio.sizeFor(token(), now), 0);
  assert.equal(portfolio.open(token(), { sizeUsd: 50, now }), null, 'no immediate re-buy after a stop-out');

  // The cooldown survives a restart, then lapses on its own.
  const reloaded = new Portfolio(dir, risk);
  assert.equal(reloaded.isCoolingDown('MINT', now + HOUR), true);
  assert.equal(reloaded.isCoolingDown('MINT', now + 3 * HOUR), false);
  assert.ok(reloaded.open(token(), { sizeUsd: 50, now: now + 3 * HOUR }));
});

test('summary reports equity, win rate and profit factor', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  portfolio.open(token({ address: 'WIN' }), { sizeUsd: 100 });
  portfolio.close('WIN', { priceUsd: 0.002, liquidityUsd: 200_000, reason: 'take profit' });
  portfolio.open(token({ address: 'LOSS' }), { sizeUsd: 100 });
  portfolio.close('LOSS', { priceUsd: 0.0005, liquidityUsd: 200_000, reason: 'stop loss' });

  const summary = portfolio.summary();
  assert.equal(summary.closedTrades, 2);
  assert.equal(summary.winRate, 0.5);
  assert.ok(summary.profitFactor > 0);
  assert.ok(Math.abs(summary.equityUsd - summary.cashUsd) < 1e-9, 'no open positions');
});

test('portfolio state survives a restart', () => {
  const dir = tempDir();
  const first = new Portfolio(dir, DEFAULTS.risk);
  first.open(token(), { sizeUsd: 25 });

  const second = new Portfolio(dir, DEFAULTS.risk);
  assert.equal(second.has('MINT'), true);
  assert.equal(second.state.cashUsd, DEFAULTS.risk.startingCashUsd - 25);
});

test('reset restores the starting bankroll', () => {
  const portfolio = new Portfolio(tempDir(), DEFAULTS.risk);
  portfolio.open(token(), { sizeUsd: 100 });
  portfolio.reset();
  assert.equal(portfolio.state.cashUsd, DEFAULTS.risk.startingCashUsd);
  assert.equal(portfolio.openPositions.length, 0);
});

test('JsonStore quarantines an unreadable file instead of losing it silently', () => {
  const dir = tempDir();
  const store = new JsonStore(dir, 'thing.json', { a: 1 });
  store.write({ a: 2 });
  fs.writeFileSync(path.join(dir, 'thing.json'), '{ not json');

  assert.throws(() => store.read(), /unreadable/);
  assert.ok(fs.readdirSync(dir).some((file) => file.includes('corrupt')));
});

test('jsonl append and read round-trips, ignoring malformed lines', () => {
  const dir = tempDir();
  appendJsonl(dir, 'signals.jsonl', { symbol: 'A' });
  fs.appendFileSync(path.join(dir, 'signals.jsonl'), 'garbage\n');
  appendJsonl(dir, 'signals.jsonl', { symbol: 'B' });

  assert.deepEqual(readJsonl(dir, 'signals.jsonl').map((r) => r.symbol), ['A', 'B']);
  assert.equal(readJsonl(dir, 'missing.jsonl').length, 0);
});
