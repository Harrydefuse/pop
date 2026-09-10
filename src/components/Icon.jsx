import { glyphOf } from '../game/glyphs'

/**
 * An interface icon.
 *
 * Line art on a 24-unit grid rather than the 8×8 pixel glyphs this used to
 * draw. Eight pixels can hold an arrow and a tick; it cannot hold a bicycle,
 * and every activity in the list was coming out as the same smudge. The pixel
 * art in this app is the character art — the hero, the pets, the gear, the
 * chest — and an icon in a row of controls is not that.
 *
 * The stroke thins as the icon does, so a 12px chevron does not carry the same
 * slab of ink as a 24px one and read as a blob.
 */
export default function Icon({ name, size = 12, color = 'currentColor', className, style, title }) {
  const glyph = glyphOf(name)
  if (!glyph) return null
  const paths = Array.isArray(glyph.d) ? glyph.d : [glyph.d]
  const width = Math.max(1.4, Math.min(2.1, 24 / size + 1.15))

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      fill={glyph.fill ? color : 'none'}
      stroke={glyph.fill ? 'none' : color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fillRule={glyph.fill ? 'evenodd' : undefined} />
      ))}
    </svg>
  )
}
