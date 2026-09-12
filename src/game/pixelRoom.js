/**
 * The bits of a stone room, painted on a canvas at the art grid's pitch.
 *
 * Two screens are set in one: the armoury the title card opens on and the
 * arena the campaign is decided in. They are different rooms, but they are the
 * same masonry, the same torches and the same flagstones, and they were about
 * to be written twice.
 *
 * Everything here paints in ART PIXELS, not CSS pixels. The caller sizes its
 * canvas at whatever scale it wants and these draw one block per grid cell, so
 * nothing is ever resampled and the wall stays as crisp as the sprites standing
 * in front of it.
 */

/** Deterministic noise, so a room is the same every time it opens. */
export function rand(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/**
 * Courses of block, offset every other row, each shaded off a seeded roll.
 *
 * The variation is the whole job: a wall of identical rectangles reads as graph
 * paper, and it is the handful of lighter and darker stones that make it read
 * as masonry.
 */
export function paintWall(g, W, bottom, C, seed, bw = 13, bh = 7) {
  const r = rand(seed)
  g.fillStyle = C.mortar
  g.fillRect(0, 0, W, bottom)
  for (let row = 0, y = -3; y < bottom; row++, y += bh) {
    const offset = row % 2 ? -Math.round(bw / 2) : 0
    for (let x = offset; x < W; x += bw) {
      const roll = r()
      const face = roll > 0.88 ? C.stoneHot : roll > 0.6 ? C.stoneLit : roll > 0.18 ? C.stone : C.stoneDark
      g.fillStyle = face
      g.fillRect(x + 1, y + 1, bw - 1, bh - 1)
      // A lit top edge on the stones that catch the light, so the courses read
      // as having depth rather than being tiles.
      if (roll > 0.5) {
        g.fillStyle = C.stoneHot
        g.fillRect(x + 1, y + 1, bw - 1, 1)
      }
      g.fillStyle = C.stoneDark
      g.fillRect(x + 1, y + bh - 1, bw - 1, 1)
    }
  }
}

/** Flagstones running away from the wall, packing together as they recede. */
export function paintFloor(g, W, H, floorY, C) {
  g.fillStyle = C.floor
  g.fillRect(0, floorY, W, H - floorY)
  g.fillStyle = C.floorLit
  g.fillRect(0, floorY, W, 2)
  const depth = H - floorY
  for (let i = 1; i < 7; i++) {
    g.fillStyle = C.floorLine
    g.fillRect(0, floorY + Math.round(depth * (i / 7) ** 1.6), W, 1)
  }
  g.strokeStyle = C.floorLine
  g.lineWidth = 1
  for (let i = -4; i < 10; i++) {
    const x = Math.round(W / 2 + (i * W) / 7)
    g.beginPath()
    g.moveTo(Math.round(W / 2 + (x - W / 2) * 0.25), floorY)
    g.lineTo(x, H)
    g.stroke()
  }
}

/**
 * An iron bracket off the wall with a burning brand in it.
 *
 * The bracket is what sells it: a flame floating on bare stone reads as a bug,
 * not as a torch. `t` is the light's own phase, so a room full of these never
 * flickers in unison.
 */
export function sconce(g, x, y, t, C) {
  g.fillStyle = C.iron
  g.fillRect(x - 4, y + 8, 9, 2)
  g.fillRect(x - 1, y + 6, 3, 6)
  g.fillStyle = C.ironLit
  g.fillRect(x - 4, y + 8, 9, 1)
  g.fillStyle = C.torchWood
  g.fillRect(x - 1, y, 3, 9)
  // The flame is drawn row by row and drawn to a point. Three nested
  // rectangles is a box inside a box: at four device pixels per art pixel it
  // read as a lit window, not as fire.
  const h = Math.round(9 + Math.sin(t) * 3)
  for (let i = 0; i < h; i++) {
    const half = Math.round(3 * ((i + 1) / h) ** 1.2)
    const yy = y - h + i
    g.fillStyle = C.flameLow
    g.fillRect(x - half, yy, half * 2 + 1, 1)
    if (half >= 1) {
      g.fillStyle = C.flameMid
      g.fillRect(x - half + 1, yy, (half - 1) * 2 + 1, 1)
    }
    if (half >= 2) {
      g.fillStyle = C.flameHot
      g.fillRect(x - half + 2, yy, (half - 2) * 2 + 1, 1)
    }
  }
}

/** The warm pool a light throws on whatever is behind it. */
export function glow(g, x, y, r) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r)
  grad.addColorStop(0, 'rgba(255,186,102,0.5)')
  grad.addColorStop(0.5, 'rgba(226,120,44,0.2)')
  grad.addColorStop(1, 'rgba(226,89,31,0)')
  g.fillStyle = grad
  g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4)
}
