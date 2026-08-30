import { useEffect, useRef } from 'react'

/**
 * The landscape behind the title card: sky, weather, three ranges of hills, a
 * pine line, a field with a track running up it and one big tree in the near
 * corner. It is painted, not photographed — every colour is a flat block and
 * every edge lands on the art grid, so it holds up next to the sprites.
 *
 * Three canvases are painted once per size and composited every frame: the sky
 * never moves, the clouds slide and wrap, the land sits on top. Only the blit
 * happens per frame, so this costs almost nothing while it is on screen.
 */

const SCALE = 4 // device pixels per art pixel

const C = {
  cloud: '#ffffff',
  cloudLit: '#e8f2ff',
  cloudShade: '#b9d2ee',
  farLit: '#93c294',
  far: '#6fa87b',
  farDark: '#5b8f68',
  midLit: '#63b45e',
  mid: '#3f9147',
  midDark: '#2e763a',
  nearLit: '#48a247',
  near: '#2a7c33',
  nearDark: '#1c5f27',
  pine: '#1d5c31',
  pineLit: '#2a7a3f',
  pineDark: '#12401f',
  grass: '#5cb741',
  grassLit: '#7ed158',
  grassDark: '#3d8c2f',
  dirt: '#d09a55',
  dirtLit: '#e5b775',
  dirtDark: '#a9743a',
  bark: '#5b3a26',
  barkLit: '#7d5334',
  barkDark: '#3a2416',
  leafDark: '#1f5f2c',
  leaf: '#2f8038',
  leafLit: '#48a349',
  leafHot: '#65bf5c',
}

/** Deterministic noise, so the scene is the same every time it opens. */
function rand(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const lerp = (a, b, t) => a + (b - a) * t
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`

// Deep at the top, washing out to haze at the skyline.
const SKY = [
  [0, [40, 96, 190]],
  [0.34, [64, 128, 216]],
  [0.62, [106, 168, 232]],
  [0.85, [156, 202, 240]],
  [1, [196, 226, 246]],
]

function skyAt(t) {
  for (let i = 1; i < SKY.length; i++) {
    if (t <= SKY[i][0]) {
      const [t0, c0] = SKY[i - 1]
      const [t1, c1] = SKY[i]
      return mix(c0, c1, (t - t0) / (t1 - t0))
    }
  }
  return SKY[SKY.length - 1][1]
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function paintSky(W, H, horizon) {
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')
  // Banded rather than smooth: a gradient with no steps in it does not read as
  // pixel art, it reads as a photo behind pixel art.
  const band = 3
  for (let y = 0; y < horizon; y += band) {
    g.fillStyle = rgb(skyAt(Math.min(1, y / horizon)))
    g.fillRect(0, y, W, band)
  }
  g.fillStyle = rgb(skyAt(1))
  g.fillRect(0, horizon, W, H - horizon)
  return c
}

/** One cumulus: a stack of chunky rows, flat underneath, lumpy on top. */
function puff(g, cx, cy, w, h, r) {
  const lobes = []
  const n = 3 + ((r() * 3) | 0)
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1)
    lobes.push({
      x: cx + (t - 0.5) * w,
      y: cy - Math.sin(t * Math.PI) * h * 0.45 - r() * h * 0.2,
      rad: h * (0.42 + r() * 0.3),
    })
  }
  const draw = (dx, dy, fill) => {
    g.fillStyle = fill
    for (const l of lobes) {
      const rad = Math.max(2, Math.round(l.rad))
      for (let y = -rad; y <= rad; y++) {
        const half = Math.round(Math.sqrt(Math.max(0, rad * rad - y * y)))
        if (half <= 0) continue
        g.fillRect(Math.round(l.x - half) + dx, Math.round(l.y + y) + dy, half * 2, 1)
      }
    }
    // The flat base every drawn cloud has.
    g.fillRect(Math.round(cx - w / 2) + dx, Math.round(cy) + dy, Math.round(w), Math.max(2, Math.round(h * 0.28)))
  }
  draw(0, 2, C.cloudShade)
  draw(0, 0, C.cloud)
  draw(-1, -1, C.cloudLit)
}

function paintClouds(W, horizon, seed) {
  const c = makeCanvas(W, horizon)
  const g = c.getContext('2d')
  const r = rand(seed)
  const n = Math.max(7, Math.round(W / 13))
  for (let i = 0; i < n; i++) {
    const cx = (i + r() * 0.8) * (W / n)
    const cy = horizon * (0.10 + r() * 0.78)
    const w = 22 + r() * 34
    const h = 8 + r() * 12
    // Drawn three times so a cloud crossing the seam is whole on both sides.
    for (const off of [-W, 0, W]) puff(g, cx + off, cy, w, h, rand(seed + i * 977))
  }
  return c
}

/** The highest point of a set of triangular peaks at column x. */
function ridge(x, peaks, base) {
  let best = base
  let lit = true
  for (const p of peaks) {
    const d = Math.abs(x - p.x)
    if (d > p.w) continue
    const y = base - p.h * (1 - d / p.w)
    if (y < best) {
      best = y
      lit = x <= p.x
    }
  }
  return [best, lit]
}

function range(g, W, base, peaks, lit, body, dark) {
  for (let x = 0; x < W; x++) {
    const [top, isLit] = ridge(x, peaks, base)
    const y = Math.round(top)
    g.fillStyle = isLit ? lit : body
    g.fillRect(x, y, 1, Math.round(base) - y + 1)
    // A hard rim on the sunward edge, the way a painted range catches light.
    g.fillStyle = isLit ? lit : dark
    g.fillRect(x, y, 1, 2)
  }
}

function pine(g, x, base, h, r) {
  const w = Math.max(2, Math.round(h * 0.38))
  for (let i = 0; i < h; i++) {
    const t = i / h
    const half = Math.max(0, Math.round(w * t))
    g.fillStyle = t > 0.85 ? C.pineDark : C.pine
    g.fillRect(x - half, base - h + i, half * 2 + 1, 1)
    if (half > 0) {
      g.fillStyle = C.pineLit
      g.fillRect(x - half, base - h + i, 1, 1)
    }
  }
  g.fillStyle = C.pineDark
  g.fillRect(x, base - 1, 1, 2)
  if (r() > 0.7) {
    g.fillStyle = C.pineLit
    g.fillRect(x - 1, base - h + 2, 1, 1)
  }
}

/** The near tree: a leaning trunk, three limbs and a canopy of flat greens. */
function tree(g, x, groundY, h) {
  const r = rand(20260830)
  const topY = groundY - h
  // Trunk, drawn as a gentle S so it does not read as a post.
  for (let y = groundY; y > topY + h * 0.32; y--) {
    const t = (groundY - y) / h
    const cx = Math.round(x + Math.sin(t * 2.1) * h * 0.06)
    const w = Math.max(2, Math.round(lerp(h * 0.075, h * 0.022, t)))
    g.fillStyle = C.bark
    g.fillRect(cx - w, y, w * 2, 1)
    g.fillStyle = C.barkLit
    g.fillRect(cx - w, y, 1, 1)
    g.fillStyle = C.barkDark
    g.fillRect(cx + w - 1, y, 1, 1)
  }
  // Limbs.
  const limbs = [
    [0.42, -1, 0.30],
    [0.55, 1, 0.26],
    [0.66, -1, 0.22],
  ]
  for (const [at, dir, len] of limbs) {
    const y0 = groundY - h * at
    const steps = Math.round(h * len)
    for (let i = 0; i < steps; i++) {
      const px = Math.round(x + dir * i * 0.9)
      const py = Math.round(y0 - i * 0.75)
      g.fillStyle = C.bark
      g.fillRect(px, py, 2, 2)
      g.fillStyle = C.barkDark
      g.fillRect(px, py + 2, 2, 1)
    }
  }
  // Canopy: overlapping discs, dark first so the lighter passes read as light.
  const blobs = []
  for (let i = 0; i < 13; i++) {
    blobs.push({
      x: x + (r() - 0.38) * h * 0.62,
      y: topY + h * 0.32 * r(),
      rad: h * (0.10 + r() * 0.08),
    })
  }
  const disc = (b, dx, dy, fill, shrink) => {
    const rad = Math.max(1, Math.round(b.rad * shrink))
    g.fillStyle = fill
    for (let y = -rad; y <= rad; y++) {
      const half = Math.round(Math.sqrt(Math.max(0, rad * rad - y * y)))
      if (half <= 0) continue
      g.fillRect(Math.round(b.x - half) + dx, Math.round(b.y + y) + dy, half * 2, 1)
    }
  }
  for (const b of blobs) disc(b, 0, 0, C.leafDark, 1.16)
  for (const b of blobs) disc(b, 1, 1, C.leaf, 0.96)
  for (const b of blobs) disc(b, -2, -3, C.leafLit, 0.62)
  for (const b of blobs) disc(b, -3, -5, C.leafHot, 0.26)
}

function paintLand(W, H, horizon, seed) {
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')
  const r = rand(seed)

  const far = horizon + 3
  const mid = horizon + 8
  const near = horizon + 13

  range(
    g, W, far,
    [
      { x: W * 0.14, h: H * 0.15, w: W * 0.28 },
      { x: W * 0.48, h: H * 0.11, w: W * 0.24 },
      { x: W * 0.80, h: H * 0.20, w: W * 0.34 },
      { x: W * 1.04, h: H * 0.14, w: W * 0.26 },
    ],
    C.farLit, C.far, C.farDark,
  )
  range(
    g, W, mid,
    [
      { x: W * -0.02, h: H * 0.10, w: W * 0.24 },
      { x: W * 0.35, h: H * 0.12, w: W * 0.26 },
      { x: W * 0.68, h: H * 0.16, w: W * 0.30 },
      { x: W * 0.96, h: H * 0.10, w: W * 0.22 },
    ],
    C.midLit, C.mid, C.midDark,
  )
  range(
    g, W, near,
    [
      { x: W * 0.10, h: H * 0.07, w: W * 0.26 },
      { x: W * 0.54, h: H * 0.09, w: W * 0.32 },
      { x: W * 0.90, h: H * 0.06, w: W * 0.24 },
    ],
    C.nearLit, C.near, C.nearDark,
  )

  // The forest line, thickest where the hills come down to the field.
  for (let x = -2; x < W + 2; x += 2) {
    const h = 9 + r() * 12
    pine(g, x, near + 4, h, r)
  }

  // The field.
  const groundY = near + 4
  g.fillStyle = C.grassDark
  g.fillRect(0, groundY, W, H - groundY)
  for (let y = groundY; y < H; y++) {
    const t = (y - groundY) / Math.max(1, H - groundY)
    g.fillStyle = t > 0.55 ? C.grass : C.grassDark
    g.fillRect(0, y, W, 1)
  }
  // Tufts, thicker towards the viewer so the field has depth.
  for (let i = 0; i < W * 4; i++) {
    const y = groundY + Math.pow(r(), 0.6) * (H - groundY)
    const x = r() * W
    g.fillStyle = r() > 0.45 ? C.grassLit : C.grassDark
    g.fillRect(x | 0, y | 0, 1 + ((r() * 2) | 0), 1)
  }

  // The track: narrow at the treeline, opening out at the bottom edge.
  for (let y = groundY + 1; y < H; y++) {
    const t = (y - groundY) / Math.max(1, H - groundY)
    const cx = W * 0.55 + Math.sin(t * 2.4) * W * 0.13
    const half = Math.max(1, (1 + t * t * W * 0.09) | 0)
    g.fillStyle = C.dirtDark
    g.fillRect(Math.round(cx - half), y, half * 2, 1)
    g.fillStyle = C.dirt
    g.fillRect(Math.round(cx - half) + 1, y, Math.max(1, half * 2 - 2), 1)
    if ((y & 3) === 0) {
      g.fillStyle = C.dirtLit
      g.fillRect(Math.round(cx - half + 2 + r() * Math.max(1, half)), y, 1, 1)
    }
  }

  tree(g, Math.round(W * 0.07), H - 2, Math.round(H * 0.34))
  return c
}

export default function TitleScene({ className = '', style }) {
  const wrap = useRef(null)
  const canvas = useRef(null)

  useEffect(() => {
    const host = wrap.current
    const cv = canvas.current
    if (!host || !cv) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let layers = null
    let raf = 0
    let birds = []

    const build = () => {
      const box = host.getBoundingClientRect()
      const W = Math.max(40, Math.ceil(box.width / SCALE))
      const H = Math.max(40, Math.ceil(box.height / SCALE))
      cv.width = W
      cv.height = H
      cv.style.width = `${box.width}px`
      cv.style.height = `${box.height}px`
      const horizon = Math.round(H * 0.68)
      layers = {
        W, H, horizon,
        sky: paintSky(W, H, horizon),
        clouds: paintClouds(W, horizon, 424242),
        land: paintLand(W, H, horizon, 90210),
      }
      const r = rand(1337)
      birds = Array.from({ length: 4 }, () => ({
        x: r() * W,
        y: horizon * (0.16 + r() * 0.5),
        sp: 0.06 + r() * 0.05,
        ph: r() * 6.28,
      }))
      draw(0)
    }

    const draw = (t) => {
      const g = cv.getContext('2d')
      if (!layers || !g) return
      const { W, sky, clouds, land } = layers
      g.imageSmoothingEnabled = false
      g.drawImage(sky, 0, 0)
      const drift = still ? 0 : (t * 0.0022) % W
      g.drawImage(clouds, Math.round(-drift), 0)
      g.drawImage(clouds, Math.round(W - drift), 0)
      if (!still) {
        g.fillStyle = '#2a4a70'
        for (const b of birds) {
          const x = Math.round((b.x + t * b.sp * 0.02) % (W + 12)) - 6
          const flap = Math.sin(t * 0.006 + b.ph) > 0 ? 0 : 1
          g.fillRect(x, Math.round(b.y), 1, 1)
          g.fillRect(x - 1, Math.round(b.y) - flap, 1, 1)
          g.fillRect(x + 1, Math.round(b.y) - flap, 1, 1)
        }
      }
      g.drawImage(land, 0, 0)
    }

    build()
    if (!still) {
      const loop = (t) => {
        draw(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    const ro = new ResizeObserver(build)
    ro.observe(host)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={wrap} className={`overflow-hidden ${className}`} style={style} aria-hidden="true">
      <canvas ref={canvas} className="pixelated block" />
    </div>
  )
}
