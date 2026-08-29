import { useEffect, useMemo, useRef } from 'react'
import { SYDNEY } from '../game/sydney'
import { COAST_INK, TERRAIN, TILE, TILE_PALETTE, pick } from '../game/tiles'
import { key } from '../game/mapgrid'

const W = SYDNEY.w * TILE
const H = SYDNEY.h * TILE

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]

/** Land next door means this bit of water is a shore, and shores get foam. */
function isShore(x, y) {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const row = SYDNEY.rows[y + dy]
    const ch = row?.[x + dx]
    if (ch && !TERRAIN[ch]?.water) return true
  }
  return false
}

/** Paints the whole map once into an offscreen canvas: 8x8 of drawn art per
 *  100m cell. Everything after this is a blit. */
function paintBase() {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const cache = new Map()
  const colour = (ch) => {
    let c = cache.get(ch)
    if (!c) {
      c = rgb(TILE_PALETTE[ch] ?? '#000000')
      cache.set(ch, c)
    }
    return c
  }

  for (let cy = 0; cy < SYDNEY.h; cy++) {
    const row = SYDNEY.rows[cy]
    for (let cx = 0; cx < SYDNEY.w; cx++) {
      const t = TERRAIN[row[cx]] ?? TERRAIN['.']
      const base = colour(row[cx] === '~' ? 'd' : 'a')
      const fallback = rgb(t.base)
      const tile = t.foam && isShore(cx, cy) ? pick(t.foam, cx, cy) : pick(t.tiles, cx, cy)
      for (let py = 0; py < TILE; py++) {
        const line = tile[py]
        let i = ((cy * TILE + py) * W + cx * TILE) * 4
        for (let px = 0; px < TILE; px++, i += 4) {
          const ch = line[px]
          const c = ch === ' ' ? fallback : TILE_PALETTE[ch] ? colour(ch) : t.water ? base : fallback
          d[i] = c[0]
          d[i + 1] = c[1]
          d[i + 2] = c[2]
          d[i + 3] = 255
        }
      }
    }
  }
  // The coastline, inked last so it sits over whatever the tiles put down.
  // Land keeps the line rather than water, which is how it is drawn on paper:
  // the shore belongs to the land.
  const ink = rgb(COAST_INK)
  const put = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const i = (y * W + x) * 4
    d[i] = ink[0]
    d[i + 1] = ink[1]
    d[i + 2] = ink[2]
  }
  for (let cy = 0; cy < SYDNEY.h; cy++) {
    for (let cx = 0; cx < SYDNEY.w; cx++) {
      if (TERRAIN[SYDNEY.rows[cy][cx]]?.water) continue
      const wet = (dx, dy) => TERRAIN[SYDNEY.rows[cy + dy]?.[cx + dx]]?.water
      const x0 = cx * TILE
      const y0 = cy * TILE
      for (let k = 0; k < TILE; k++) {
        if (wet(0, -1)) put(x0 + k, y0)
        if (wet(0, 1)) put(x0 + k, y0 + TILE - 1)
        if (wet(-1, 0)) put(x0, y0 + k)
        if (wet(1, 0)) put(x0 + TILE - 1, y0 + k)
      }
    }
  }

  ctx.putImageData(img, 0, 0)
  return cv
}

/** A dash of catchlight on the water, at a cell that will show it. Sampled once
 *  — the animation only decides which ones are lit this frame. */
function catchlights() {
  const out = []
  for (let cy = 0; cy < SYDNEY.h; cy++) {
    const row = SYDNEY.rows[cy]
    for (let cx = 0; cx < SYDNEY.w; cx++) {
      const t = TERRAIN[row[cx]]
      if (!t?.water) continue
      const h = (cx * 73856093) ^ (cy * 19349663)
      if ((h >>> 3) % 5) continue
      out.push({
        x: cx * TILE + ((h >>> 5) % 5),
        y: cy * TILE + ((h >>> 9) % 7),
        len: 2 + ((h >>> 13) % 3),
        phase: (h >>> 17) % 8,
        shore: isShore(cx, cy),
      })
    }
  }
  return out
}

export default function SydneyMap({ revealed, fogged = true, animate = true, className = '', style }) {
  const ref = useRef(null)
  const base = useMemo(paintBase, [])
  const lights = useMemo(catchlights, [])

  /** Fog is drawn small and scaled up smooth, so the edge of the known world is
   *  a soft front rather than a staircase of squares. */
  const fog = useMemo(() => {
    if (!fogged) return null
    const cv = document.createElement('canvas')
    cv.width = SYDNEY.w
    cv.height = SYDNEY.h
    const ctx = cv.getContext('2d')
    const img = ctx.createImageData(SYDNEY.w, SYDNEY.h)
    for (let y = 0; y < SYDNEY.h; y++) {
      for (let x = 0; x < SYDNEY.w; x++) {
        const i = (y * SYDNEY.w + x) * 4
        img.data[i] = 26
        img.data[i + 1] = 18
        img.data[i + 2] = 30
        // Night, not a blackout: unwalked ground keeps its colour and its shape,
        // which is the difference between a map and a scratch card.
        img.data[i + 3] = revealed?.has(key(x, y)) ? 0 : 84
      }
    }
    ctx.putImageData(img, 0, 0)
    return cv
  }, [revealed, fogged])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let frame = 0
    let raf = 0
    let last = 0

    const draw = () => {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(base, 0, 0)

      ctx.fillStyle = '#cfeaf8'
      for (const s of lights) {
        const lit = (s.phase + frame) % 8
        if (lit > (s.shore ? 2 : 1)) continue
        ctx.globalAlpha = s.shore ? 0.85 : 0.5
        ctx.fillRect(s.x + (lit ? 1 : 0), s.y, s.len, 1)
      }
      ctx.globalAlpha = 1

      if (fog) {
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(fog, 0, 0, W, H)
      }
    }

    // Water moves at a walking pace, not a frame rate. Eight redraws a second
    // is plenty and costs nothing on a phone.
    const tick = (t) => {
      if (t - last > 125) {
        last = t
        frame++
        draw()
      }
      raf = requestAnimationFrame(tick)
    }

    draw()
    // Water that shimmers is charm; water that shimmers at someone who gets
    // motion sick is not. Ask first.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (animate && !still) raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [base, lights, fog, animate])

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={`block ${className}`}
      style={style}
      role="img"
      aria-label="Map of Sydney Harbour"
    />
  )
}

export { W as MAP_PX_W, H as MAP_PX_H }
