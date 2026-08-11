/**
 * Trade statistics, with the uncertainty attached.
 *
 * The reason this file exists: "9 trades, 83% hit rate" is the single most
 * misleading way to report a backtest. Nine samples cannot distinguish a real
 * edge from luck, and a bare percentage hides that completely. Every summary
 * here carries a confidence interval and an explicit verdict on whether the
 * sample is large enough to conclude anything.
 */

/** 95% two-sided normal quantile. */
const Z = 1.959963985;

/**
 * Wilson score interval for a proportion.
 *
 * Preferred over the textbook normal approximation because it stays inside
 * [0, 1] and behaves sensibly at small n — which is exactly the regime a
 * short backtest lives in.
 */
export function wilsonInterval(successes, total, z = Z) {
  if (total <= 0) return { low: 0, high: 1, point: 0 };

  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const centre = (p + (z * z) / (2 * total)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));

  return {
    point: p,
    low: Math.max(0, centre - margin),
    high: Math.min(1, centre + margin),
  };
}

/**
 * How many trades would be needed to establish an edge of `edge` above
 * break-even with 95% confidence? Answers "is my sample big enough" with a
 * number rather than a shrug.
 */
export function requiredSampleSize(edge, baseline = 0.5) {
  if (!(edge > 0)) return Infinity;
  const p = baseline + edge;
  return Math.ceil((Z * Z * p * (1 - p)) / (edge * edge));
}

/** Largest peak-to-trough decline of an equity curve, as a fraction. */
export function maxDrawdown(equityCurve) {
  let peak = -Infinity;
  let worst = 0;
  for (const value of equityCurve) {
    if (value > peak) peak = value;
    if (peak > 0) worst = Math.min(worst, value / peak - 1);
  }
  return Math.abs(worst);
}

/**
 * Full summary for a list of closed trades.
 *
 * `trades` need only carry `pnlPct` and `pnlUsd`.
 */
export function summarise(trades, { equityCurve = [] } = {}) {
  const n = trades.length;
  if (n === 0) {
    // Return the full shape, zeroed. A partial object here means every caller
    // that isn't checking `trades` first silently produces NaN.
    return {
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      winRateLow: 0,
      winRateHigh: 0,
      totalPnlUsd: 0,
      expectancyUsd: 0,
      avgWinUsd: 0,
      avgLossUsd: 0,
      profitFactor: null,
      breakEvenWinRate: null,
      edgeOverBreakEven: null,
      meanReturnPct: 0,
      stdDevPct: 0,
      sharpePerTrade: 0,
      maxDrawdownPct: equityCurve.length ? maxDrawdown(equityCurve) : null,
      reliable: false,
      verdict: 'No trades — the conditions never co-occurred in this window.',
    };
  }

  const wins = trades.filter((trade) => trade.pnlUsd > 0);
  const losses = trades.filter((trade) => trade.pnlUsd <= 0);

  const grossProfit = wins.reduce((sum, t) => sum + t.pnlUsd, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnlUsd, 0));

  const winRate = wilsonInterval(wins.length, n);
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  // Expectancy: average dollars per trade. The only number that compounds.
  const expectancy = trades.reduce((sum, t) => sum + t.pnlUsd, 0) / n;

  const returns = trades.map((t) => t.pnlPct);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / Math.max(1, n - 1);
  const stdDev = Math.sqrt(variance);

  // Per-trade Sharpe. Deliberately NOT annualised: annualising a 9-trade
  // sample multiplies the noise along with the signal and looks authoritative.
  const sharpePerTrade = stdDev > 0 ? meanReturn / stdDev : 0;

  const reliable = n >= 30 && winRate.low > 0.5;
  const breakEvenWinRate = avgWin + avgLoss > 0 ? avgLoss / (avgWin + avgLoss) : null;

  return {
    trades: n,
    wins: wins.length,
    losses: losses.length,

    winRate: winRate.point,
    winRateLow: winRate.low,
    winRateHigh: winRate.high,

    totalPnlUsd: grossProfit - grossLoss,
    expectancyUsd: expectancy,
    avgWinUsd: avgWin,
    avgLossUsd: avgLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,

    /** The win rate this system needs just to break even, given its payoff ratio. */
    breakEvenWinRate,
    edgeOverBreakEven: breakEvenWinRate === null ? null : winRate.point - breakEvenWinRate,

    meanReturnPct: meanReturn,
    stdDevPct: stdDev,
    sharpePerTrade,
    maxDrawdownPct: equityCurve.length ? maxDrawdown(equityCurve) : null,

    reliable,
    verdict: verdictFor(n, winRate, breakEvenWinRate),
  };
}

function verdictFor(n, winRate, breakEvenWinRate) {
  if (n < 30) {
    return `${n} trades is too few to conclude anything. The 95% confidence interval on the win rate is ${(winRate.low * 100).toFixed(0)}%–${(winRate.high * 100).toFixed(0)}%, which is consistent with both a real edge and luck.`;
  }
  if (breakEvenWinRate !== null && winRate.low <= breakEvenWinRate) {
    return `The win rate's lower bound (${(winRate.low * 100).toFixed(0)}%) is at or below the ${(breakEvenWinRate * 100).toFixed(0)}% needed to break even after costs. Not yet distinguishable from no edge.`;
  }
  if (winRate.low > 0.5) {
    return `${n} trades with a 95% lower bound of ${(winRate.low * 100).toFixed(0)}% — the edge survives the confidence interval. Still only evidence about the period tested.`;
  }
  return `${n} trades, but the confidence interval spans 50%. Not yet distinguishable from a coin flip.`;
}

/**
 * Bootstrap the distribution of total return by resampling trades with
 * replacement. Shows how much of a result is sequence luck: if the 5th
 * percentile is deeply negative, the headline number was a good draw.
 */
export function bootstrapReturns(trades, { iterations = 2000, random = Math.random } = {}) {
  if (trades.length === 0) return null;

  const totals = [];
  for (let i = 0; i < iterations; i += 1) {
    let total = 0;
    for (let j = 0; j < trades.length; j += 1) {
      total += trades[Math.floor(random() * trades.length)].pnlUsd;
    }
    totals.push(total);
  }
  totals.sort((a, b) => a - b);

  const at = (q) => totals[Math.min(totals.length - 1, Math.floor(q * totals.length))];
  return {
    iterations,
    p05: at(0.05),
    median: at(0.5),
    p95: at(0.95),
    /** Share of resamples that lost money. */
    probabilityOfLoss: totals.filter((total) => total < 0).length / totals.length,
  };
}
