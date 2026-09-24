import { useEffect, useRef } from 'react'
import { glow, makeCanvas, paintFloor, paintWall, sconce } from '../game/pixelRoom'

/**
 * The room behind the title card: a stone wall, two torches, a flagstone floor.
 *
 * That is the whole of it, deliberately. The first version hung racks of
 * weapons on this wall and stood chests along the floor, all of it art
 * generated for the purpose, and it made the screen look busy and cheap — the
 * good art in this game is the characters, and a backdrop's job is to sit
 * behind them, not to compete.
 *
 * Painted one block per art pixel so it holds up next to the sprites rather
 * than sitting behind them like a photograph. The wall and floor are painted
 * once per size onto an offscreen canvas and blitted; only the torches move.
 */

const SCALE = 4 // device pixels per art pixel

const C = {
  mortar: '#150e13',
  // A narrow range on purpose. A wall with strong light and dark stones in it
  // reads as a mosaic; the point of this one is to be quiet.
  stoneDark: '#2b2027',
  stone: '#33262d',
  stoneLit: '#3c2e35',
  stoneHot: '#493942',
  floor: '#241b20',
  floorLit: '#3a2c34',
  floorLine: '#181116',
  iron: '#2b323d',
  ironLit: '#5b6673',
  torchWood: '#4a2f1a',
  flameHot: '#fff2c8',
  flameMid: '#ffb347',
  flameLow: '#e2591f',
}

/** One torch either side, level with the menu. */
const TORCHES = [
  { x: 0.07, y: 0.4, r: 46, speed: 0.0031, phase: 0 },
  { x: 0.93, y: 0.4, r: 46, speed: 0.0037, phase: 2.1 },
]

function paintRoom(W, H, floorY, seed) {
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')
  paintWall(g, W, floorY, C, seed, 17, 9)
  paintFloor(g, W, H, floorY, C)
  return c
}

export default function TitleRoom({ className = '', style }) {
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
      // The floor sits high enough to be a floor. Down at 84% it was a strip, and
      // the wall above the menu was a blank third of the screen.
      room = paintRoom(W, H, Math.round(H * 0.72), 8675309)
      lights = TORCHES.map((L) => ({ ...L, px: Math.round(W * L.x), py: Math.round(H * L.y) }))
    }

    const draw = (now) => {
      const g = cv.getContext('2d')
      g.drawImage(room, 0, 0)
      for (const L of lights) {
        const t = still ? 0 : now * L.speed + L.phase
        glow(g, L.px, L.py, L.r * (0.85 + Math.sin(t) * 0.15))
        sconce(g, L.px, L.py, t, C)
      }
      // The room falls away at the edges, which is what keeps the eye on the
      // menu rather than on the masonry.
      const vig = g.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.9)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.7)')
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
    </div>
  )
}
