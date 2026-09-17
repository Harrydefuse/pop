/**
 * Renders a character-grid sprite as SVG rects, run-length merged per row so a
 * 16x16 pet is ~40 nodes rather than 256. `accent` swaps the 'A' palette slot,
 * which is how one gear grid serves all five rarities.
 *
 * `fill` hands sizing to the parent instead of taking a pixel count. A tile in
 * a responsive grid is whatever width the row divides into, so any fixed `size`
 * is either short of the edges on a wide phone or over them on a narrow one —
 * the art has to scale with the box, not guess at it.
 *
 * It also crops to the ink before scaling. Every icon is drawn on a 32x32
 * canvas but almost none of them fills it — a helm sits in the middle with
 * margin all round, and scaling the canvas scales that margin with it. Cropping
 * to what was actually drawn is the difference between a piece you can identify
 * and a smudge in the centre of a box.
 */
export default function PixelSprite({ sprite, size = 64, fill = false, accent, className = '', style, title }) {
  const { w, h, grid, palette } = sprite
  const rects = []
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    const row = grid[y] ?? ''
    let x = 0
    while (x < w) {
      const ch = row[x]
      if (!ch || ch === '.') {
        x += 1
        continue
      }
      let run = 1
      while (x + run < w && row[x + run] === ch) run += 1
      const paint = ch === 'A' && accent ? accent : palette[ch]
      if (paint) {
        rects.push(<rect key={`${x}:${y}`} x={x} y={y} width={run} height={1} fill={paint} />)
        if (x < minX) minX = x
        if (x + run - 1 > maxX) maxX = x + run - 1
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
      x += run
    }
  }

  // An empty grid has no box to crop to, so fall back to the whole canvas.
  const box = fill && maxX >= 0 ? `${minX} ${minY} ${maxX - minX + 1} ${maxY - minY + 1}` : `0 0 ${w} ${h}`

  return (
    <svg
      viewBox={box}
      {...(fill
        ? { width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' }
        : { width: size, height: Math.round((size * h) / w) })}
      className={`pixelated ${className}`}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      {rects}
    </svg>
  )
}
