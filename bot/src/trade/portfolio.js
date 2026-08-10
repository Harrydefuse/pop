/**
 * Paper-trading portfolio.
 *
 * Simulated fills apply a round-trip cost (`risk.feePct`) covering LP fee,
 * priority fee and slippage, plus an extra slippage term when the position is
 * large relative to the pool. Memecoin fills are worse than the quoted price;
 * a backtest that ignores that will flatter every strategy.
 *
 * No private keys are handled anywhere in this file, or anywhere in this repo.
 */
import { HOUR, clamp, num } from '../util.js';
import { JsonStore } from '../store.js';

const EMPTY = {
  version: 1,
  createdAt: null,
  cashUsd: 0,
  startingCashUsd: 0,
  positions: {},
  /** address -> epoch ms until which re-entry is blocked. */
  cooldowns: {},
  closed: [],
  stats: { trades: 0, wins: 0, losses: 0, feesPaidUsd: 0 },
};

/**
 * Price impact of trading `sizeUsd` against a pool of `liquidityUsd`, using the
 * constant-product result for a one-sided trade. Roughly `size/(size+depth)`,
 * where depth is the half of the pool on the other side of the trade.
 */
export function slippageFor(sizeUsd, liquidityUsd) {
  const depth = num(liquidityUsd) / 2;
  if (!(depth > 0)) return 1;
  return clamp(sizeUsd / (sizeUsd + depth), 0, 0.95);
}

export class Portfolio {
  constructor(dataDir, risk) {
    this.store = new JsonStore(dataDir, 'portfolio.json', EMPTY);
    this.risk = risk;
    this.state = this.store.read();
    // Portfolios written by older versions may predate a field.
    this.state.cooldowns ??= {};
    if (this.state.createdAt === null) {
      this.state.createdAt = new Date().toISOString();
      this.state.cashUsd = risk.startingCashUsd;
      this.state.startingCashUsd = risk.startingCashUsd;
      this.store.write(this.state);
    }
  }

  save() {
    return this.store.write(this.state);
  }

  reset(startingCashUsd = this.risk.startingCashUsd) {
    this.state = {
      ...structuredClone(EMPTY),
      createdAt: new Date().toISOString(),
      cashUsd: startingCashUsd,
      startingCashUsd,
    };
    return this.save();
  }

  get openPositions() {
    return Object.values(this.state.positions);
  }

  has(address) {
    return Boolean(this.state.positions[address]);
  }

  /** True while a recently-closed token is still inside its re-entry cooldown. */
  isCoolingDown(address, now = Date.now()) {
    const until = this.state.cooldowns[address];
    if (!until) return false;
    if (until <= now) {
      delete this.state.cooldowns[address];
      return false;
    }
    return true;
  }

  /**
   * Position size, capped three ways: the configured share of bankroll, the
   * cash actually on hand, and a hard ceiling on pool share so the exit stays
   * possible. Returns 0 when no size is safe.
   */
  sizeFor(token, now = Date.now()) {
    if (this.isCoolingDown(token.address, now)) return 0;
    if (this.openPositions.length >= this.risk.maxOpenPositions) return 0;
    const target = this.state.startingCashUsd * this.risk.positionSizePct;
    const poolCap = num(token.liquidityUsd) * this.risk.maxPoolSharePct;
    const size = Math.min(target, poolCap, this.state.cashUsd);
    return size >= 1 ? size : 0;
  }

  /** Open a simulated long. Returns the position, or null if it can't be sized. */
  open(token, { sizeUsd, score, reason, now = Date.now() } = {}) {
    if (this.has(token.address) || this.isCoolingDown(token.address, now)) return null;
    const size = sizeUsd ?? this.sizeFor(token, now);
    if (!(size > 0) || !(token.priceUsd > 0)) return null;

    const slip = slippageFor(size, token.liquidityUsd);
    const fillPrice = token.priceUsd * (1 + slip + this.risk.feePct / 2);
    const quantity = size / fillPrice;

    const position = {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      chainId: token.chainId,
      pairUrl: token.url,
      openedAt: new Date(now).toISOString(),
      openedAtMs: now,
      entryPriceUsd: fillPrice,
      quotedPriceUsd: token.priceUsd,
      entrySlippage: slip,
      quantity,
      costUsd: size,
      // Mark against the quoted price, not our own fill. Marking at the fill
      // would hide the entry cost until the position closes, so a fresh
      // portfolio would report break-even when it is already down the spread.
      peakPriceUsd: token.priceUsd,
      lastPriceUsd: token.priceUsd,
      score,
      reason,
    };

    this.state.positions[token.address] = position;
    this.state.cashUsd -= size;
    this.state.stats.feesPaidUsd += size * (this.risk.feePct / 2);
    this.save();
    return position;
  }

  /** Close a simulated long at `priceUsd`. Returns the closed-trade record. */
  close(address, { priceUsd, liquidityUsd, reason, now = Date.now() } = {}) {
    const position = this.state.positions[address];
    if (!position) return null;

    const gross = position.quantity * num(priceUsd, position.lastPriceUsd);
    const slip = slippageFor(gross, liquidityUsd ?? 0);
    const proceeds = gross * (1 - slip - this.risk.feePct / 2);
    const pnlUsd = proceeds - position.costUsd;

    const record = {
      ...position,
      closedAt: new Date(now).toISOString(),
      closedAtMs: now,
      exitPriceUsd: num(priceUsd, position.lastPriceUsd),
      exitSlippage: slip,
      proceedsUsd: proceeds,
      pnlUsd,
      pnlPct: position.costUsd > 0 ? pnlUsd / position.costUsd : 0,
      holdMs: now - position.openedAtMs,
      exitReason: reason,
    };

    delete this.state.positions[address];
    this.state.cooldowns[address] = now + this.risk.reentryCooldownHours * HOUR;
    this.state.cashUsd += proceeds;
    this.state.closed.push(record);
    this.state.stats.trades += 1;
    this.state.stats[pnlUsd >= 0 ? 'wins' : 'losses'] += 1;
    this.state.stats.feesPaidUsd += gross * (this.risk.feePct / 2);
    this.save();
    return record;
  }

  /** Record the latest mark for an open position and track its peak. */
  mark(address, priceUsd) {
    const position = this.state.positions[address];
    if (!position || !(priceUsd > 0)) return null;
    position.lastPriceUsd = priceUsd;
    position.peakPriceUsd = Math.max(position.peakPriceUsd, priceUsd);
    return position;
  }

  /**
   * Which exit rule, if any, fires for this position right now.
   * Checked worst-case first: a stop that triggered matters more than a target.
   */
  exitSignal(position, priceUsd, now = Date.now()) {
    const price = num(priceUsd, position.lastPriceUsd);
    const change = (price - position.entryPriceUsd) / position.entryPriceUsd;
    const fromPeak = (price - position.peakPriceUsd) / position.peakPriceUsd;
    const peakGain = (position.peakPriceUsd - position.entryPriceUsd) / position.entryPriceUsd;

    if (change <= -this.risk.stopLossPct) {
      return { exit: true, reason: `stop loss (${(change * 100).toFixed(1)}%)` };
    }
    if (peakGain >= this.risk.trailActivatePct && fromPeak <= -this.risk.trailingStopPct) {
      return { exit: true, reason: `trailing stop (${(fromPeak * 100).toFixed(1)}% off peak)` };
    }
    if (change >= this.risk.takeProfitPct) {
      return { exit: true, reason: `take profit (${(change * 100).toFixed(1)}%)` };
    }
    if (now - position.openedAtMs >= this.risk.maxHoldHours * HOUR) {
      return { exit: true, reason: `max hold ${this.risk.maxHoldHours}h reached` };
    }
    return { exit: false, change, fromPeak };
  }

  /** Cash plus the marked value of every open position. */
  equity() {
    const open = this.openPositions.reduce(
      (sum, position) => sum + position.quantity * position.lastPriceUsd,
      0,
    );
    return this.state.cashUsd + open;
  }

  summary() {
    const equity = this.equity();
    const closed = this.state.closed;
    const wins = closed.filter((trade) => trade.pnlUsd >= 0);
    const grossWin = wins.reduce((sum, t) => sum + t.pnlUsd, 0);
    const grossLoss = closed.filter((t) => t.pnlUsd < 0).reduce((sum, t) => sum + Math.abs(t.pnlUsd), 0);

    return {
      startingCashUsd: this.state.startingCashUsd,
      cashUsd: this.state.cashUsd,
      equityUsd: equity,
      totalPnlUsd: equity - this.state.startingCashUsd,
      totalPnlPct:
        this.state.startingCashUsd > 0
          ? (equity - this.state.startingCashUsd) / this.state.startingCashUsd
          : 0,
      openPositions: this.openPositions.length,
      closedTrades: closed.length,
      winRate: closed.length ? wins.length / closed.length : 0,
      avgPnlPct: closed.length ? closed.reduce((sum, t) => sum + t.pnlPct, 0) / closed.length : 0,
      bestPnlPct: closed.length ? Math.max(...closed.map((t) => t.pnlPct)) : 0,
      worstPnlPct: closed.length ? Math.min(...closed.map((t) => t.pnlPct)) : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
      feesPaidUsd: this.state.stats.feesPaidUsd,
    };
  }
}
