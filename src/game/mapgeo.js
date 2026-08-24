/** Geometry helpers for the city map. Kept out of the component file so it can
 *  export only components. */

/** Equirectangular is exact enough across a few kilometres of one city. */
export function projector(bbox, w, h) {
  const [w0, s0, e0, n0] = bbox
  return ([lon, lat]) => [((lon - w0) / (e0 - w0)) * w, ((n0 - lat) / (n0 - s0)) * h]
}

/** Cells a position lights up — a corridor either side of where you went. */
export function revealAround(set, project, point, radius = 3) {
  const [cx, cy] = project(point).map(Math.round)
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) set.add(`${cx + dx},${cy + dy}`)
    }
  }
  return set
}

/** Metres between two [lon, lat] points. */
export function metres([lo1, la1], [lo2, la2]) {
  const R = 6371000
  const p1 = (la1 * Math.PI) / 180
  const p2 = (la2 * Math.PI) / 180
  const a =
    Math.sin((p2 - p1) / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin((((lo2 - lo1) * Math.PI) / 180) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
