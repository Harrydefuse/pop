import { usd } from '../format.js'

/**
 * Whether real money is moving is the single most important fact on this page,
 * so it gets a full-width banner rather than a badge — and the live variant is
 * deliberately loud. The paper variant is a quiet one-liner: reassurance, not
 * decoration.
 */
export default function ExecutionBanner({ mode, execution, dryRun }) {
  if (mode !== 'live') {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded border border-panel-line bg-panel-raised px-3 py-2 text-xs text-ink-faint">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-relay" />
        <span className="text-ink-dim">
          {dryRun ? 'Dry run — analysing only, no positions opened.' : 'Paper trading — simulated fills, no wallet.'}
        </span>
        {execution?.blockedBy?.length ? (
          <span className="text-ink-faint">
            Live is off because: {execution.blockedBy.join('; ')}.
          </span>
        ) : null}
      </p>
    )
  }

  const spent = execution?.spentTodayUsd ?? 0
  const cap = execution?.limits?.maxDailySpendUsd ?? 0
  const usedPct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0

  return (
    <section
      aria-label="Live trading status"
      className="rounded border border-loss/50 bg-loss/10 px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden className="live-dot h-2 w-2 rounded-full bg-loss" />
        <strong className="font-display text-lg leading-none tracking-wide text-loss">LIVE TRADING</strong>
        <span className="text-sm text-ink-dim">Real funds. Orders are signed and sent on chain.</span>

        {execution?.killSwitch ? (
          <span className="rounded border border-loss bg-loss/20 px-2 py-0.5 font-mono text-[11px] text-loss">
            KILL SWITCH ENGAGED
          </span>
        ) : null}

        <span className="ml-auto font-mono text-[11px] text-ink-dim">
          {execution?.wallet ? `${execution.wallet.slice(0, 4)}…${execution.wallet.slice(-4)}` : 'no wallet'}
          {execution?.balanceSol != null ? ` · ${execution.balanceSol.toFixed(3)} SOL` : ''}
        </span>
      </div>

      <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">
        <div>
          <div className="flex items-baseline gap-2 font-mono text-[11px]">
            <span className="w-24 shrink-0 text-ink-faint">Spent today</span>
            <span className="tabular text-ink">
              {usd(spent)} / {usd(cap)}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-loss"
              style={{ width: `${usedPct}%` }}
              role="meter"
              aria-valuenow={Math.round(usedPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of the daily spend cap used"
            />
          </div>
        </div>

        {/*
          Label and value stay adjacent rather than justified to the column
          edges: across a wide banner, justify-between separates a pair far
          enough that the eye reads across columns instead of down them.
        */}
        <dl className="font-mono text-[11px]">
          <div className="flex items-baseline gap-2">
            <dt className="w-24 shrink-0 text-ink-faint">Trades today</dt>
            <dd className="tabular text-ink">
              {execution?.tradesToday ?? 0} / {execution?.limits?.maxTradesPerDay ?? '—'}
            </dd>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <dt className="w-24 shrink-0 text-ink-faint">Max per trade</dt>
            <dd className="tabular text-ink">{usd(execution?.limits?.maxTradeUsd)}</dd>
          </div>
        </dl>

        <dl className="font-mono text-[11px]">
          <div className="flex items-baseline gap-2">
            <dt className="w-24 shrink-0 text-ink-faint">Max slippage</dt>
            <dd className="tabular text-ink">
              {execution?.limits?.maxSlippageBps != null
                ? `${(execution.limits.maxSlippageBps / 100).toFixed(2)}%`
                : '—'}
            </dd>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <dt className="w-24 shrink-0 text-ink-faint">SOL reserve</dt>
            <dd className="tabular text-ink">{execution?.limits?.minSolReserve ?? '—'} SOL</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
