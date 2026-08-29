import { useEffect, useMemo, useRef } from 'react'
import { OVERVIEW, OVER_H, OVER_PX, OVER_TILE, OVER_W, isWater } from '../game/overview'

/**
 * Sydney as one picture.
 *
 * Every tile here is drawn to be read at 450 metres a cell, so a forest is a
 * canopy you can see and a suburb is a roof you can count. That is the whole
 * difference from the detailed map, which draws the same ground at 100 metres
 * and disappears the moment it is scaled down to fit a phone.
 */
const PAL = {
  '.': '#e2d1a0', // open ground
  ':': '#f0e3bc',
  ',': '#cfbe8f', // scrubby ground
  o: '#4a3a24', // ink
  // canopy
  c: '#3f8a30',
  C: '#5cb043',
  v: '#27601d',
  n: '#6b4423', // trunk
  // roofs
  f: '#cf5b41',
  F: '#94382a',
  g: '#5f86b0',
  G: '#3d5c80',
  w: '#efe4cc',
  // ground you walk on
  Y: '#e8933c',
  s: '#f7e8bc',
  S: '#e5d2a2',
  k: '#b3a38a',
  K: '#8f8069',
  // water
  d: '#2874b3',
  D: '#1f5e95',
  a: '#5cb6e2',
  A: '#7fcdf0',
  W: '#dcf2fc',
}

const T = {
  // Open ground, hatched the way a drawn map textures its paper.
  '.': [
    ['.:..:..:', '........', ':..:..:.', '........', '..:..:..', '........', ':..:..:.', '........'],
    ['..:..:..', '........', '.:..:..:', '........', ':..:..:.', '........', '..:..:..', '........'],
  ],
  // Scrub — ground on its way to being forest.
  ',': [
    ['..,.....', '.,,,....', '..,..:..', '........', '.....,..', '....,,,.', '.....,..', '.:..:...'],
    ['.....,..', '....,,,.', '.....,..', '..:..:..', '..,.....', '.,,,....', '..,.....', '...:..:.'],
  ],
  // A wood: two canopies, lit from the top left, with trunks under them.
  t: [
    ['.CCc..CC', 'CCCccCCC', 'CCcccccv', '.cnnccv.', '..nn.nn.', '.CCc.nn.', 'CCCccv..', '.cnnv...'],
    ['CC..CCc.', 'CCcCCCcc', 'ccvcccvv', '.nn.cnn.', 'CCc..nn.', 'CCcccv..', 'ccnnv...', '..nn....'],
  ],
  // A suburb: roofs with a wall under each, close enough to read as a town.
  b: [
    ['..ff....', '.fFFF...', 'fwwwwo..', '.wwww...', '....gggg', '...gGGGg', '...wwwww', '....wwww'],
    ['....ff..', '...fFFF.', '..fwwwwo', '...wwww.', 'gggg....', 'gGGGg...', 'wwwww...', 'wwww....'],
  ],
  // An arterial, solid so cells join into one ribbon.
  R: [['YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY']],
  s: [['ssssssss', 'sSssssss', 'ssssSsss', 'ssssssss', 'sssSssSs', 'ssssssss', 'sSssssss', 'ssssssss']],
  k: [['kkkKkkkk', 'kkKKkkKk', 'kKkkkKKk', 'kkkkkkkk', 'kkKkkkkk', 'kKKkkKkk', 'kkkkKKkk', 'kkkkkkkk']],
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
          const c = colour(line[px] === '.' && ch !== '.' ? (isWater(ch) ? (ch === '~' ? 'd' : 'a') : '.') : line[px])
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
