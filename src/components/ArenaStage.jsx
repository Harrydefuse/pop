import { useEffect, useRef } from 'react'
import { glow, makeCanvas, paintWall, rand, sconce } from '../game/pixelRoom'

/**
 * The room the campaign is decided in: an arched stone wall over a sand floor,
 * lit by torches burning down both sides.
 *
 * The stage it replaces was SVG — a fan of pink lines converging on a vanishing
 * point, which read as a wireframe rather than as a floor, and left the two
 * fighters standing on nothing. This is painted the same way the armoury is,
 * one block per art pixel, so the room and the sprites in it are made of the
 * same thing.
 *
 * Sand, not stone, under the fighters. Both sprites are dark and the wall
 * behind them is dark; a pale floor is what gives them a silhouette.
 */

const SCALE = 4 // device pixels per art pixel

const C = {
  night: '#0b070c',
  mortar: '#120c11',
  stoneDark: '#241a20',
  stone: '#31242b',
  stoneLit: '#3f2f38',
  stoneHot: '#54404b',
  void: '#0a0509',
  cornice: '#4d3a44',
  corniceLit: '#6d5361',
  sand: '#6a5137',
  sandLit: '#8b6b48',
  sandDark: '#4a3725',
  sandLine: '#3b2b1d',
  ring: '#a8814f',
  iron: '#2b323d',
  ironLit: '#5b6673',
  torchWood: '#4a2f1a',
  flameHot: '#fff2c8',
  flameMid: '#ffb347',
  flameLow: '#e2591f',
}

/**
 * A row of arched openings, cut through the wall.
 *
 * Each is walked bottom to top: straight sides for the first two thirds, then a
 * half-round head. Drawing the curve rather than stamping a rounded rectangle
 * is what keeps the edge on the grid — a border-radius here would come back
 * anti-aliased and read as blur against the blocks around it.
 */
function paintArches(g, W, wallBottom) {
  const n = Math.max(3, Math.round(W / 44))
  const pitch = W / n
  const aw = Math.round(pitch * 0.5)
  const ah = Math.round(wallBottom * 0.5)
  const base = wallBottom - 6
  for (let i = 0; i < n; i++) {
    const cx = Math.round(pitch * (i + 0.5))
    for (let y = base; y > base - ah; y--) {
      const t = (base - y) / ah
      const half = t > 0.6 ? (aw / 2) * Math.sqrt(Math.max(0, 1 - ((t - 0.6) / 0.4) ** 2)) : aw / 2
      const h = Math.round(half)
      if (h < 1) break
      g.fillStyle = C.void
      g.fillRect(cx - h, y, h * 2, 1)
      g.fillStyle = C.stoneHot
      g.fillRect(cx - h - 1, y, 1, 1)
      g.fillRect(cx + h, y, 1, 1)
    }
  }
}

/**
 * The floor: warm sand, scuffed, with the ring the fight happens inside.
 *
 * The scuffing is not decoration. Flat sand is a coloured rectangle, and a
 * coloured rectangle under two sprites reads as a shelf they have been pasted
 * onto rather than as ground they are standing on.
 */
function paintSand(g, W, H, floorY, seed) {
  const r = rand(seed)
  g.fillStyle = C.sand
  g.fillRect(0, floorY, W, H - floorY)
  for (let y = floorY; y < H; y++) {
    // The sand lightens towards the front, which is where the torches are.
    const t = (y - floorY) / Math.max(1, H - floorY)
    for (let x = 0; x < W; x += 1) {
      const roll = r()
      // Sparse. The first pass speckled a quarter of the floor and the sand
      // came out as static rather than as ground.
      if (roll > 0.975) g.fillStyle = C.sandDark
      else if (roll > 0.94 - t * 0.06) g.fillStyle = C.sandLit
      else continue
      g.fillRect(x, y, 1, 1)
    }
  }
  // The ring, drawn as an ellipse in blocks so it stays on the grid.
  const cy = floorY + Math.round((H - floorY) * 0.62)
  const rx = Math.round(W * 0.62)
  const ry = Math.round((H - floorY) * 0.66)
  g.fillStyle = C.ring
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180
    const ry2 = Math.round(cy + Math.sin(rad) * ry)
    // Clipped to the sand. Unclamped, the top of the ellipse climbed over the
    // cornice and drew a gold step across the bottom of the wall.
    if (ry2 <= floorY) continue
    g.fillRect(Math.round(W / 2 + Math.cos(rad) * rx), ry2, 2, 1)
  }
  g.fillStyle = C.sandLine
  g.fillRect(0, floorY, W, 1)
}

function paintRoom(W, H, floorY, seed) {
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')
  g.fillStyle = C.night
  g.fillRect(0, 0, W, H)
  paintWall(g, W, floorY, C, seed)
  paintArches(g, W, floorY)
  // A cornice where the wall meets the sand, so the two do not simply abut.
  g.fillStyle = C.cornice
  g.fillRect(0, floorY - 5, W, 5)
  g.fillStyle = C.corniceLit
  g.fillRect(0, floorY - 5, W, 1)
  paintSand(g, W, H, floorY, seed ^ 0x5bd1)
  return c
}

export default function ArenaStage({ flash = 0, className = '', style }) {
  const wrap = useRef(null)
  const canvas = useRef(null)
  // Read inside the frame loop rather than through state: an impact has to
  // light the room on the same frame the sprite jerks, and a re-render per
  // flash would drop it a frame behind.
  const hit = useRef(0)
  hit.current = flash

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
    let seen = 0
    let lit = 0

    const build = () => {
      const box = host.getBoundingClientRect()
      W = Math.max(40, Math.ceil(box.width / SCALE))
      H = Math.max(40, Math.ceil(box.height / SCALE))
      cv.width = W
      cv.height = H
      cv.style.width = `${box.width}px`
      cv.style.height = `${box.height}px`
      const floorY = Math.round(H * 0.46)
      room = paintRoom(W, H, floorY, 20260907)
      lights = [
        { x: 0.06, y: 0.3, r: 40, speed: 0.0031, phase: 0 },
        { x: 0.94, y: 0.3, r: 40, speed: 0.0037, phase: 2.1 },
        { x: 0.3, y: 0.14, r: 26, speed: 0.0026, phase: 4.4 },
        { x: 0.7, y: 0.14, r: 26, speed: 0.0022, phase: 1.2 },
      ].map((L) => ({ ...L, px: Math.round(W * L.x), py: Math.round(H * L.y) }))
    }

    const draw = (now) => {
      const g = cv.getContext('2d')
      g.drawImage(room, 0, 0)

      for (const L of lights) {
        const t = still ? 0 : now * L.speed + L.phase
        glow(g, L.px, L.py, L.r * (0.85 + Math.sin(t) * 0.15))
        sconce(g, L.px, L.py, t, C)
      }

      // The room takes the hit too. A blow that only moves the sprite is a
      // sprite twitching; a blow that lights the walls is a blow.
      if (hit.current !== seen) {
        seen = hit.current
        lit = 1
      }
      if (lit > 0) {
        g.fillStyle = `rgba(255,214,150,${(lit * 0.3).toFixed(3)})`
        g.fillRect(0, 0, W, H)
        lit = still ? 0 : Math.max(0, lit - 0.14)
      }

      const vig = g.createRadialGradient(W / 2, H * 0.6, H * 0.24, W / 2, H * 0.6, H * 0.95)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.72)')
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
    <div ref={wrap} aria-hidden="true" className={`overflow-hidden ${className}`} style={style}>
      <canvas ref={canvas} className="absolute inset-0 pixelated" />
    </div>
  )
}
