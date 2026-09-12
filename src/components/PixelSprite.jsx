/**
 * Renders a character-grid sprite as SVG rects, run-length merged per row so a
 * 16x16 pet is ~40 nodes rather than 256. `accent` swaps the 'A' palette slot,
 * which is how one gear grid serves all five rarities.
 */
export default function PixelSprite({ sprite, size = 64, accent, className = '', style, title }) {
  const { w, h, grid, palette } = sprite
  const rects = []

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
      const fill = ch === 'A' && accent ? accent : palette[ch]
      if (fill) rects.push(<rect key={`${x}:${y}`} x={x} y={y} width={run} height={1} fill={fill} />)
      x += run
    }
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={Math.round((size * h) / w)}
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
