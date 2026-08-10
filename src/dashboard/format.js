/** Display helpers. Mirrors bot/src/util.js so both surfaces read alike. */

export function usd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${Math.round(n).toLocaleString('en-US')}`
  if (abs >= 0.01) return `$${n.toFixed(2)}`
  if (abs === 0) return '$0'
  return `$${n.toPrecision(3)}`
}

export function pct(value, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

/** Percentage with an explicit sign — the P&L colour is never the only cue. */
export function signedPct(value, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(digits)}%`
}

export function signedUsd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n >= 0 ? '+' : '−'}${usd(Math.abs(n))}`
}

/** Directional glyph paired with every gain/loss colour. */
export function caret(value) {
  return Number(value) >= 0 ? '▲' : '▼'
}

export function duration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function clockTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function shortAddress(address) {
  if (typeof address !== 'string' || address.length < 12) return address ?? ''
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

/** Tailwind class for a gain/loss value. */
export function pnlClass(value) {
  return Number(value) >= 0 ? 'text-gain' : 'text-loss'
}

export const ACTION_STYLES = {
  enter: { label: 'ENTER', className: 'border-gain/40 bg-gain/10 text-gain' },
  watch: { label: 'WATCH', className: 'border-chart-narrative/40 bg-chart-narrative/10 text-chart-narrative' },
  skip: { label: 'SKIP', className: 'border-panel-line bg-panel/60 text-ink-faint' },
  reject: { label: 'REJECT', className: 'border-loss/40 bg-loss/10 text-loss' },
}

export const STAGE_LABELS = {
  idle: 'Idle',
  starting: 'Starting cycle',
  managing: 'Marking positions',
  discovering: 'Discovering pools',
  enriching: 'Fetching market data',
  analyzing: 'Screening and scoring',
  trading: 'Placing paper trades',
}
