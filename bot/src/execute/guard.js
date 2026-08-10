/**
 * The rails on live trading.
 *
 * Every one of these limits is enforced here, outside the strategy, and every
 * live order passes through `check()` before a transaction is built. That
 * separation is the point: a bug in the scoring code, a bad model response, or
 * a hostile token can make the strategy want to do something stupid, and none
 * of them can move these numbers.
 *
 * Spend is tracked on disk, so the daily cap survives a restart — otherwise
 * a crash loop becomes an unlimited spend loop.
 */
import fs from 'node:fs';
import path from 'node:path';

import { JsonStore } from '../store.js';
import { num } from '../util.js';

/** The exact string `execution.armPhrase` must match to enable live trading. */
export const ARM_PHRASE = 'i-understand-this-spends-real-money';

const EMPTY = { version: 1, day: null, spentUsd: 0, tradeCount: 0, lastTradeAt: null, history: [] };

export class GuardError extends Error {
  constructor(reason, detail = {}) {
    super(reason);
    this.name = 'GuardError';
    this.detail = detail;
  }
}

function utcDay(now) {
  return new Date(now).toISOString().slice(0, 10);
}

export class TradeGuard {
  constructor(config, { now = () => Date.now() } = {}) {
    this.config = config;
    this.limits = config.execution;
    this.now = now;
    this.store = new JsonStore(config.dataDirAbsolute, 'guard.json', EMPTY);
    this.state = this.store.read();
    this.#rollDay();
  }

  #rollDay() {
    const today = utcDay(this.now());
    if (this.state.day !== today) {
      this.state = { ...EMPTY, day: today, history: this.state.history?.slice(-200) ?? [] };
      this.store.write(this.state);
    }
  }

  /**
   * Live trading is off unless three independent things all say otherwise:
   * the config flag, the exact arm phrase, and the environment variable.
   * One stray edit or a copied config file cannot arm it by itself.
   */
  armedStatus(env = process.env) {
    const reasons = [];
    if (this.config.mode !== 'live') reasons.push('config mode is not "live"');
    if (this.limits.armPhrase !== ARM_PHRASE) reasons.push('execution.armPhrase is not set to the arm phrase');
    if (env.MEMEBOT_LIVE_ARMED !== 'true') reasons.push('MEMEBOT_LIVE_ARMED is not "true"');
    if (this.killSwitchEngaged()) reasons.push(`kill switch present at ${this.killSwitchPath()}`);
    return { armed: reasons.length === 0, reasons };
  }

  killSwitchPath() {
    const file = this.limits.killSwitchFile ?? 'STOP';
    return path.isAbsolute(file) ? file : path.join(this.config.dataDirAbsolute, file);
  }

  /** Creating this file halts live trading without touching the process. */
  killSwitchEngaged() {
    return fs.existsSync(this.killSwitchPath());
  }

  engageKillSwitch(reason = 'manual') {
    fs.mkdirSync(this.config.dataDirAbsolute, { recursive: true });
    fs.writeFileSync(this.killSwitchPath(), `${new Date(this.now()).toISOString()} ${reason}\n`);
    return this.killSwitchPath();
  }

  releaseKillSwitch() {
    if (this.killSwitchEngaged()) fs.rmSync(this.killSwitchPath());
  }

  get spentTodayUsd() {
    this.#rollDay();
    return num(this.state.spentUsd);
  }

  get remainingTodayUsd() {
    return Math.max(0, num(this.limits.maxDailySpendUsd) - this.spentTodayUsd);
  }

  /**
   * Gate one intended buy. Throws GuardError with a machine-readable reason,
   * so the caller can log it and move on rather than parsing prose.
   *
   * @param {object} order  { sizeUsd, mint, symbol, solBalance, openPositions }
   */
  check(order, env = process.env) {
    this.#rollDay();

    const { armed, reasons } = this.armedStatus(env);
    if (!armed) throw new GuardError('not-armed', { reasons });

    const sizeUsd = num(order.sizeUsd);
    if (!(sizeUsd > 0)) throw new GuardError('invalid-size', { sizeUsd });

    if (sizeUsd > num(this.limits.maxTradeUsd)) {
      throw new GuardError('trade-cap-exceeded', { sizeUsd, cap: this.limits.maxTradeUsd });
    }

    if (this.spentTodayUsd + sizeUsd > num(this.limits.maxDailySpendUsd)) {
      throw new GuardError('daily-cap-exceeded', {
        sizeUsd,
        spentToday: this.spentTodayUsd,
        cap: this.limits.maxDailySpendUsd,
      });
    }

    if (num(this.state.tradeCount) >= num(this.limits.maxTradesPerDay)) {
      throw new GuardError('daily-trade-count-exceeded', {
        tradeCount: this.state.tradeCount,
        cap: this.limits.maxTradesPerDay,
      });
    }

    // Fees are paid in SOL. Spending down to zero strands every open position,
    // because you then cannot afford the transaction that sells it.
    if (num(order.solBalance) < num(this.limits.minSolReserve)) {
      throw new GuardError('sol-reserve-breached', {
        balance: order.solBalance,
        reserve: this.limits.minSolReserve,
      });
    }

    if (num(order.openPositions) >= num(this.config.risk.maxOpenPositions)) {
      throw new GuardError('position-limit-reached', { open: order.openPositions });
    }

    const deny = this.limits.denyMints ?? [];
    if (deny.includes(order.mint)) throw new GuardError('mint-denied', { mint: order.mint });

    const allow = this.limits.allowMints ?? [];
    if (allow.length > 0 && !allow.includes(order.mint)) {
      throw new GuardError('mint-not-allowlisted', { mint: order.mint });
    }

    const cooldownMs = num(this.limits.minSecondsBetweenTrades) * 1000;
    if (this.state.lastTradeAt && this.now() - new Date(this.state.lastTradeAt).getTime() < cooldownMs) {
      throw new GuardError('rate-limited', {
        secondsRemaining: Math.ceil(
          (cooldownMs - (this.now() - new Date(this.state.lastTradeAt).getTime())) / 1000,
        ),
      });
    }

    return { ok: true, sizeUsd };
  }

  /**
   * Record a filled buy. Call this only after a transaction confirms — never
   * on intent, or a failed send would eat the day's budget.
   */
  recordSpend({ sizeUsd, mint, symbol, signature }) {
    this.#rollDay();
    this.state.spentUsd = num(this.state.spentUsd) + num(sizeUsd);
    this.state.tradeCount = num(this.state.tradeCount) + 1;
    this.state.lastTradeAt = new Date(this.now()).toISOString();
    this.state.history = [
      ...(this.state.history ?? []),
      { at: this.state.lastTradeAt, sizeUsd: num(sizeUsd), mint, symbol, signature },
    ].slice(-200);
    this.store.write(this.state);
    return this.state;
  }

  /** Everything the CLI and dashboard need to show the live-trading posture. */
  status(env = process.env) {
    const { armed, reasons } = this.armedStatus(env);
    return {
      mode: this.config.mode,
      armed,
      blockedBy: reasons,
      killSwitch: this.killSwitchEngaged(),
      killSwitchPath: this.killSwitchPath(),
      day: this.state.day,
      spentTodayUsd: this.spentTodayUsd,
      remainingTodayUsd: this.remainingTodayUsd,
      tradesToday: num(this.state.tradeCount),
      limits: {
        maxTradeUsd: this.limits.maxTradeUsd,
        maxDailySpendUsd: this.limits.maxDailySpendUsd,
        maxTradesPerDay: this.limits.maxTradesPerDay,
        maxSlippageBps: this.limits.maxSlippageBps,
        minSolReserve: this.limits.minSolReserve,
      },
    };
  }
}
