/**
 * Ground you have covered, anywhere on earth.
 *
 * The old version of this was a grid laid over one hand-drawn square of Sydney,
 * which meant it only meant anything if you happened to live there. This is the
 * same idea on the real world: the map is divided into the same square tiles a
 * street map is already cut into, and walking through one lights it up forever.
 *
 * Zoom 16 is the size that felt right — about half a kilometre a side, so a
 * short walk lights a couple of blocks and a long run draws a line of them.
 */

const Z = 16
const N = 2 ** Z
/** Metres round the equator, for turning tiles back into an area. */
const CIRCUMFERENCE = 40075016.686

/** The tile a coordinate falls in. Standard slippy-map maths, same as the tiles. */
export function tileOf(lon, lat) {
  const rad = (lat * Math.PI) / 180
  const x = Math.floor(((lon + 180) / 360) * N)
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * N)
  return [x, y]
}

export const key = (x, y) => `${x},${y}`

const lonAt = (x) => (x / N) * 360 - 180
const latAt = (y) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / N))) * 180) / Math.PI

/** South-west and north-east corners, the way Leaflet wants them. */
export function tileBounds(k) {
  const [x, y] = k.split(',').map(Number)
  return [
    [latAt(y + 1), lonAt(x)],
    [latAt(y), lonAt(x + 1)],
  ]
}

/** Adds every tile a run of `{ lat, lon }` fixes passes through. */
export function coverPoints(set, points) {
  for (const p of points) {
    if (typeof p?.lon !== 'number' || typeof p?.lat !== 'number') continue
    set.add(key(...tileOf(p.lon, p.lat)))
  }
  return set
}

/**
 * How much ground that is, in square kilometres. A tile is square on the map
 * but not on the ground — the further from the equator, the narrower it gets —
 * so each one is measured where it actually sits.
 */
export function areaKm2(cells) {
  let m2 = 0
  for (const k of cells) {
    const [, y] = k.split(',').map(Number)
    const lat = (latAt(y) + latAt(y + 1)) / 2
    const side = (CIRCUMFERENCE * Math.cos((lat * Math.PI) / 180)) / N
    m2 += side * side
  }
  return m2 / 1e6
}

/**
 * The tiles, merged into as few rectangles as possible: consecutive tiles in a
 * row become one box. It keeps the map cheap when someone has a year of walking
 * behind them, and it removes the hairlines that show up between neighbouring
 * fills.
 */
export function groundRuns(cells) {
  const rows = new Map()
  for (const k of cells) {
    const [x, y] = k.split(',').map(Number)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y).push(x)
  }
  const out = []
  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b)
    let from = xs[0]
    let prev = xs[0]
    for (let i = 1; i <= xs.length; i++) {
      if (xs[i] === prev + 1) {
        prev = xs[i]
        continue
      }
      out.push([
        [latAt(y + 1), lonAt(from)],
        [latAt(y), lonAt(prev + 1)],
      ])
      from = prev = xs[i]
    }
  }
  return out
}
