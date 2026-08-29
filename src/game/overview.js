// The map you see before you open it.
//
// The detailed map is 180x180 cells of eight-pixel tiles — 1440 pixels square —
// and the tab shows it about 340 across. Every tree, roof and street is thrown
// away by that reduction, which is why it read as noise: the art was never
// being seen. Detail does not survive a quarter-scale, so this is a second,
// coarser drawing built for the size it is actually looked at.
//
// Forty cells across, 450 metres each, drawn at eight pixels a cell: a poster
// of Sydney where a forest is a forest and a suburb is a cluster of roofs,
// the way a fantasy world map is drawn.

import { SYDNEY } from './sydney'

export const OVER_W = 40
export const OVER_H = 40
export const OVER_TILE = 8

export const OVER_PX = OVER_W * OVER_TILE

const WATER = '~-'
const FOREST = 'tTp'
const TOWN = 'bB'
const SAND = 's'
const ROCK = 'k'
const MAJOR = 'R'

/**
 * One coarse cell from the block of fine cells under it — by what the block is
 * mostly made of, not by an average. Averaging terrain gives you mud.
 */
function classify(counts, total) {
  const share = (k) => (counts[k] ?? 0) / total
  // A block has to be properly wet to become water. At 450 metres a cell a
  // low threshold drowns whole suburbs on the strength of one creek.
  if (share('water') >= 0.58) return share('deep') > share('shallow') ? '~' : '-'
  if (share('sand') >= 0.22) return 's'
  if (share('major') >= 0.16) return 'R'
  if (share('forest') >= 0.42) return 't'
  if (share('rock') >= 0.18) return 'k'
  if (share('town') >= 0.34) return 'b'
  if (share('rock') >= 0.3) return 'k'
  if (share('forest') >= 0.22) return ','
  return '.'
}

/** Built once. The fine grid never changes, so neither does this. */
export const OVERVIEW = (() => {
  const rows = []
  for (let oy = 0; oy < OVER_H; oy++) {
    let row = ''
    for (let ox = 0; ox < OVER_W; ox++) {
      const x0 = Math.floor((ox * SYDNEY.w) / OVER_W)
      const x1 = Math.floor(((ox + 1) * SYDNEY.w) / OVER_W)
      const y0 = Math.floor((oy * SYDNEY.h) / OVER_H)
      const y1 = Math.floor(((oy + 1) * SYDNEY.h) / OVER_H)
      const counts = {}
      let total = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const ch = SYDNEY.rows[y][x]
          total++
          if (WATER.includes(ch)) {
            counts.water = (counts.water ?? 0) + 1
            counts[ch === '~' ? 'deep' : 'shallow'] = (counts[ch === '~' ? 'deep' : 'shallow'] ?? 0) + 1
          } else if (FOREST.includes(ch)) counts.forest = (counts.forest ?? 0) + 1
          else if (TOWN.includes(ch)) counts.town = (counts.town ?? 0) + 1
          else if (ch === SAND) counts.sand = (counts.sand ?? 0) + 1
          else if (ch === ROCK) counts.rock = (counts.rock ?? 0) + 1
          if (ch === MAJOR) counts.major = (counts.major ?? 0) + 1
        }
      }
      let ch = classify(counts, Math.max(1, total))
      // Scatter high ground through the bush. Sydney's north shore and its
      // eastern headlands are hills, and a wood with a hill in it reads as
      // country rather than as a green rectangle.
      if (ch === 't' && ((ox * 73856093) ^ (oy * 19349663)) % 5 === 0) ch = 'h'
      row += ch
    }
    rows.push(row)
  }
  return rows
})()

export const isWater = (ch) => ch === '~' || ch === '-'

/** Where a place sits on the coarse grid. */
export function overCell(lon, lat) {
  const [w, s, e, n] = SYDNEY.bbox
  return [((lon - w) / (e - w)) * OVER_W, ((n - lat) / (n - s)) * OVER_H]
}

/**
 * The things you would draw on a map of Sydney if you were drawing one by hand.
 *
 * A map made only of terrain is a survey. What makes the reference this is
 * drawn from feel like somewhere are its castles and its ships — so this one
 * gets the Bridge, the sails, the lighthouse on South Head, and boats out on
 * the water where boats actually are.
 */
export const LANDMARKS = [
  // A cell is 450 metres and the Bridge and the Opera House are 400 apart, so
  // they are nudged off each other rather than drawn on top of one another.
  { at: [151.2112, -33.8523], sprite: 'bridge', dy: -0.7 },
  { at: [151.2153, -33.8568], sprite: 'sails', dx: 2.1, dy: 0.2 },
  { at: [151.2853, -33.8367], sprite: 'lighthouse' },
]

export const BOATS = [
  [151.2480, -33.8540],
  [151.2660, -33.8330],
  [151.2020, -33.8480],
  [151.2340, -33.8560],
  [151.1560, -33.8380],
  [151.2760, -33.8100],
  // out on the Pacific, where the map would otherwise be an empty blue field
  [151.3020, -33.8700],
  [151.2980, -33.8020],
  [151.3040, -33.9000],
  [151.3080, -33.8380],
  [151.2960, -33.8560],
  [151.3100, -33.7800],
  [151.2900, -33.9130],
]

/**
 * The road network, as links between places.
 *
 * The reference draws its roads as one connected system with square corners,
 * and that is what turns a set of towns into a country you could travel. The
 * terrain pass already lays down arterials, but at 450 metres a cell they come
 * out as patches; drawn between named places instead, they join up.
 */
export const ROUTES = [
  ['cbd', 'quay'],
  ['quay', 'bridge'],
  ['bridge', 'northsyd'],
  ['northsyd', 'chatswood'],
  ['chatswood', 'willoughby'],
  ['northsyd', 'cremorne'],
  ['cremorne', 'mosman'],
  ['mosman', 'balmoral'],
  ['balmoral', 'manly'],
  ['manly', 'freshwater'],
  ['mosman', 'taronga'],
  ['cbd', 'surry'],
  ['surry', 'paddington'],
  ['paddington', 'bondi'],
  ['bondi', 'bronte'],
  ['bronte', 'coogee'],
  ['surry', 'randwick'],
  ['randwick', 'coogee'],
  ['cbd', 'darling'],
  ['darling', 'glebe'],
  ['glebe', 'newtown'],
  ['newtown', 'leichhardt'],
  ['leichhardt', 'balmain'],
  ['leichhardt', 'gladesville'],
  ['gladesville', 'homebush'],
  ['cbd', 'hyde'],
  ['hyde', 'domain'],
  ['domain', 'doublebay'],
  ['doublebay', 'rose'],
  ['rose', 'vaucluse'],
  ['vaucluse', 'watsons'],
]

/** Route ends, resolved to coarse-grid points. Unknown ids drop out. */
export function routeLines() {
  const at = (id) => {
    const p = SYDNEY.places.find((q) => q.id === id)
    return p ? overCell(p.lon, p.lat) : null
  }
  return ROUTES.map(([a, b]) => [at(a), at(b)]).filter(([a, b]) => a && b)
}
