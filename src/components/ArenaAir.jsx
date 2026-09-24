import { useMemo } from 'react'
import { alpha } from '../game/color'

/**
 * The room you are standing in, behind everything else.
 *
 * Clash Royale changes the arena, not the app: the cards, the buttons and the
 * HUD are identical in Goblin Stadium and in Legendary Arena, and what moves
 * is the ground behind them. That is the right division of labour and it is
 * the one copied here. Everything in this file sits BEHIND the panels, all of
 * which are opaque — so a room can be as dark or as bright as it likes without
 * touching the contrast of a single word of text.
 *
 * Three layers, cheapest first:
 *
 *   1. A wash, which is the light the room is lit by.
 *   2. A grain, which is what the walls are made of.
 *   3. The air, which is what is floating in it.
 *
 * All CSS. No canvas, no images, no per-frame JavaScript — a background that
 * costs a frame budget is a background that makes logging a set feel slow.
 */

/* Each grain is one repeating pattern built from gradients. They are quiet on
   purpose: at full strength a texture behind every screen stops being a room
   and starts being wallpaper, and you have to look at it every day. */
const GRAIN = {
  // Quarry stone: uneven speckle, no direction to it.
  rock: (c) => ({
    backgroundImage: `radial-gradient(circle at 20% 30%, ${alpha(c, 12)} 0 1px, transparent 2px),
      radial-gradient(circle at 70% 60%, ${alpha(c, 10)} 0 1.5px, transparent 2.5px),
      radial-gradient(circle at 45% 85%, ${alpha(c, 9)} 0 1px, transparent 2px)`,
    backgroundSize: '90px 90px, 140px 140px, 70px 70px',
  }),
  // Oxidised copper: broad soft blooms bleeding into each other.
  patina: (c) => ({
    backgroundImage: `radial-gradient(ellipse 120px 80px at 25% 20%, ${alpha(c, 12)}, transparent 70%),
      radial-gradient(ellipse 90px 120px at 80% 60%, ${alpha(c, 10)}, transparent 70%)`,
    backgroundSize: '260px 240px, 200px 300px',
  }),
  // Worked metal: fine parallel streaks, like a ground finish.
  brushed: (c) => ({
    backgroundImage: `repeating-linear-gradient(103deg, ${alpha(c, 7)} 0 1px, transparent 1px 7px)`,
    backgroundSize: 'auto',
  }),
  // Ore in rock: bright glints on a dark seam.
  ore: (c) => ({
    backgroundImage: `radial-gradient(circle at 30% 40%, ${alpha(c, 18)} 0 1px, transparent 2px),
      radial-gradient(circle at 75% 15%, ${alpha(c, 14)} 0 1.5px, transparent 3px),
      radial-gradient(circle at 60% 80%, ${alpha(c, 16)} 0 1px, transparent 2px)`,
    backgroundSize: '110px 110px, 170px 170px, 80px 80px',
  }),
  // Volcanic glass: long sharp facets catching the light.
  facet: (c) => ({
    backgroundImage: `repeating-linear-gradient(68deg, ${alpha(c, 10)} 0 1px, transparent 1px 22px),
      repeating-linear-gradient(-58deg, ${alpha(c, 7)} 0 1px, transparent 1px 34px)`,
    backgroundSize: 'auto',
  }),
  // Deep sky: a scatter of far-off points.
  star: (c) => ({
    backgroundImage: `radial-gradient(circle at 15% 25%, ${alpha(c, 22)} 0 1px, transparent 2px),
      radial-gradient(circle at 65% 10%, ${alpha(c, 16)} 0 1px, transparent 2px),
      radial-gradient(circle at 40% 70%, ${alpha(c, 20)} 0 1px, transparent 2px),
      radial-gradient(circle at 88% 55%, ${alpha(c, 14)} 0 1px, transparent 2px)`,
    backgroundSize: '130px 130px, 190px 190px, 90px 90px, 150px 150px',
  }),
  // A forge floor: heat pooling in bands.
  ember: (c) => ({
    backgroundImage: `repeating-linear-gradient(180deg, ${alpha(c, 8)} 0 2px, transparent 2px 16px),
      radial-gradient(ellipse 140px 60px at 50% 100%, ${alpha(c, 16)}, transparent 70%)`,
    backgroundSize: 'auto, 100% 340px',
  }),
}

/**
 * Where each mote starts and how long it takes.
 *
 * Fixed rather than random, for the same reason the pets' sparkles are: air
 * that is arranged differently on every render reads as a rendering fault
 * rather than as atmosphere. Seventeen positions, spread unevenly, reused by
 * every room — the count and the motion are what make a quarry different from
 * a forge, not which pixel each speck starts on.
 */
const SEED = [
  { x: 8, y: 82, d: 0, t: 15, s: 3 },
  { x: 23, y: 44, d: 2.4, t: 19, s: 2 },
  { x: 37, y: 91, d: 5.1, t: 13, s: 4 },
  { x: 52, y: 26, d: 1.2, t: 21, s: 2 },
  { x: 64, y: 73, d: 7.6, t: 16, s: 3 },
  { x: 79, y: 38, d: 3.3, t: 18, s: 2 },
  { x: 91, y: 88, d: 9.2, t: 14, s: 3 },
  { x: 15, y: 61, d: 6.4, t: 22, s: 2 },
  { x: 45, y: 12, d: 11.1, t: 17, s: 3 },
  { x: 71, y: 57, d: 4.8, t: 20, s: 2 },
  { x: 30, y: 70, d: 8.7, t: 15, s: 4 },
  { x: 86, y: 19, d: 2.9, t: 23, s: 2 },
  { x: 58, y: 95, d: 10.3, t: 12, s: 3 },
  { x: 4, y: 33, d: 5.7, t: 24, s: 2 },
  { x: 68, y: 6, d: 12.8, t: 18, s: 3 },
  { x: 41, y: 52, d: 1.9, t: 26, s: 2 },
  { x: 95, y: 66, d: 7.1, t: 16, s: 2 },
]

const AIR_CLASS = {
  rise: 'air-rise',
  fall: 'air-fall',
  drift: 'air-drift',
  twinkle: 'air-twinkle',
}

export default function ArenaAir({ arena }) {
  const scene = arena?.scene
  const tint = arena?.tint ?? 'var(--arena)'

  const motes = useMemo(() => {
    if (!scene) return []
    return SEED.slice(0, Math.min(scene.motes ?? 0, SEED.length))
  }, [scene])

  if (!scene) return null
  const grain = GRAIN[scene.grain]?.(tint)

  return (
    // aria-hidden throughout: this is weather, and a screen reader reading out
    // the weather on every screen would be a reason to turn the app off.
    <div className="arena-air" aria-hidden="true">
      {/* The light in the room. Strongest at the top, gone before the first
          card, so it reads as where you are rather than as a coloured page. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, ${alpha(tint, Math.round(scene.haze * 100))} 0, transparent 46%),
            radial-gradient(ellipse 120% 40% at 50% 0%, ${alpha(tint, Math.round(scene.haze * 60))}, transparent 70%)`,
        }}
      />
      {/* What the room is made of. */}
      {grain && <div className="absolute inset-0 opacity-70" style={grain} />}
      {/* What is floating in it. */}
      {motes.map((m, i) => (
        <span
          key={i}
          className={`arena-mote ${AIR_CLASS[scene.air] ?? 'air-drift'}`}
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.s,
            height: m.s,
            background: tint,
            animationDelay: `-${m.d}s`,
            animationDuration: `${m.t}s`,
          }}
        />
      ))}
    </div>
  )
}
