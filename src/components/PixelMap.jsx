import { useEffect, useMemo, useRef } from 'react'
import { CITY } from '../game/city'
import { projector } from '../game/mapgeo'

/**
 * The city, drawn rather than photographed.
 *
 * Map tiles are pictures of maps — run a filter over one and it looks like a
 * filter. This takes the raw road geometry and paints it onto a small canvas at
 * the game's own resolution, so the streets are real but the drawing is ours.
 */

// Explored ground has to read as lit, so the base palette is bright and the fog
// does the darkening. The other way round — dim streets, light fog — leaves the
// whole map a smudge whichever side of the fog you are on.
const PALETTE = {
  ground: '#1c1738',
  water: '#20558c',
  waterLit: '#2a6ba8',
  park: '#2f6b40',
  parkLit: '#3c8552',
  street: '#7c74b8',
  streetLit: '#a49bdc',
  bridge: '#c8bfe8',
  rail: '#8a72c0',
  landmark: '#b08fd8',
  route: '#4ade80',
  routeHot: '#eafff2',
}

function fillRing(ctx, pts, colour) {
  ctx.fillStyle = colour
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fill()
}

function stroke(ctx, pts, colour, width) {
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.stroke()
}

/**
 * `revealed` is a Set of "x,y" cells the player has actually been to. Anything
 * not in it is painted over with fog — the city is something you uncover by
 * going there, not a readout you are handed.
 */
export default function PixelMap({
  width = 176,
  height = 232,
  revealed,
  route = [],
  live = null,
  fogged = true,
  className = '',
}) {
  const ref = useRef(null)
  const project = useMemo(() => projector(CITY.bbox, width, height), [width, height])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.imageSmoothingEnabled = false

    ctx.fillStyle = PALETTE.ground
    ctx.fillRect(0, 0, width, height)

    for (const a of CITY.areas) {
      const pts = a.coords.map(project)
      const base = a.kind === 'water' ? PALETTE.water : a.kind === 'park' ? PALETTE.park : PALETTE.landmark
      fillRing(ctx, pts, base)
      if (a.kind !== 'landmark') {
        // a lit top edge, the same trick the sprites use for volume
        ctx.save()
        ctx.beginPath()
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.closePath()
        ctx.clip()
        fillRing(ctx, pts.map(([x, y]) => [x, y - 2]), a.kind === 'water' ? PALETTE.waterLit : PALETTE.parkLit)
        ctx.restore()
      }
    }

    for (const way of CITY.ways) {
      const pts = way.coords.map(project)
      const colour =
        way.kind === 'bridge' ? PALETTE.bridge
          : way.kind === 'rail' ? PALETTE.rail
          : way.kind === 'lane' ? PALETTE.ground
          : PALETTE.street
      if (way.kind === 'lane') {
        stroke(ctx, pts, PALETTE.street, 1)
        continue
      }
      stroke(ctx, pts, colour, way.width + 1)
      if (way.width > 1) stroke(ctx, pts, PALETTE.streetLit, Math.max(1, way.width - 1))
    }

    if (fogged && revealed) {
      const img = ctx.getImageData(0, 0, width, height)
      const fog = [11, 7, 21]
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (revealed.has(`${x},${y}`)) continue
          const i = (y * width + x) * 4
          // Not a flat blackout: a hint of what is under there keeps the
          // unexplored city legible enough to aim at.
          img.data[i] = Math.round(img.data[i] * 0.14 + fog[0] * 0.86)
          img.data[i + 1] = Math.round(img.data[i + 1] * 0.14 + fog[1] * 0.86)
          img.data[i + 2] = Math.round(img.data[i + 2] * 0.14 + fog[2] * 0.86)
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    if (route.length > 1) {
      stroke(ctx, route.map(project), PALETTE.route, 2)
    }

    if (live) {
      const [x, y] = project(live)
      ctx.fillStyle = PALETTE.routeHot
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3)
      ctx.fillStyle = PALETTE.route
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 1)
      ctx.fillRect(Math.round(x) - 2, Math.round(y) + 2, 5, 1)
    }
  }, [project, revealed, route, live, fogged, width, height])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={`pixelated w-full h-auto ${className}`}
      style={{ imageRendering: 'pixelated' }}
      role="img"
      aria-label={`Pixel map of ${CITY.name}`}
    />
  )
}
