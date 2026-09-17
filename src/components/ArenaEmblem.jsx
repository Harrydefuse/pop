import { ARENAS } from '../game/arenas'
import { alpha } from '../game/color'

/**
 * The crest of one arena.
 *
 * Deliberately not an `Icon`. Those are 24-unit line art for controls — a
 * chevron, a tick, a bicycle — drawn thin so they disappear into a row of
 * buttons. An arena crest is the opposite job: it is the thing you recognise
 * the room by from across the screen, so it is solid, on its own 48-unit grid,
 * and it carries the arena's colour rather than the interface's.
 *
 * Ten shapes, one per rung, and the silhouettes are picked to be told apart at
 * badge size: a block, an ingot, an anvil, a sword, three crystals, a shard, a
 * falling rock, a star, a sun, a flame.
 */
export default function ArenaEmblem({ arena, size = 44, plate = true, dim = false, className, style }) {
  const a = arena ?? ARENAS[0]
  const tint = dim ? 'var(--color-ink-faint)' : a.tint

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role="img"
      aria-label={`${a.name} arena`}
    >
      {plate && <rect x="0" y="0" width="48" height="48" fill={alpha(tint, dim ? 8 : 14)} />}
      <path d={a.emblem} fill={tint} fillRule="evenodd" opacity={dim ? 0.55 : 1} />
    </svg>
  )
}
