import { useEffect, useMemo, useRef } from 'react'
import { BOATS, LANDMARKS, OVERVIEW, OVER_H, OVER_PX, OVER_TILE, OVER_W, isWater, overCell } from '../game/overview'

/**
 * Sydney as one picture.
 *
 * Every tile here is drawn to be read at 450 metres a cell, so a forest is a
 * canopy you can see and a suburb is a roof you can count. That is the whole
 * difference from the detailed map, which draws the same ground at 100 metres
 * and disappears the moment it is scaled down to fit a phone.
 */
const PAL = {
  // Wilderness is grass; the dry ground belongs to the places people live. That
  // is how the reference reads — villages sit on worn earth with green all
  // around them — and it happens to be true of Sydney too.
  '.': '#6ea63f', // grassland
  ':': '#82bd4d',
  ',': '#5a8c33', // rough grass
  u: '#d9c79a', // trodden ground, around a settlement
  U: '#c4b184',
  o: '#31261a', // ink
  // canopy, dark enough that a wood reads against the grass
  c: '#2f6b24',
  C: '#3f8a30',
  v: '#1d4715',
  n: '#5a3b22', // trunk
  // roofs
  f: '#cf5b41',
  F: '#94382a',
  g: '#5f86b0',
  G: '#3d5c80',
  w: '#efe4cc',
  // ground you walk on
  Y: '#e0a24c', // arterials
  y: '#f2c37e', // the crown of the road
  r: '#e0c48d', // the road surface
  e: '#4a3a24', // and the line drawn round it
  s: '#f2e2b4', // sand
  S: '#ddcb9c',
  // stone: a headland has a lit face and a shaded one, which is the whole of
  // how relief is drawn
  k: '#a89e90',
  K: '#7d7468',
  L: '#cdc5b8', // catching the light
  // water
  d: '#2874b3',
  D: '#1f5e95',
  a: '#5cb6e2',
  A: '#7fcdf0',
  W: '#dcf2fc',
}

/** What fills a cell before its tile is stamped. */
const BASE = { b: 'u', R: 'Y', s: 's', k: '.', h: '.', '~': 'd', '-': 'a' }

const T = {
  // Open ground, hatched the way a drawn map textures its paper.
  '.': [
    ['..:..:..', '.:......', '.....:..', '..,.....', '......,.', '.:...:..', '...,....', '.....:..'],
    ['.:...:..', '....:...', '..,.....', '.....,..', '.:......', '......:.', '..:..,..', '........'],
  ],
  // Scrub — ground on its way to being forest.
  ',': [
    ['..,.....', '.,,,....', '..,..:..', '..c.....', '.....,..', '....,,,.', '.....,..', '.:..c...'],
    ['.....,..', '....,,,.', '.....,..', '..:..c..', '..,.....', '.,,,....', '..,.....', '...c..:.'],
  ],
  // A wood: two canopies, lit from the top left, with trunks under them.
  // Trees are round and outlined here, not spiky — the whole reference is
  // drawn that way, and an outline is what stops a wood becoming a green smear.
  t: [
    ['..ooo..o', '.oCCCo.o', 'oCCcccoo', 'oCcccvoo', '.occvo.o', '..ono...', '..ono.oo', '..ooo.oo'],
    ['o..ooo..', 'o.oCCCo.', 'ooCCccco', 'ooCcccvo', 'o.occvo.', '...ono..', 'oo.ono..', 'oo.ooo..'],
  ],
  h: [
    ['...oo...', '..oLLo..', '.oLLLko.', 'oLLLkkko', 'oLLkkkKo', 'oLkkkKKo', 'okkkKKKo', '.oooooo.'],
    ['..oo....', '.oLLo...', 'oLLLko.o', 'oLLkkkoo', 'oLkkkKoo', 'okkkKKo.', 'okkKKKo.', '.ooooo..'],
  ],
  // A suburb: roofs with a wall under each, close enough to read as a town.
  b: [
    ['uffuuggu', 'fFFFgGGG', 'wwwwwwww', 'uwwuuwwu', 'uUuuffuu', 'ucufFFFu', 'uuuwwwwu', 'ucuuwwuu'],
    ['uggufffu', 'gGGGfFFF', 'wwwwwwww', 'uwwuuwwu', 'ffuuUuuc', 'FFFFuuuu', 'wwwwuuuu', 'uwwuucuu'],
    ['uuffuuuu', 'ufFFFucu', 'ufwwwwuu', 'uuwwuuuu', 'uggguuff', 'gGGGufFF', 'wwwwuwww', 'uwwuuwwu'],
  ],
  // An arterial, solid so cells join into one ribbon.
  R: [
    ['eeeeeeee', 'YYYYYYYY', 'YYYYYYYY', 'yyyyyyyy', 'YYYYYYYY', 'YYYYYYYY', 'eeeeeeee', 'uuuuuuuu'],
    ['euuuuuue', 'eYYYYYYe', 'eYYYYYYe', 'eyyyyyye', 'eYYYYYYe', 'eYYYYYYe', 'eYYYYYYe', 'euuuuuue'],
  ],
  s: [['ssssssss', 'sSssssss', 'ssssSsss', 'ssssssss', 'sssSssSs', 'ssssssss', 'sSssssss', 'ssssssss']],
  k: [
    ['..oooo..', '.oLLLLo.', 'oLLLkkko', 'oLLkkkKo', 'oLkkkKKo', 'okkkKKKo', 'okkKKKKo', '.oooooo.'],
    ['.oooo...', 'oLLLLo..', 'oLLkkko.', 'oLkkkKoo', 'okkkKKo.', 'okkKKKo.', 'okKKKKo.', '.ooooo..'],
  ],
  // Open water, with the wave marks every drawn sea has.
  '~': [
    ['dddddddd', 'ddWWdddd', 'dddddddd', 'ddddddDd', 'dddddddd', 'dDdddddd', 'ddddWWdd', 'dddddddd'],
    ['dddddddd', 'dddddDdd', 'dddddddd', 'dWWddddd', 'dddddddd', 'ddddddWW', 'dddddddd', 'ddDddddd'],
  ],
  '-': [
    ['aaaaaaaa', 'aaWWaaaa', 'aaaaaaaa', 'aaaaaAAa', 'aaaaaaaa', 'aWWaaaaa', 'aaaaaaaa', 'aaaaWWaa'],
    ['aaaaaaaa', 'aaaaWWaa', 'aAAaaaaa', 'aaaaaaaa', 'aaWWaaaa', 'aaaaaaaa', 'aaaaaAAa', 'aaaaaaaa'],
  ],
}

/**
 * Drawn on top of the terrain, in place. Each one is the thing itself rather
 * than a pin pointing at it — the Bridge is an arch over the water, the Opera
 * House is three sails, and the boats are boats.
 */
const ART = {
  // Bigger than a cell on purpose. These are the two things on the whole map
  // that say Sydney without a caption, so they are drawn to be seen.
  bridge: {
    w: 19,
    h: 9,
    pal: { o: '#2f343a', x: '#dbe3ea', X: '#8e99a3' },
    grid: [
      '......ooooooo......',
      '....ooxxxxxxxoo....',
      '..oox.........xoo..',
      '.ox.............xo.',
      'ox...............xo',
      'xxxxxxxxxxxxxxxxxxx',
      'XXXXXXXXXXXXXXXXXXX',
      '.oXo...oXo...oXo...',
      '.oXo...oXo...oXo...',
    ],
  },
  sails: {
    w: 15,
    h: 9,
    pal: { o: '#2f343a', m: '#ffffff', M: '#c9c4b0' },
    grid: [
      '.......o.......',
      '.....o.mo......',
      '....om.mmo.o...',
      '...omm.mmmomo..',
      '..ommm.mmmmmmo.',
      '.ommmm.mmmmmmmo',
      'ommmmmmmmmmmmmm',
      'MMMMMMMMMMMMMMM',
      'ooooooooooooooo',
    ],
  },
  lighthouse: {
    w: 5,
    h: 9,
    pal: { o: '#3a2c18', y: '#ffe066', w: '#f4efe0', W: '#c9553d' },
    grid: ['.ooo.', 'oyyyo', '.ooo.', '.owo.', '.oWo.', '.owo.', '.oWo.', 'oowoo', 'ooooo'],
  },
  boat: {
    w: 7,
    h: 6,
    pal: { o: '#3a2c18', s: '#f4efe0', h: '#8a5a2b', H: '#5c3a19' },
    grid: ['..o....', '..oss..', '..osss.', '..o....', 'ohhhhho', '.oHHHo.'],
  },
}

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]

function paint() {
  const cv = document.createElement('canvas')
  cv.width = OVER_PX
  cv.height = OVER_H * OVER_TILE
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(cv.width, cv.height)
  const d = img.data
  const cache = new Map()
  const colour = (ch) => {
    let c = cache.get(ch)
    if (!c) {
      c = rgb(PAL[ch] ?? '#ff00ff')
      cache.set(ch, c)
    }
    return c
  }

  for (let cy = 0; cy < OVER_H; cy++) {
    for (let cx = 0; cx < OVER_W; cx++) {
      const ch = OVERVIEW[cy][cx]
      const cuts = T[ch] ?? T['.']
      const tile = cuts[((cx * 7 + cy * 13) >>> 0) % cuts.length]
      for (let py = 0; py < OVER_TILE; py++) {
        const line = tile[py]
        let i = ((cy * OVER_TILE + py) * cv.width + cx * OVER_TILE) * 4
        for (let px = 0; px < OVER_TILE; px++, i += 4) {
          const c = colour(line[px] === '.' && ch !== '.' ? (BASE[ch] ?? '.') : line[px])
          d[i] = c[0]
          d[i + 1] = c[1]
          d[i + 2] = c[2]
          d[i + 3] = 255
        }
      }
    }
  }

  // The coastline, inked last and given to the land, the way it is drawn on
  // paper. At this scale it is what holds the whole picture together.
  const ink = rgb(PAL.o)
  const put = (x, y) => {
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return
    const i = (y * cv.width + x) * 4
    d[i] = ink[0]
    d[i + 1] = ink[1]
    d[i + 2] = ink[2]
  }
  for (let cy = 0; cy < OVER_H; cy++) {
    for (let cx = 0; cx < OVER_W; cx++) {
      if (isWater(OVERVIEW[cy][cx])) continue
      const wet = (dx, dy) => isWater(OVERVIEW[cy + dy]?.[cx + dx] ?? '~')
      const x0 = cx * OVER_TILE
      const y0 = cy * OVER_TILE
      for (let k = 0; k < OVER_TILE; k++) {
        if (wet(0, -1)) put(x0 + k, y0)
        if (wet(0, 1)) put(x0 + k, y0 + OVER_TILE - 1)
        if (wet(-1, 0)) put(x0, y0 + k)
        if (wet(1, 0)) put(x0 + OVER_TILE - 1, y0 + k)
      }
    }
  }

  // Landmarks and boats, stamped over the finished ground.
  const stamp = (art, cxCells, cyCells) => {
    const ox = Math.round(cxCells * OVER_TILE - art.w / 2)
    const oy = Math.round(cyCells * OVER_TILE - art.h / 2)
    for (let y = 0; y < art.h; y++) {
      for (let x = 0; x < art.w; x++) {
        const ch = art.grid[y][x]
        if (ch === '.') continue
        const px = ox + x
        const py = oy + y
        if (px < 0 || py < 0 || px >= cv.width || py >= cv.height) continue
        const c = rgb(art.pal[ch])
        const i = (py * cv.width + px) * 4
        d[i] = c[0]
        d[i + 1] = c[1]
        d[i + 2] = c[2]
      }
    }
  }
  for (const l of LANDMARKS) {
    const [x, y] = overCell(l.at[0], l.at[1])
    stamp(ART[l.sprite], x + (l.dx ?? 0), y + (l.dy ?? 0))
  }
  for (const b of BOATS) {
    const [x, y] = overCell(b[0], b[1])
    // At 450 metres a cell a point that is water on the fine grid can land on
    // a coarse cell that is not. A boat aground is worse than no boat.
    if (!isWater(OVERVIEW[Math.floor(y)]?.[Math.floor(x)] ?? '.')) continue
    stamp(ART.boat, x, y)
  }

  ctx.putImageData(img, 0, 0)
  return cv
}

export default function OverviewMap({ className = '', style }) {
  const ref = useRef(null)
  const art = useMemo(paint, [])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(art, 0, 0)
  }, [art])

  return (
    <canvas
      ref={ref}
      width={OVER_PX}
      height={OVER_H * OVER_TILE}
      className={`block w-full h-auto ${className}`}
      style={{ imageRendering: 'pixelated', ...style }}
      role="img"
      aria-label="Map of Sydney"
    />
  )
}
