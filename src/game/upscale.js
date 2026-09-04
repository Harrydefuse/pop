/**
 * More pixels, without redrawing everything.
 *
 * The art in this app is authored small — eight-pixel UI glyphs, sixteen-pixel
 * pets, thirty-two-pixel gear — and then displayed at forty to two hundred
 * pixels. That is a five to twenty times blow-up, and at those ratios a
 * one-pixel diagonal becomes a staircase you can count the steps of. It reads
 * as "low resolution" long before it reads as "pixel art".
 *
 * EPX (Scale2x) doubles a grid and rounds the corners while it does it: where
 * two neighbours agree and the diagonal disagrees, the corner gets their colour
 * instead of the centre's. Diagonals come out as diagonals, curves stop
 * terracing, and nothing invents a colour that was not already in the palette —
 * which matters here, because the palette is swapped per rarity and per armour
 * set at render time.
 *
 *     A            E0 = C==A && C!=D && A!=B ? A : P
 *   C P B          E1 = A==B && A!=C && B!=D ? B : P
 *     D            E2 = D==C && D!=B && C!=A ? C : P
 *                  E3 = B==D && B!=A && D!=C ? D : P
 *
 * Applied repeatedly until a sprite is big enough that the blow-up is modest.
 * This is not a substitute for authoring the art larger — it adds smoothness,
 * not detail — but it lifts every sprite in the app at once, including the ones
 * generated at run time from a palette and a grid.
 */

/** Beyond this the display scale is small enough that terracing stops showing. */
const TARGET = 56
const MAX_PASSES = 3

function epx(grid, w, h) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : (grid[y][x] ?? '.'))
  const out = []
  for (let y = 0; y < h; y++) {
    let top = ''
    let bottom = ''
    for (let x = 0; x < w; x++) {
      const p = at(x, y)
      const a = at(x, y - 1)
      const b = at(x + 1, y)
      const c = at(x - 1, y)
      const d = at(x, y + 1)
      // A corner is only rounded where the two neighbours that meet there agree
      // with each other and disagree across the diagonal. Anywhere else keeps
      // the centre, so flat runs and deliberate single pixels survive intact.
      top += c === a && c !== d && a !== b ? a : p
      top += a === b && a !== c && b !== d ? b : p
      bottom += d === c && d !== b && c !== a ? c : p
      bottom += b === d && b !== a && d !== c ? d : p
    }
    out.push(top, bottom)
  }
  return out
}

const cache = new WeakMap()

/**
 * The sprite at the resolution it should have been drawn at. Memoised on the
 * grid array, so a sprite that is rendered in twenty places is scaled once —
 * and a recoloured one (same grid, different palette) reuses the same work.
 */
export function smooth(sprite) {
  if (!sprite?.grid?.length) return sprite
  // Line-art opts out. EPX rounds a corner where two neighbours agree, which is
  // right for a filled shape and wrong for a one-pixel-wide glyph: every stroke
  // is all corner, so the rule fires everywhere and a skull becomes a smudge.
  // Those are drawn at the size they are shown instead.
  if (sprite.crisp) return sprite
  const hit = cache.get(sprite.grid)
  if (hit) return { ...sprite, ...hit }

  let { w, h, grid } = sprite
  for (let i = 0; i < MAX_PASSES && w < TARGET; i++) {
    grid = epx(grid, w, h)
    w *= 2
    h *= 2
  }
  const out = { w, h, grid }
  cache.set(sprite.grid, out)
  return { ...sprite, ...out }
}
