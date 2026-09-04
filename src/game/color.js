/**
 * Fade any colour to a percentage of opacity.
 *
 * Most colours in this app are passed around as CSS custom properties
 * (`var(--color-neon)`), so the usual trick of appending hex alpha —
 * `${color}22` — silently produces an invalid value and the whole declaration
 * is dropped. color-mix works regardless of the source format.
 */
export function alpha(color, pct) {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`
}

/**
 * Lighten (positive) or darken (negative) a hex colour by a percentage.
 *
 * Character art is drawn with a shade ramp per material — three or four tones
 * of hair, of skin, of cloth. The player only picks one colour for each, so the
 * rest of the ramp is generated from it. Plain sRGB maths rather than
 * `color-mix` because these values are written straight into SVG `fill`.
 */
export function shade(hex, pct) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const to = pct >= 0 ? 255 : 0
  const k = Math.min(100, Math.abs(pct)) / 100
  const mix = (c) => Math.round(c + (to - c) * k)
  const out = ((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255)) >>> 0
  return '#' + out.toString(16).padStart(6, '0')
}
