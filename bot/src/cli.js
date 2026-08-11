#!/usr/bin/env node
/**
 * memebot — AI-assisted memecoin scanner and trading agent.
 *
 * Paper trading is the default and the fallback. Live execution exists but is
 * off unless every arming condition in `status` is satisfied; see execute/guard.js.
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { loadConfig } from './config.js';
import { color, log, setLevel } from './log.js';
import { ACTIONS } from './analysis/score.js';
import { analyze, enrich, managePositions, runCycle } from './trade/engine.js';
import { BotRunner } from './trade/runner.js';
import { Portfolio } from './trade/portfolio.js';
import { startServer } from './server.js';
import { ARM_PHRASE, TradeGuard } from './execute/guard.js';
import { createExecutor } from './execute/index.js';
import { loadWallet } from './execute/wallet.js';
import { venueFor } from './venues/index.js';
import { fetchCandles, screen } from './ta/screener.js';
import { backtest, rsiVolumeSignal } from './ta/backtest.js';
import { requiredSampleSize } from './ta/stats.js';
import { screenerAlertScript, strategyScript, whaleMomentumScript } from './ta/pine.js';
import { readJsonl } from './store.js';
import { ageString, pct, usd } from './util.js';

const USAGE = `memebot — memecoin trading agent and futures research tools

Usage: node src/cli.js <command> [options]

Commands:
  scan                 Run one discovery + scoring cycle and print the ranked table
  analyze <address>    Deep-dive a single token: every check, signal and score
  watch                Run cycles on an interval, opening and closing paper trades
  serve                Run the loop and expose the local API the dashboard reads
  positions            Show open paper positions and their live P&L
  report               Portfolio summary, closed-trade stats and recent signals
  config               Print the resolved configuration
  reset                Wipe the paper portfolio and start fresh

Futures research (independent of the memecoin bot):
  screen               Scan perpetual futures for RSI + volume-surge conditions
  backtest <SYMBOL>    Backtest those conditions with costs and no lookahead
  pine [which]         Emit Pine Script: strategy | oscillator | screener

Live trading:
  status               Execution mode, arming state, wallet and today's spend
  stop                 Engage the kill switch — halts live trading immediately
  resume               Release the kill switch

Options:
  --dry-run            Analyse and report, but never open a position
  --limit <n>          Rows to display (default 15)
  --interval <v>       watch: seconds between cycles · screen/backtest: timeframe (4h)
  --port <n>           serve: API port (default 7331)
  --host <addr>        serve: bind address (default 127.0.0.1)
  --no-loop            serve: serve stored state without scanning
  --json               Emit machine-readable JSON instead of a table
  --rsi-below <n>      screen/backtest RSI threshold (default 30)
  --vol <x>            screen/backtest volume multiple of average (default 3)
  --contains <text>    screen: only symbols whose ticker contains this
  --bars <n>           backtest: candles of history to pull (default 1000)
  --out <file>         pine: write to a file instead of stdout
  --verbose            Debug logging
  --quiet              Warnings and errors only
  -h, --help           This message

Environment:
  ANTHROPIC_API_KEY    Enables narrative scoring. Without it the bot still runs;
                       narrative scores fall back to neutral.
  SOLANA_RPC_URL       Defaults to the public mainnet endpoint, which is rate
                       limited. Use a paid RPC before running watch for real.
  MEMEBOT_*            Override any config value, e.g.
                       MEMEBOT_SAFETY_MIN_LIQUIDITY_USD=25000

Live trading requires ALL of:
  1. mode: "live" in config.json
  2. execution.armPhrase set to "${ARM_PHRASE}"
  3. MEMEBOT_LIVE_ARMED=true in the environment
  4. a key via SOLANA_PRIVATE_KEY or execution.keypairPath
  5. no kill-switch file present
Anything missing and the bot runs as paper instead. Run \`status\` to see which.
`;

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--') && arg !== '-h') {
      args._.push(arg);
      continue;
    }
    const key = arg.replace(/^--?/, '');
    const takesValue = ['limit', 'interval', 'port', 'host', 'rsi-below', 'vol', 'contains', 'bars', 'out'].includes(key);
    if (takesValue) {
      args.flags[key] = argv[i + 1];
      i += 1;
    } else {
      args.flags[key] = true;
    }
  }
  return args;
}

function actionColor(action) {
  return {
    [ACTIONS.ENTER]: color.green,
    [ACTIONS.WATCH]: color.cyan,
    [ACTIONS.SKIP]: color.dim,
    [ACTIONS.REJECT]: color.red,
  }[action] ?? '';
}

function bar(value, width = 10) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * width);
  return `${'█'.repeat(filled)}${'·'.repeat(width - filled)}`;
}

function padEnd(text, width) {
  // eslint-disable-next-line no-control-regex
  const visible = text.replace(/\[[0-9;]*m/g, '');
  return text + ' '.repeat(Math.max(0, width - visible.length));
}

function renderTable(results, limit) {
  if (results.length === 0) {
    log.print('\nNo tokens matched. Loosen the screen in config.json or wait for the next cycle.\n');
    return;
  }

  const header = [
    padEnd('SYMBOL', 12),
    padEnd('SCORE', 7),
    padEnd('SAFE', 6),
    padEnd('MOM', 6),
    padEnd('NARR', 6),
    padEnd('LIQ', 9),
    padEnd('AGE', 7),
    padEnd('ACTION', 8),
    'WHY',
  ].join(' ');
  log.print(`\n${color.bold}${header}${color.reset}`);
  log.print(color.dim + '─'.repeat(110) + color.reset);

  for (const result of results.slice(0, limit)) {
    const { token, decision } = result;
    const tint = actionColor(decision.action);
    log.print(
      [
        padEnd(`${tint}${(token.symbol || '?').slice(0, 11)}${color.reset}`, 12),
        padEnd(decision.score.toFixed(2), 7),
        padEnd(decision.breakdown.safety.toFixed(2), 6),
        padEnd(decision.breakdown.momentum.toFixed(2), 6),
        padEnd(decision.breakdown.narrative.toFixed(2), 6),
        padEnd(usd(token.liquidityUsd), 9),
        padEnd(ageString(token.ageMs), 7),
        padEnd(`${tint}${decision.action}${color.reset}`, 8),
        `${color.dim}${decision.reasons[0] ?? ''}${color.reset}`,
      ].join(' '),
    );
  }
  log.print('');
}

async function cmdScan(config, args) {
  const limit = Number(args.flags.limit ?? 15);
  log.info(`scanning ${config.chain}…`);
  const cycle = await runCycle(config, { dryRun: true });

  if (args.flags.json) {
    log.print(
      JSON.stringify(
        cycle.results.map((r) => ({
          address: r.token.address,
          symbol: r.token.symbol,
          name: r.token.name,
          url: r.token.url,
          priceUsd: r.token.priceUsd,
          liquidityUsd: r.token.liquidityUsd,
          decision: r.decision,
          narrative: r.narrative,
        })),
        null,
        2,
      ),
    );
    return;
  }

  const shown = cycle.results.filter((r) => r.decision.action !== ACTIONS.REJECT);
  renderTable(shown, limit);
  const rejected = cycle.results.length - shown.length;
  log.print(
    `${color.dim}${cycle.analyzed} analysed · ${rejected} rejected by the safety screen · ${(cycle.durationMs / 1000).toFixed(1)}s${color.reset}\n`,
  );
}

async function cmdAnalyze(config, args) {
  const address = args._[1];
  if (!address) throw new Error('usage: analyze <token-address>');

  // The venue allowlist governs what the bot *scans*; an explicit analyze is a
  // direct question about one token, so answer it whatever venue it trades on.
  const tokens = await enrich([address], config, { ignoreVenueFilter: true });
  if (tokens.length === 0) throw new Error(`no ${config.chain} pair found for ${address}`);
  const [result] = await analyze(tokens, config);
  const { token, safety, momentum, narrative, decision } = result;

  if (args.flags.json) {
    log.print(JSON.stringify({ token, safety, momentum, narrative, decision }, null, 2));
    return;
  }

  log.print(`\n${color.bold}${token.name} (${token.symbol})${color.reset}  ${color.dim}${token.address}${color.reset}`);
  log.print(
    `${venueFor(token.dexId).label} · ${usd(token.priceUsd)} · liquidity ${usd(token.liquidityUsd)} · mcap ${usd(token.marketCap)} · ${ageString(token.ageMs)} old`,
  );
  if (token.url) log.print(color.dim + token.url + color.reset);

  log.print(`\n${color.bold}Safety${color.reset}  ${bar(safety.score)} ${safety.score.toFixed(2)}`);
  for (const check of safety.checks) {
    const mark = check.pass ? `${color.green}✓${color.reset}` : `${check.fatal ? color.red : color.yellow}✗${color.reset}`;
    log.print(`  ${mark} ${padEnd(check.label, 46)} ${color.dim}${check.detail}${color.reset}`);
  }

  log.print(`\n${color.bold}Momentum${color.reset}  ${bar(momentum.score)} ${momentum.score.toFixed(2)}${momentum.confirmed ? `  ${color.green}confirmed${color.reset}` : `  ${color.yellow}unconfirmed${color.reset}`}`);
  for (const signal of momentum.signals) {
    log.print(`  ${bar(signal.score, 6)} ${padEnd(signal.label, 40)} ${color.dim}${signal.detail}${color.reset}`);
  }

  log.print(`\n${color.bold}Narrative${color.reset}  ${bar(narrative.score)} ${narrative.score.toFixed(2)}  ${color.dim}${narrative.verdict ?? ''}${color.reset}`);
  log.print(`  ${narrative.rationale}`);
  for (const flag of narrative.redFlags ?? []) log.print(`  ${color.red}⚑${color.reset} ${flag}`);

  const tint = actionColor(decision.action);
  log.print(`\n${color.bold}Verdict${color.reset}  ${tint}${decision.action.toUpperCase()}${color.reset} at ${decision.score.toFixed(2)}`);
  for (const reason of decision.reasons) log.print(`  ${color.dim}· ${reason}${color.reset}`);
  log.print('');
}

/** Wire ctrl-c to a graceful runner shutdown; a second press exits hard. */
function attachSignalHandlers(runner) {
  let stopping = false;
  const handler = () => {
    if (stopping) process.exit(1);
    stopping = true;
    log.info('stopping after this cycle…');
    runner.stop();
  };
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
}

function buildRunner(config, args) {
  const overrides = args.flags.interval
    ? { ...config, watch: { ...config.watch, intervalSeconds: Number(args.flags.interval) } }
    : config;
  return new BotRunner(overrides, { dryRun: Boolean(args.flags['dry-run']) });
}

async function cmdWatch(config, args) {
  const runner = buildRunner(config, args);
  const { portfolio } = runner;

  log.info(
    `watching ${config.chain} every ${runner.config.watch.intervalSeconds}s · ${runner.dryRun ? 'dry run' : 'paper trading'} · equity ${usd(portfolio.equity())}`,
  );
  log.info('press ctrl-c to stop');

  runner.on('cycle:end', ({ cycle, summary }) => {
    log.info(
      `cycle ${cycle}: ${summary.positions.length} open · equity ${usd(summary.portfolio.equityUsd)} (${pct(summary.portfolio.totalPnlPct)})`,
    );
  });

  attachSignalHandlers(runner);
  await runner.start();
  log.info(`stopped. equity ${usd(portfolio.equity())} (${pct(portfolio.summary().totalPnlPct)})`);
}

async function cmdServe(config, args) {
  const runner = buildRunner(config, args);
  const port = Number(args.flags.port ?? config.server.port);
  const host = args.flags.host ?? config.server.host;

  const server = await startServer(runner, { port, host });
  log.info(`dashboard: run \`npm run dev\` in the repo root, then open /dashboard.html`);

  attachSignalHandlers(runner);
  // `--no-loop` serves the existing state without scanning, for reading history.
  if (args.flags['no-loop']) {
    log.info('serving stored state only (--no-loop); POST /api/scan to run a cycle');
    await new Promise((resolve) => process.once('SIGINT', resolve));
  } else {
    await runner.start();
  }
  server.close();
}

async function cmdPositions(config, args) {
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  if (portfolio.openPositions.length === 0) {
    log.print('\nNo open positions.\n');
    return;
  }

  await managePositions(portfolio, config).catch((error) =>
    log.warn('could not refresh prices:', error.message),
  );

  if (args.flags.json) {
    log.print(JSON.stringify(portfolio.openPositions, null, 2));
    return;
  }

  log.print(
    `\n${color.bold}${[padEnd('SYMBOL', 12), padEnd('SIZE', 9), padEnd('ENTRY', 12), padEnd('NOW', 12), padEnd('P&L', 10), padEnd('PEAK', 8), 'HELD'].join(' ')}${color.reset}`,
  );
  log.print(color.dim + '─'.repeat(80) + color.reset);

  for (const position of portfolio.openPositions) {
    const change = (position.lastPriceUsd - position.entryPriceUsd) / position.entryPriceUsd;
    const tint = change >= 0 ? color.green : color.red;
    const fromPeak = (position.lastPriceUsd - position.peakPriceUsd) / position.peakPriceUsd;
    log.print(
      [
        padEnd(position.symbol.slice(0, 11), 12),
        padEnd(usd(position.costUsd), 9),
        padEnd(`$${position.entryPriceUsd.toPrecision(4)}`, 12),
        padEnd(`$${position.lastPriceUsd.toPrecision(4)}`, 12),
        padEnd(`${tint}${(change * 100).toFixed(1)}%${color.reset}`, 10),
        padEnd(`${(fromPeak * 100).toFixed(0)}%`, 8),
        ageString(Date.now() - position.openedAtMs),
      ].join(' '),
    );
  }

  const summary = portfolio.summary();
  log.print(
    `\n${color.dim}cash ${usd(summary.cashUsd)} · equity ${usd(summary.equityUsd)} · total ${pct(summary.totalPnlPct)}${color.reset}\n`,
  );
}

async function cmdReport(config, args) {
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  const summary = portfolio.summary();

  if (args.flags.json) {
    log.print(JSON.stringify({ summary, closed: portfolio.state.closed }, null, 2));
    return;
  }

  const tint = summary.totalPnlUsd >= 0 ? color.green : color.red;
  log.print(`\n${color.bold}Paper portfolio${color.reset}  ${color.dim}since ${portfolio.state.createdAt?.slice(0, 10)}${color.reset}`);
  log.print(`  Equity        ${usd(summary.equityUsd)}  ${tint}${pct(summary.totalPnlPct)}${color.reset}`);
  log.print(`  Cash          ${usd(summary.cashUsd)} of ${usd(summary.startingCashUsd)} starting`);
  log.print(`  Open / closed ${summary.openPositions} / ${summary.closedTrades}`);
  log.print(`  Win rate      ${pct(summary.winRate)}`);
  log.print(`  Avg trade     ${pct(summary.avgPnlPct)}   best ${pct(summary.bestPnlPct)}   worst ${pct(summary.worstPnlPct)}`);
  log.print(
    `  Profit factor ${summary.profitFactor === null ? (summary.closedTrades ? '∞ (no losses yet)' : '—') : summary.profitFactor.toFixed(2)}`,
  );
  log.print(`  Sim. fees     ${usd(summary.feesPaidUsd)}`);

  const recent = portfolio.state.closed.slice(-10).reverse();
  if (recent.length) {
    log.print(`\n${color.bold}Last ${recent.length} closed${color.reset}`);
    for (const trade of recent) {
      const pnlTint = trade.pnlUsd >= 0 ? color.green : color.red;
      log.print(
        `  ${padEnd(trade.symbol.slice(0, 11), 12)} ${padEnd(`${pnlTint}${(trade.pnlPct * 100).toFixed(1)}%${color.reset}`, 10)} ${padEnd(ageString(trade.holdMs), 7)} ${color.dim}${trade.exitReason}${color.reset}`,
      );
    }
  }

  const signals = readJsonl(config.dataDirAbsolute, 'signals.jsonl', { limit: 200 });
  const entries = signals.filter((s) => s.action === 'enter');
  if (signals.length) {
    log.print(
      `\n${color.dim}${signals.length} recent signals logged · ${entries.length} entry-grade · data/signals.jsonl${color.reset}`,
    );
  }
  log.print('');
}

/** Shared screen/backtest criteria, so the two always agree. */
function criteriaFrom(args) {
  return {
    interval: args.flags.interval ?? '4h',
    rsiPeriod: 14,
    rsiBelow: Number(args.flags['rsi-below'] ?? 30),
    volumePeriod: 20,
    minVolumeRatio: Number(args.flags.vol ?? 3),
  };
}

async function cmdScreen(config, args) {
  const criteria = criteriaFrom(args);
  log.info(`screening perpetual futures on ${criteria.interval}…`);

  const result = await screen({
    ...criteria,
    contains: args.flags.contains ?? '',
    limit: 200,
  });

  if (args.flags.json) {
    log.print(JSON.stringify(result, null, 2));
    return;
  }

  log.print(
    `\n${color.bold}RSI < ${criteria.rsiBelow} and volume ≥ ${criteria.minVolumeRatio}x average${color.reset} ${color.dim}· ${criteria.interval} · ${result.scanned} symbols scanned${color.reset}`,
  );

  if (result.matches.length === 0) {
    log.print(
      `\nNothing matched. That is the normal result — both conditions at once is rare.\n${color.dim}Closest misses:${color.reset}`,
    );
    for (const near of result.nearMisses.slice(0, 5)) {
      log.print(
        `  ${padEnd(near.symbol, 14)} RSI ${padEnd(near.rsi?.toFixed(1) ?? '—', 6)} vol ${near.volumeRatio?.toFixed(2) ?? '—'}x`,
      );
    }
    log.print('');
    return;
  }

  log.print(
    `\n${color.bold}${[padEnd('SYMBOL', 14), padEnd('RSI', 7), padEnd('VOL', 8), padEnd('VOL σ', 8), padEnd('PRICE', 12), 'BAR CHANGE'].join(' ')}${color.reset}`,
  );
  log.print(color.dim + '─'.repeat(70) + color.reset);
  for (const match of result.matches) {
    log.print(
      [
        padEnd(`${color.green}${match.symbol}${color.reset}`, 14),
        padEnd(match.rsi.toFixed(1), 7),
        padEnd(`${match.volumeRatio.toFixed(2)}x`, 8),
        padEnd(match.volumeZ?.toFixed(1) ?? '—', 8),
        padEnd(String(match.price), 12),
        `${(match.priceChangePct * 100).toFixed(2)}%`,
      ].join(' '),
    );
  }

  if (result.failed.length) {
    log.print(`\n${color.dim}${result.failed.length} symbols could not be read${color.reset}`);
  }
  log.print(
    `\n${color.dim}A match is a condition being true, not a trade. Backtest it before acting:${color.reset}\n  node src/cli.js backtest ${result.matches[0].symbol}\n`,
  );
}

async function cmdBacktest(config, args) {
  const symbol = (args._[1] ?? '').toUpperCase();
  if (!symbol) throw new Error('usage: backtest <SYMBOL>   e.g. backtest BTCUSDT');

  const criteria = criteriaFrom(args);
  const bars = Number(args.flags.bars ?? 1000);
  log.info(`fetching ${bars} ${criteria.interval} candles for ${symbol}…`);

  const candles = await fetchCandles(symbol, { interval: criteria.interval, limit: bars });
  const signals = rsiVolumeSignal(candles, criteria);
  const result = backtest(candles, signals, { symbol });

  if (args.flags.json) {
    log.print(JSON.stringify(result, null, 2));
    return;
  }

  const { stats, bootstrap, assumptions } = result;
  log.print(`\n${color.bold}${symbol}${color.reset} ${color.dim}· ${candles.length} bars of ${criteria.interval} · RSI < ${criteria.rsiBelow}, volume ≥ ${criteria.minVolumeRatio}x${color.reset}`);

  if (stats.trades === 0) {
    log.print('\nNo trades. The conditions never co-occurred in this window.\n');
    return;
  }

  const tint = stats.totalPnlUsd >= 0 ? color.green : color.red;
  log.print(`\n${color.bold}Result${color.reset}`);
  log.print(`  Trades          ${stats.trades}`);
  log.print(`  Net P&L         ${tint}${usd(stats.totalPnlUsd)}${color.reset} on ${usd(10_000)} starting`);
  log.print(`  Expectancy      ${usd(stats.expectancyUsd)} per trade`);
  log.print(`  Profit factor   ${stats.profitFactor === null ? '∞ (no losses)' : stats.profitFactor.toFixed(2)}`);
  log.print(`  Max drawdown    ${pct(stats.maxDrawdownPct ?? 0)}`);

  log.print(`\n${color.bold}Win rate${color.reset}`);
  log.print(`  Point estimate  ${pct(stats.winRate)}  (${stats.wins}/${stats.trades})`);
  log.print(`  95% interval    ${pct(stats.winRateLow)} – ${pct(stats.winRateHigh)}`);
  if (stats.breakEvenWinRate !== null) {
    log.print(`  Break-even      ${pct(stats.breakEvenWinRate)} ${color.dim}(given this payoff ratio)${color.reset}`);
  }

  if (bootstrap) {
    log.print(`\n${color.bold}If the same trades came in a different order${color.reset} ${color.dim}(${bootstrap.iterations} resamples)${color.reset}`);
    log.print(`  5th percentile  ${usd(bootstrap.p05)}`);
    log.print(`  Median          ${usd(bootstrap.median)}`);
    log.print(`  95th percentile ${usd(bootstrap.p95)}`);
    log.print(`  Chance of loss  ${pct(bootstrap.probabilityOfLoss)}`);
  }

  const verdictColor = stats.reliable ? color.green : color.yellow;
  log.print(`\n${verdictColor}${stats.reliable ? 'Holds up' : 'Not established'}${color.reset}  ${stats.verdict}`);
  if (!stats.reliable && stats.edgeOverBreakEven > 0) {
    log.print(
      `${color.dim}  At this edge you would need roughly ${requiredSampleSize(stats.edgeOverBreakEven)} trades to be confident.${color.reset}`,
    );
  }

  log.print(
    `\n${color.dim}Assumptions: fill at ${assumptions.fill}; ${(assumptions.feePct * 100).toFixed(3)}% fee and ${(assumptions.slippagePct * 100).toFixed(3)}% slippage each way; bars touching both stop and target ${assumptions.ambiguousBars}.${color.reset}\n`,
  );
}

function cmdPine(config, args) {
  const criteria = criteriaFrom(args);
  const which = (args._[1] ?? 'strategy').toLowerCase();

  const scripts = {
    strategy: () => strategyScript(criteria),
    oscillator: () => whaleMomentumScript({ momentumPeriod: criteria.rsiPeriod, volumePeriod: criteria.volumePeriod }),
    screener: () => screenerAlertScript(criteria),
  };

  const build = scripts[which];
  if (!build) throw new Error(`unknown script "${which}" — choose: ${Object.keys(scripts).join(', ')}`);

  const source = build();
  if (args.flags.out) {
    fs.writeFileSync(args.flags.out, source);
    log.print(`Wrote ${which} script to ${args.flags.out}`);
    return;
  }
  log.print(source);
}

async function cmdStatus(config, args) {
  const guard = new TradeGuard(config);
  const status = guard.status();

  let wallet = null;
  let walletError = null;
  try {
    wallet = loadWallet(config);
  } catch (error) {
    walletError = error.message;
  }

  // Resolving the executor is the honest answer to "what will actually happen":
  // it applies every fallback the real cycle would apply.
  const executor = createExecutor(config, { portfolio: new Portfolio(config.dataDirAbsolute, config.risk) });

  if (args.flags.json) {
    log.print(JSON.stringify({ ...status, effectiveMode: executor.mode, wallet: wallet?.address ?? null, walletError }, null, 2));
    return;
  }

  const tint = executor.mode === 'live' ? color.red : color.green;
  log.print(`\n${color.bold}Execution${color.reset}`);
  log.print(`  Configured mode  ${status.mode}`);
  log.print(`  Effective mode   ${tint}${executor.mode.toUpperCase()}${color.reset}`);
  log.print(`  Wallet           ${wallet ? wallet.address : color.dim + (walletError ?? 'none configured') + color.reset}`);
  log.print(`  Kill switch      ${status.killSwitch ? `${color.red}ENGAGED${color.reset}` : 'clear'} ${color.dim}(${status.killSwitchPath})${color.reset}`);

  if (status.blockedBy.length) {
    log.print(`\n${color.bold}Not armed because${color.reset}`);
    for (const reason of status.blockedBy) log.print(`  ${color.yellow}·${color.reset} ${reason}`);
  }

  log.print(`\n${color.bold}Today (UTC ${status.day})${color.reset}`);
  log.print(`  Spent            ${usd(status.spentTodayUsd)} of ${usd(status.limits.maxDailySpendUsd)}`);
  log.print(`  Remaining        ${usd(status.remainingTodayUsd)}`);
  log.print(`  Trades           ${status.tradesToday} of ${status.limits.maxTradesPerDay}`);

  log.print(`\n${color.bold}Per-trade limits${color.reset}`);
  log.print(`  Max size         ${usd(status.limits.maxTradeUsd)}`);
  log.print(`  Max slippage     ${(status.limits.maxSlippageBps / 100).toFixed(2)}%`);
  log.print(`  SOL reserve      ${status.limits.minSolReserve} SOL`);

  const venues = config.discovery.venues;
  log.print(`\n${color.bold}Venues${color.reset}`);
  log.print(
    `  ${venues.length === 0 || venues.includes('*') ? 'all' : venues.map((v) => venueFor(v).label).join(', ')}`,
  );
  log.print('');
}

function cmdStop(config) {
  const guard = new TradeGuard(config);
  const file = guard.engageKillSwitch('cli');
  log.print(`Kill switch engaged. Live trading halted.\n  ${file}\n\nOpen positions are NOT closed — exit them yourself if you need to.`);
}

function cmdResume(config) {
  const guard = new TradeGuard(config);
  if (!guard.killSwitchEngaged()) {
    log.print('Kill switch was not engaged.');
    return;
  }
  guard.releaseKillSwitch();
  const { armed, reasons } = guard.armedStatus();
  log.print(`Kill switch released. ${armed ? 'Live trading is ARMED.' : `Still not armed: ${reasons.join('; ')}`}`);
}

function cmdConfig(config) {
  const { dataDirAbsolute, ...rest } = config;
  log.print(JSON.stringify({ ...rest, dataDir: dataDirAbsolute }, null, 2));
}

function cmdReset(config) {
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);
  portfolio.reset();
  log.print(`Portfolio reset to ${usd(config.risk.startingCashUsd)}.`);
}

const COMMANDS = {
  scan: cmdScan,
  analyze: cmdAnalyze,
  watch: cmdWatch,
  serve: cmdServe,
  positions: cmdPositions,
  report: cmdReport,
  config: (config) => cmdConfig(config),
  reset: (config) => cmdReset(config),
  screen: cmdScreen,
  backtest: cmdBacktest,
  pine: cmdPine,
  status: cmdStatus,
  stop: cmdStop,
  resume: cmdResume,
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || args.flags.help || args.flags.h) {
    log.print(USAGE);
    return;
  }
  const handler = COMMANDS[command];
  if (!handler) {
    log.error(`unknown command: ${command}`);
    log.print(USAGE);
    process.exitCode = 1;
    return;
  }

  if (args.flags.verbose) setLevel('debug');
  if (args.flags.quiet) setLevel('warn');

  const config = loadConfig();
  if (config.narrative.disabledReason && ['scan', 'watch', 'analyze'].includes(command)) {
    log.warn(`narrative scoring disabled: ${config.narrative.disabledReason} — scores fall back to neutral`);
  }

  await handler(config, args);
}

// Only drive the CLI when this file is the entry point, so tests and scripts
// can import the command handlers without triggering a run.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((error) => {
    log.error(error.message);
    if (process.env.MEMEBOT_LOG_LEVEL === 'debug') console.error(error);
    process.exitCode = 1;
  });
}

export { COMMANDS, main, parseArgs, renderTable };
