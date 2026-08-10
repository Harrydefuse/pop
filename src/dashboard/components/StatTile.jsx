/**
 * A single headline number. No plot, so per the form heuristic it stays a tile
 * rather than becoming a chart. `delta` carries its own sign and caret so the
 * gain/loss colour is never the only encoding.
 */
export default function StatTile({ label, value, delta, deltaClass, hint, accent = 'var(--color-panel-line)' }) {
  return (
    <div className="relative overflow-hidden rounded border border-panel-line bg-panel-raised p-4">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: accent }} />
      <div className="font-mono text-[10px] tracking-[0.18em] text-ink-faint uppercase">{label}</div>
      <div className="tabular mt-2 font-display text-3xl leading-none font-semibold text-ink">{value}</div>
      {delta ? <div className={`tabular mt-1.5 font-mono text-xs ${deltaClass ?? 'text-ink-dim'}`}>{delta}</div> : null}
      {hint ? <div className="mt-1 text-xs text-ink-faint">{hint}</div> : null}
    </div>
  )
}
