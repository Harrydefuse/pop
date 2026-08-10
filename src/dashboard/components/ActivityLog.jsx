import { clockTime } from '../format.js'

const LEVEL_DOT = {
  trade: 'bg-signal',
  cycle: 'bg-chart-safety',
  error: 'bg-loss',
  info: 'bg-ink-faint',
}

/** Rolling log of what the runner did, newest first. */
export default function ActivityLog({ entries }) {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-ink-faint">Waiting for the first cycle…</p>
  }

  // Scrolls inside its own box — an unbounded log stretches the whole page.
  return (
    <ol className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="flex items-start gap-2 text-xs">
          <span
            aria-hidden
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_DOT[entry.level] ?? LEVEL_DOT.info}`}
          />
          <span className="tabular shrink-0 font-mono text-ink-faint">{clockTime(entry.at)}</span>
          <span className={`min-w-0 flex-1 ${entry.level === 'error' ? 'text-loss' : 'text-ink-dim'}`}>
            {entry.message}
          </span>
        </li>
      ))}
    </ol>
  )
}
