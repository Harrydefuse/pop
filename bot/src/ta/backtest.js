/**
 * Event-driven backtester.
 *
 * Three rules this engine will not bend, because breaking any of them is how a
 * backtest comes to show a profit that does not exist:
 *
 *  1. **No lookahead.** A signal computed from bar `i` can only be filled on
 *     bar `i+1`. Entering at the close of the bar that produced the signal is
 *     the single most common way to invent an edge.
 *  2. **Costs are always charged.** Taker fee both ways plus slippage. A
 *     strategy that only works at zero cost does not work.
 *  3. **Intrabar order is unknowable.** If a bar's range touches both the stop
 *     and the target, it is resolved as the stop. On real data you do not know
 *     which came first, and assuming the good one is a lie that compounds.
 */
import { atr, rsi, volumeRatio } from './indicators.js';
import { bootstrapReturns, summarise } from './stats.js';

/**
 * The screener's conditions expressed as an entry rule: RSI oversold with a
 * volume surge, long only.
 */
export function rsiVolumeSignal(candles, { rsiPeriod = 14, rsiBelow = 30, volumePeriod = 20, minVolumeRatio = 3 } = {}) {
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const rsiSeries = rsi(closes, rsiPeriod);
  const ratioSeries = volumeRatio(volumes, volumePeriod);

  return candles.map((_, i) => {
    if (rsiSeries[i] === null || ratioSeries[i] === null) return false;
    return rsiSeries[i] < rsiBelow && ratioSeries[i] >= minVolumeRatio;
  });
}

/**
 * @param {object[]} candles     oldest first
 * @param {boolean[]} signals    signal on bar i, filled at open of bar i+1
 * @param {object} options
 *   equityUsd       starting capital
 *   riskPerTradePct share of equity per position
 *   stopAtrMult     stop distance in ATRs (volatility-scaled, not a flat %)
 *   targetAtrMult   target distance in ATRs
 *   maxBars         time stop
 *   feePct          taker fee, charged on entry and exit
 *   slippagePct     assumed adverse fill, charged on entry and exit
 */
export function backtest(candles, signals, options = {}) {
  const {
    equityUsd = 10_000,
    riskPerTradePct = 0.02,
    atrPeriod = 14,
    stopAtrMult = 2,
    targetAtrMult = 3,
    maxBars = 24,
    feePct = 0.0004,
    slippagePct = 0.0005,
  } = options;

  const atrSeries = atr(candles, atrPeriod);
  const trades = [];
  const equityCurve = [equityUsd];

  let equity = equityUsd;
  let position = null;

  for (let i = 1; i < candles.length; i += 1) {
    const bar = candles[i];

    if (position) {
      const { stop, target, quantity, entryPrice, entryIndex } = position;

      // Worst case first: if the bar spans both levels, assume the stop.
      let exitPrice = null;
      let reason = null;
      if (bar.low <= stop) {
        exitPrice = stop;
        reason = 'stop';
      } else if (bar.high >= target) {
        exitPrice = target;
        reason = 'target';
      } else if (i - entryIndex >= maxBars) {
        exitPrice = bar.close;
        reason = 'time';
      }

      if (exitPrice !== null) {
        const fill = exitPrice * (1 - slippagePct);
        const proceeds = quantity * fill * (1 - feePct);
        const cost = position.costUsd;
        const pnlUsd = proceeds - cost;

        equity += pnlUsd;
        trades.push({
          symbol: options.symbol ?? '',
          entryTime: candles[entryIndex].openTime,
          exitTime: bar.closeTime,
          entryPrice,
          exitPrice: fill,
          quantity,
          bars: i - entryIndex,
          pnlUsd,
          pnlPct: cost > 0 ? pnlUsd / cost : 0,
          reason,
        });
        position = null;
      }
    }

    // Entry uses the *previous* bar's signal, filled at this bar's open.
    if (!position && signals[i - 1] && atrSeries[i - 1] !== null) {
      const entryPrice = bar.open * (1 + slippagePct);
      const range = atrSeries[i - 1];
      const stop = entryPrice - range * stopAtrMult;
      if (stop > 0) {
        // Size so that hitting the stop costs `riskPerTradePct` of equity.
        const riskUsd = equity * riskPerTradePct;
        const riskPerUnit = entryPrice - stop;
        const quantity = riskPerUnit > 0 ? riskUsd / riskPerUnit : 0;
        const notional = quantity * entryPrice;

        if (quantity > 0 && notional <= equity) {
          position = {
            entryIndex: i,
            entryPrice,
            quantity,
            costUsd: notional * (1 + feePct),
            stop,
            target: entryPrice + range * targetAtrMult,
          };
        }
      }
    }

    equityCurve.push(position ? equity + (bar.close - position.entryPrice) * position.quantity : equity);
  }

  const stats = summarise(trades, { equityCurve });
  return {
    trades,
    equityCurve,
    finalEquityUsd: equity,
    returnPct: equityUsd > 0 ? equity / equityUsd - 1 : 0,
    stats,
    bootstrap: bootstrapReturns(trades),
    assumptions: {
      feePct,
      slippagePct,
      fill: 'next bar open',
      ambiguousBars: 'resolved as stop',
      riskPerTradePct,
      stopAtrMult,
      targetAtrMult,
      maxBars,
    },
  };
}

/** Run the same strategy over many symbols and pool the trades. */
export function backtestPortfolio(bySymbol, signalOptions = {}, backtestOptions = {}) {
  const perSymbol = [];
  const allTrades = [];

  for (const [symbol, candles] of Object.entries(bySymbol)) {
    const signals = rsiVolumeSignal(candles, signalOptions);
    const result = backtest(candles, signals, { ...backtestOptions, symbol });
    perSymbol.push({ symbol, ...result });
    allTrades.push(...result.trades);
  }

  allTrades.sort((a, b) => a.entryTime - b.entryTime);

  return {
    perSymbol: perSymbol.sort((a, b) => b.returnPct - a.returnPct),
    pooled: summarise(allTrades),
    bootstrap: bootstrapReturns(allTrades),
    trades: allTrades,
  };
}
