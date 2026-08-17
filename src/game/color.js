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
