#!/usr/bin/env node
/**
 * memebot — AI-assisted memecoin scanner and paper-trading agent.
 *
 * Paper trading only. Nothing here signs a transaction or touches a wallet.
 */
import { pathToFileURL } from 'node:url';

import { loadConfig } from './config.js';
import { color, log, setLevel } from './log.js';
import { ACTIONS } from './analysis/score.js';
import { analyze, enrich, managePositions, runCycle } from './trade/engine.js';
import { Portfolio } from './trade/portfolio.js';
import { readJsonl } from './store.js';
import { ageString, pct, sleep, usd } from './util.js';

const USAGE = `memebot — memecoin scanner and paper-trading agent

Usage: node src/cli.js <command> [options]

Commands:
  scan                 Run one discovery + scoring cycle and print the ranked table
  analyze <address>    Deep-dive a single token: every check, signal and score
  watch                Run cycles on an interval, opening and closing paper trades
  positions            Show open paper positions and their live P&L
  report               Portfolio summary, closed-trade stats and recent signals
  config               Print the resolved configuration
  reset                Wipe the paper portfolio and start fresh

Options:
  --dry-run            Analyse and report, but never open a position
  --limit <n>          Rows to display (default 15)
  --interval <sec>     Override the watch interval
  --json               Emit machine-readable JSON instead of a table
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
    const takesValue = ['limit', 'interval'].includes(key);
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

  const tokens = await enrich([address], config);
  if (tokens.length === 0) throw new Error(`no ${config.chain} pair found for ${address}`);
  const [result] = await analyze(tokens, config);
  const { token, safety, momentum, narrative, decision } = result;

  if (args.flags.json) {
    log.print(JSON.stringify({ token, safety, momentum, narrative, decision }, null, 2));
    return;
  }

  log.print(`\n${color.bold}${token.name} (${token.symbol})${color.reset}  ${color.dim}${token.address}${color.reset}`);
  log.print(
    `${token.dexId} · ${usd(token.priceUsd)} · liquidity ${usd(token.liquidityUsd)} · mcap ${usd(token.marketCap)} · ${ageString(token.ageMs)} old`,
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

async function cmdWatch(config, args) {
  const intervalMs = Number(args.flags.interval ?? config.watch.intervalSeconds) * 1000;
  const dryRun = Boolean(args.flags['dry-run']);
  const portfolio = new Portfolio(config.dataDirAbsolute, config.risk);

  log.info(
    `watching ${config.chain} every ${intervalMs / 1000}s · ${dryRun ? 'dry run' : 'paper trading'} · equity ${usd(portfolio.equity())}`,
  );
  log.info('press ctrl-c to stop');

  const controller = new AbortController();
  let stopping = false;
  process.on('SIGINT', () => {
    if (stopping) process.exit(1);
    stopping = true;
    controller.abort();
    log.info('stopping after this cycle…');
  });

  while (!stopping) {
    try {
      const cycle = await runCycle(config, { signal: controller.signal, dryRun, portfolio });
      const enterable = cycle.results.filter((r) => r.decision.action === ACTIONS.ENTER).length;
      log.info(
        `cycle: ${cycle.analyzed} analysed · ${enterable} entries · ${cycle.opened.length} opened · ${cycle.closed.length} closed · equity ${usd(portfolio.equity())}`,
      );
    } catch (error) {
      if (controller.signal.aborted) break;
      log.error('cycle failed:', error.message);
    }
    if (stopping) break;
    await sleep(intervalMs);
  }

  log.info(`stopped. equity ${usd(portfolio.equity())} (${pct(portfolio.summary().totalPnlPct)})`);
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
  log.print(`  Profit factor ${Number.isFinite(summary.profitFactor) ? summary.profitFactor.toFixed(2) : '∞'}`);
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
  positions: cmdPositions,
  report: cmdReport,
  config: (config) => cmdConfig(config),
  reset: (config) => cmdReset(config),
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
