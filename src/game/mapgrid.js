/** Grid helpers for the Sydney map. Kept out of the component file so that
 *  only exports components. */
import { SYDNEY } from './sydney'

/** Grid cell for a coordinate. */
export function toCell([lon, lat]) {
  const [w, s, e, n] = SYDNEY.bbox
  return [Math.round(((lon - w) / (e - w)) * SYDNEY.w), Math.round(((n - lat) / (n - s)) * SYDNEY.h)]
}

export function key(x, y) {
  return `${x},${y}`
}

/** Cells a visit lights up — a walk reveals a block either side, not a hairline. */
export function revealAt(set, point, radius = 4) {
  const [cx, cy] = toCell(point)
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) set.add(key(cx + dx, cy + dy))
    }
  }
  return set
}
