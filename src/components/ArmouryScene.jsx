import { useEffect, useRef } from 'react'
import PixelSprite from './PixelSprite'
import { armSprite } from '../game/wallArms'
import { CHEST_SPRITE } from '../game/sprites'
import { glow, makeCanvas, paintFloor, paintWall, sconce } from '../game/pixelRoom'

/**
 * The room behind the title card: a stone wall hung with racks of arms, lit by
 * torches, with chests along the floor.
 *
 * Painted the same way the landscape it replaces was — flat blocks on the art
 * grid, nothing anti-aliased — so it holds up next to the sprites rather than
 * sitting behind them like a photograph.
 *
 * The wall and the floor are painted once per size onto an offscreen canvas and
 * blitted every frame. Only the light moves: torches breathing out of phase and
 * a warm pool on the stone under each. That keeps the per-frame cost to one
 * blit and a handful of radial fills no matter how much detail is in the wall.
 *
 * The scene owns its own racks. They used to be passed in, which meant the
 * layout lived in the title screen while the art lived here and the two had to
 * be kept in step by hand — and the first version of that hung five chestplates
 * in a row, because the kinds it asked for had no art and fell back.
 */

const SCALE = 4 // device pixels per art pixel

const C = {
  mortar: '#140e12',
  stoneDark: '#291f24',
  stone: '#382b31',
  stoneLit: '#493942',
  stoneHot: '#5c4952',
  beam: '#6b4527',
  beamLit: '#8f6039',
  beamDark: '#412816',
  iron: '#2b323d',
  ironLit: '#5b6673',
  floor: '#241b20',
  floorLit: '#3a2c34',
  floorLine: '#181116',
  torchWood: '#4a2f1a',
  flameHot: '#fff2c8',
  flameMid: '#ffb347',
  flameLow: '#e2591f',
}

/** Where the light comes from, in fractions of the room. */
const LIGHTS = [
  { x: 0.045, y: 0.4, r: 46, speed: 0.0031, phase: 0, torch: true },
  { x: 0.955, y: 0.4, r: 46, speed: 0.0037, phase: 2.1, torch: true },
  { x: 0.5, y: 0.16, r: 40, speed: 0.0019, phase: 4.4, torch: false },
  { x: 0.86, y: 0.9, r: 26, speed: 0.0026, phase: 1.2, torch: false },
]

/**
 * The two racks the wall always has room for: one either side, above the
 * plaque. Everything wider is placed by the title card — see ArmsRack.
 */
const SIDE_RACKS = [
  { left: 0, right: 17, top: 4, size: 50, arms: [['axe', '#c9a227', '#f2d571']] },
  { left: 83, right: 100, top: 4, size: 50, arms: [['spear', '#c9a227', '#f2d571']] },
]

/**
 * A beam of arms, hung wherever it is put.
 *
 * This is a component rather than another entry in the scene's own table
 * because a rack placed at a fixed percentage of the wall cannot know where the
 * menu ends: the menu is a stack of fixed-height boards, so it reaches further
 * down a short window than a tall one, and the first version of this screen
 * showed two bare beams on a desktop with every weapon hidden behind the board.
 * Handed to the title card, it lands in the gap the layout has already worked
 * out, and cannot overlap anything.
 */
export function ArmsRack({ arms, size = 46, gap = 4, className = '' }) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start justify-center" style={{ gap }}>
        {arms.map(([kind, accent, lit], n) => (
          <PixelSprite
            key={`${kind}-${n}`}
            sprite={armSprite(kind, accent, lit)}
            size={size}
            style={{ filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.55))' }}
          />
        ))}
      </div>
      {/* The beam sits under the arms and the pegs are what they hang from —
          the point of contact is what makes them read as hung rather than as
          floating. */}
      <div
        className="relative h-[6px] -mt-[6px]"
        style={{ background: C.beam, boxShadow: `inset 0 1px 0 0 ${C.beamLit}, inset 0 -2px 0 0 ${C.beamDark}` }}
      >
        <span className="absolute -top-[3px] left-1 w-[4px] h-[11px]" style={{ background: C.iron, boxShadow: `inset 1px 0 0 0 ${C.ironLit}` }} />
        <span className="absolute -top-[3px] right-1 w-[4px] h-[11px]" style={{ background: C.iron, boxShadow: `inset 1px 0 0 0 ${C.ironLit}` }} />
      </div>
    </div>
  )
}

/** The static half of the room, painted once per size. */
function paintRoom(W, H, floorY, seed) {
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')
  paintWall(g, W, floorY, C, seed)
  paintFloor(g, W, H, floorY, C)
  return c
}

export default function ArmouryScene({ className = '', style }) {
  const wrap = useRef(null)
  const canvas = useRef(null)

  useEffect(() => {
    const host = wrap.current
    const cv = canvas.current
    if (!host || !cv) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let room = null
    let raf = 0
    let W = 0
    let H = 0
    let lights = []

    const build = () => {
      const box = host.getBoundingClientRect()
      W = Math.max(40, Math.ceil(box.width / SCALE))
      H = Math.max(40, Math.ceil(box.height / SCALE))
      cv.width = W
      cv.height = H
      cv.style.width = `${box.width}px`
      cv.style.height = `${box.height}px`
      const floorY = Math.round(H * 0.78)
      room = paintRoom(W, H, floorY, 8675309)
      lights = LIGHTS.map((L) => ({ ...L, px: Math.round(W * L.x), py: Math.round(H * L.y) }))
    }

    const draw = (now) => {
      const g = cv.getContext('2d')
      g.clearRect(0, 0, W, H)
      g.drawImage(room, 0, 0)

      for (const L of lights) {
        const t = still ? 0 : now * L.speed + L.phase
        glow(g, L.px, L.py, L.r * (0.85 + Math.sin(t) * 0.15))
        if (L.torch) sconce(g, L.px, L.py, t, C)
      }

      // The room falls away at the edges, which is what keeps the eye on the
      // menu rather than on the masonry.
      const vig = g.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.9)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.66)')
      g.fillStyle = vig
      g.fillRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }

    build()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(build)
    ro.observe(host)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    // No `relative` of its own: the caller positions this (the title card hands
    // it `absolute inset-0`), and a hardcoded `relative` fought that and left
    // the host with no size for the canvas to measure.
    <div ref={wrap} aria-hidden="true" className={`overflow-hidden ${className}`} style={style}>
      <canvas ref={canvas} className="absolute inset-0 pixelated" />

      {SIDE_RACKS.map((rack, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${rack.left}%`, right: `${100 - rack.right}%`, top: `${rack.top}%` }}
        >
          <ArmsRack arms={rack.arms} size={rack.size} />
        </div>
      ))}

      {/* Chests on the flagstones, so the floor is a floor and not a gradient. */}
      <PixelSprite sprite={CHEST_SPRITE} size={34} className="absolute left-[1%] bottom-[9%]" style={{ filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,0.5))' }} />
      <PixelSprite sprite={CHEST_SPRITE} size={28} className="absolute right-[2%] bottom-[10%]" style={{ filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,0.5))' }} />
    </div>
  )
}
