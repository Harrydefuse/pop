/**
 * The bot as a long-running, observable object.
 *
 * `watch` and `serve` both drive this: it owns the interval loop, keeps a
 * bounded in-memory view of what just happened, and emits events so a UI can
 * follow along without polling the JSON files. It is also the thing that
 * records the equity curve — one sample per cycle, appended to disk.
 */
import { EventEmitter } from 'node:events';

import { runCycle } from './engine.js';
import { Portfolio } from './portfolio.js';
import { createExecutor } from '../execute/index.js';
import { appendJsonl, readJsonl } from '../store.js';
import { log } from '../log.js';
import { sleep } from '../util.js';

/** How many scored tokens to keep in memory for the decision feed. */
const FEED_LIMIT = 120;
/** How many cycle-activity entries to keep. */
const ACTIVITY_LIMIT = 60;

export class BotRunner extends EventEmitter {
  constructor(config, { anthropic, dryRun = false, portfolio, executor } = {}) {
    super();
    this.config = config;
    this.anthropic = anthropic;
    this.dryRun = dryRun;
    this.portfolio = portfolio ?? new Portfolio(config.dataDirAbsolute, config.risk);
    // Built once, not per cycle: creating it re-checks arming and logs the live
    // banner, and doing that every three minutes would be noise.
    this.executor = executor ?? createExecutor(config, { portfolio: this.portfolio });
    this.controller = new AbortController();

    this.running = false;
    this.cycleCount = 0;
    this.stage = 'idle';
    this.lastCycleAt = null;
    this.nextCycleAt = null;
    this.lastError = null;
    this.feed = [];
    this.activity = [];
  }

  /** Push an activity line and notify listeners. */
  #note(level, message, detail = {}) {
    const entry = { at: new Date().toISOString(), level, message, detail };
    this.activity.unshift(entry);
    this.activity.length = Math.min(this.activity.length, ACTIVITY_LIMIT);
    this.emit('activity', entry);
    return entry;
  }

  #setStage(stage, detail = {}) {
    this.stage = stage;
    this.emit('stage', { stage, detail, at: new Date().toISOString() });
  }

  /** Run exactly one cycle. Safe to call directly (the UI's "scan now" button). */
  async runOnce() {
    if (this.cycleInFlight) return this.cycleInFlight;

    this.cycleInFlight = (async () => {
      this.emit('cycle:start', { at: new Date().toISOString(), cycle: this.cycleCount + 1 });
      try {
        const cycle = await runCycle(this.config, {
          signal: this.controller.signal,
          anthropic: this.anthropic,
          dryRun: this.dryRun,
          portfolio: this.portfolio,
          executor: this.executor,
          onProgress: (stage, detail) => this.#setStage(stage, detail),
        });

        this.cycleCount += 1;
        this.lastCycleAt = new Date().toISOString();
        this.lastError = null;

        for (const trade of cycle.closed) {
          this.emit('position:close', trade);
          this.#note('trade', `closed ${trade.symbol} ${(trade.pnlPct * 100).toFixed(1)}%`, {
            symbol: trade.symbol,
            pnlPct: trade.pnlPct,
            reason: trade.exitReason,
          });
        }
        for (const failure of cycle.failedExits ?? []) {
          this.#note('error', `could not exit ${failure.symbol}: ${failure.reason}`, failure);
        }
        for (const position of cycle.opened) {
          this.emit('position:open', position);
          this.#note('trade', `opened ${position.symbol} at ${position.score.toFixed(2)}`, {
            symbol: position.symbol,
            score: position.score,
          });
        }

        // Newest decisions first, capped so a long-running process stays bounded.
        const decisions = cycle.results.map((result) => this.#toDecision(result));
        this.feed = [...decisions, ...this.feed].slice(0, FEED_LIMIT);
        this.emit('decisions', decisions);

        this.lastExecutionStatus = await this.executor.status();
        const sample = this.#recordEquity();
        this.#note('cycle', `cycle ${this.cycleCount}: ${cycle.analyzed} analysed`, {
          analyzed: cycle.analyzed,
          opened: cycle.opened.length,
          closed: cycle.closed.length,
          durationMs: cycle.durationMs,
        });

        this.#setStage('idle');
        this.emit('cycle:end', { cycle: this.cycleCount, summary: this.summary(), sample });
        return cycle;
      } catch (error) {
        if (this.controller.signal.aborted) throw error;
        this.lastError = error.message;
        this.#setStage('idle');
        this.#note('error', error.message);
        this.emit('cycle:error', { message: error.message });
        log.error('cycle failed:', error.message);
        return null;
      } finally {
        this.cycleInFlight = null;
      }
    })();

    return this.cycleInFlight;
  }

  /** Flatten one analysis result into the shape the UI renders. */
  #toDecision(result) {
    const { token, decision, safety, momentum, narrative } = result;
    return {
      at: new Date().toISOString(),
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      url: token.url,
      priceUsd: token.priceUsd,
      liquidityUsd: token.liquidityUsd,
      marketCap: token.marketCap,
      ageMs: token.ageMs,
      action: decision.action,
      score: decision.score,
      breakdown: decision.breakdown,
      reasons: decision.reasons,
      hardFails: safety.hardFails,
      momentumConfirmed: momentum.confirmed,
      narrative: {
        verdict: narrative.verdict,
        rationale: narrative.rationale,
        redFlags: narrative.redFlags ?? [],
        unavailable: Boolean(narrative.unavailable),
      },
    };
  }

  /** One equity sample per cycle — this is the series the chart draws. */
  #recordEquity() {
    const sample = {
      at: new Date().toISOString(),
      equityUsd: this.portfolio.equity(),
      cashUsd: this.portfolio.state.cashUsd,
      openPositions: this.portfolio.openPositions.length,
    };
    appendJsonl(this.config.dataDirAbsolute, 'equity.jsonl', sample);
    return sample;
  }

  /** The full state a freshly-connected client needs. */
  summary() {
    return {
      running: this.running,
      dryRun: this.dryRun,
      /** 'paper' or 'live' — what the executor actually resolved to. */
      mode: this.executor.mode,
      execution: this.executionStatus,
      stage: this.stage,
      cycleCount: this.cycleCount,
      lastCycleAt: this.lastCycleAt,
      nextCycleAt: this.nextCycleAt,
      lastError: this.lastError,
      chain: this.config.chain,
      intervalSeconds: this.config.watch.intervalSeconds,
      narrativeEnabled: this.config.narrative.enabled,
      narrativeModel: this.config.narrative.enabled ? this.config.narrative.model : null,
      // The UI draws stop/target tracks from these, so they travel with the state.
      risk: this.config.risk,
      portfolio: this.portfolio.summary(),
      positions: this.portfolio.openPositions,
      recentTrades: this.portfolio.state.closed.slice(-12).reverse(),
    };
  }

  /** Refreshed on each cycle so the UI can show guard state without polling. */
  get executionStatus() {
    return this.lastExecutionStatus ?? { mode: this.executor.mode };
  }

  equityHistory({ limit = 500 } = {}) {
    const history = readJsonl(this.config.dataDirAbsolute, 'equity.jsonl', { limit });
    // Anchor the curve at the starting bankroll so the first cycle has a baseline.
    if (history.length > 0) {
      return [
        {
          at: this.portfolio.state.createdAt,
          equityUsd: this.portfolio.state.startingCashUsd,
          cashUsd: this.portfolio.state.startingCashUsd,
          openPositions: 0,
        },
        ...history,
      ];
    }
    return history;
  }

  /** Start the interval loop. Resolves when `stop()` is called. */
  async start() {
    if (this.running) return;
    this.running = true;
    this.#note('info', `runner started (${this.dryRun ? 'dry run' : 'paper trading'})`);
    this.emit('started', this.summary());

    const intervalMs = this.config.watch.intervalSeconds * 1000;
    while (this.running) {
      await this.runOnce();
      if (!this.running) break;
      this.nextCycleAt = new Date(Date.now() + intervalMs).toISOString();
      this.emit('waiting', { nextCycleAt: this.nextCycleAt });
      // Wake early if stop() fires mid-wait.
      const wakeAt = Date.now() + intervalMs;
      while (this.running && Date.now() < wakeAt) {
        await sleep(Math.min(500, wakeAt - Date.now()));
      }
    }

    this.nextCycleAt = null;
    this.emit('stopped', this.summary());
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.controller.abort();
    this.#note('info', 'runner stopped');
  }
}
