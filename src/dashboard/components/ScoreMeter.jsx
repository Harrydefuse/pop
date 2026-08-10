/**
 * The three sub-scores behind a decision, as one stacked meter row.
 *
 * Each track is labelled, so the hues are reinforcement rather than the sole
 * carrier of identity — but they were still validated for CVD separation
 * against the card surface (see dashboard.css).
 */
const TRACKS = [
  { key: 'safety', label: 'SAFE', color: 'var(--color-chart-safety)' },
  { key: 'momentum', label: 'MOM', color: 'var(--color-chart-momentum)' },
  { key: 'narrative', label: 'NARR', color: 'var(--color-chart-narrative)' },
]

export function ScoreMeter({ breakdown, compact = false }) {
  return (
    <div className={compact ? 'flex items-center gap-3' : 'space-y-1.5'}>
      {TRACKS.map(({ key, label, color }) => {
        const value = Math.max(0, Math.min(1, Number(breakdown?.[key]) || 0))
        return (
          <div key={key} className={compact ? 'flex items-center gap-1.5' : 'flex items-center gap-2'}>
            <span className="font-mono text-[10px] tracking-wider text-ink-faint" style={{ width: compact ? 30 : 38 }}>
              {label}
            </span>
            <div
              className="relative h-1.5 overflow-hidden rounded-full bg-panel"
              style={{ width: compact ? 44 : '100%', flex: compact ? undefined : 1 }}
              role="meter"
              aria-valuenow={Number(value.toFixed(2))}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-label={`${key} score`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${value * 100}%`, background: color }}
              />
            </div>
            <span className="tabular font-mono text-[10px] text-ink-dim">{value.toFixed(2)}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Where the live price sits between the stop loss and the take-profit target.
 * Reading a position's risk from two numbers is slow; reading it from a marker
 * on a track is instant.
 */
export function RiskTrack({ changePct, stopPct, targetPct }) {
  const lo = -Math.abs(stopPct)
  const hi = Math.abs(targetPct)
  const clamped = Math.max(lo, Math.min(hi, Number(changePct) || 0))
  const position = ((clamped - lo) / (hi - lo)) * 100
  const zero = ((0 - lo) / (hi - lo)) * 100

  return (
    <div
      className="relative h-1.5 w-full rounded-full bg-panel"
      role="meter"
      aria-valuenow={Number((Number(changePct) * 100).toFixed(1))}
      aria-valuemin={lo * 100}
      aria-valuemax={hi * 100}
      aria-label="Price between stop loss and take profit"
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 rounded-l-full bg-loss/25"
        style={{ width: `${zero}%` }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 rounded-r-full bg-gain/25"
        style={{ left: `${zero}%`, right: 0 }}
      />
      <div aria-hidden className="absolute inset-y-[-2px] w-px bg-ink-faint" style={{ left: `${zero}%` }} />
      <div
        aria-hidden
        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel-raised"
        style={{
          left: `${position}%`,
          background: Number(changePct) >= 0 ? 'var(--color-gain)' : 'var(--color-loss)',
        }}
      />
    </div>
  )
}
