import { caret, clockTime, duration, pnlClass, signedPct, signedUsd } from '../format.js'

/**
 * Recently closed paper trades — the outcome half of the decision log.
 *
 * Laid out in two lines rather than one wide row: this sits in a narrow
 * sidebar column, and a single row of fixed-width cells overflowed the page.
 */
export default function ClosedTrades({ trades }) {
  if (!trades || trades.length === 0) {
    return <p className="text-sm text-ink-faint">No closed trades yet.</p>
  }

  return (
    <ul className="space-y-2">
      {trades.map((trade) => (
        <li key={`${trade.address}-${trade.closedAt}`} className="border-b border-panel-line/60 pb-2 last:border-0 last:pb-0">
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{trade.symbol || '—'}</span>
            <span className={`tabular shrink-0 font-mono text-sm ${pnlClass(trade.pnlPct)}`}>
              <span aria-hidden className="mr-0.5">{caret(trade.pnlPct)}</span>
              {signedPct(trade.pnlPct)}
            </span>
            <span className={`tabular shrink-0 font-mono text-xs ${pnlClass(trade.pnlUsd)}`}>
              {signedUsd(trade.pnlUsd)}
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2 text-xs text-ink-faint">
            <span className="min-w-0 flex-1 truncate">{trade.exitReason}</span>
            <span className="tabular shrink-0 font-mono">
              {duration(trade.holdMs)} · {clockTime(trade.closedAt)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
