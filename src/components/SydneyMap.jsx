import { useEffect, useMemo, useRef } from 'react'
import { SYDNEY, TERRAIN_COLOURS } from '../game/sydney'
import { key } from '../game/mapgrid'

/**
 * The map, painted a cell at a time. Terrain is baked at build time so this is
 * a straight lookup — no geometry at runtime, which is what keeps it smooth
 * while panning on a phone.
 */
export default function SydneyMap({ revealed, fogged = true, className = '', style }) {
  const ref = useRef(null)
  const { w, h, rows } = SYDNEY

  const base = useMemo(() => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) {
      const row = rows[y]
      for (let x = 0; x < w; x++) {
        const hex = TERRAIN_COLOURS[row[x]] ?? '#000000'
        const i = (y * w + x) * 4
        data[i] = parseInt(hex.slice(1, 3), 16)
        data[i + 1] = parseInt(hex.slice(3, 5), 16)
        data[i + 2] = parseInt(hex.slice(5, 7), 16)
        data[i + 3] = 255
      }
    }
    return data
  }, [w, h, rows])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.imageSmoothingEnabled = false
    const img = ctx.createImageData(w, h)
    img.data.set(base)

    if (fogged && revealed) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (revealed.has(key(x, y))) continue
          const i = (y * w + x) * 4
          // Night, not a blackout. Unwalked ground stays readable enough to
          // aim at — that is the difference between a map and a scratch card.
          img.data[i] = Math.round(img.data[i] * 0.22 + 14 * 0.78)
          img.data[i + 1] = Math.round(img.data[i + 1] * 0.22 + 12 * 0.78)
          img.data[i + 2] = Math.round(img.data[i + 2] * 0.22 + 34 * 0.78)
        }
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [base, revealed, fogged, w, h])

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={`pixelated block ${className}`}
      style={{ imageRendering: 'pixelated', ...style }}
      role="img"
      aria-label="Pixel map of Sydney Harbour"
    />
  )
}
