/**
 * Best efforts — the things you would actually tell someone.
 *
 * The lift board answers "how strong am I", one exercise at a time. It cannot
 * answer "what is my 5k", and for most people that is the number they know by
 * heart. So this is the other kind of record: a best time over a distance, the
 * furthest you have gone in one go, the heaviest you have moved for a given
 * number of reps — across every discipline rather than only the gym.
 *
 * They are kept apart from the log because the log rotates. A personal best
 * from eighteen months ago is still your personal best.
 */

/**
 * Distances worth having a time for, per activity, in kilometres. Splits are
 * recorded every kilometre, so these have to be whole ones — a half marathon
 * best would be a lie assembled out of 21 of them plus a guess.
 */
export const RACE = {
  run: [1, 5, 10],
  ride: [5, 10, 20, 40],
  walk: [1, 5, 10],
  swim: [1, 2],
}

/** Rep counts people actually train in, and quote. */
export const REP_MARKS = [1, 3, 5, 6, 8, 10, 12]

/** How many can be pinned to the profile at once. Three fits on a card and
 *  forces a choice, which is what makes it worth reading. */
export const EFFORT_SLOTS = 3

const ACT_NAME = { run: 'run', ride: 'ride', walk: 'walk', swim: 'swim' }

/** Lower is better for a time; higher is better for everything else. */
const beats = (kind, next, prev) => (kind === 'time' ? next < prev : next > prev)

/**
 * The quickest you have covered `km` in one session, from its splits.
 *
 * A rolling window rather than the first N: the fastest 5k inside a 10k is a
 * real 5k, and refusing to see it would mean long runs never set anything.
 */
export function bestWindow(splits = [], km) {
  if (splits.length < km) return null
  let sum = 0
  for (let i = 0; i < km; i++) sum += splits[i]
  let best = sum
  for (let i = km; i < splits.length; i++) {
    sum += splits[i] - splits[i - km]
    if (sum < best) best = sum
  }
  return best
}

/** Everything one session is evidence of, as `{ id, kind, value }`. */
export function effortsIn({ activityId, detail, sets = [] }) {
  const out = []
  if (detail?.mode === 'distance') {
    for (const km of RACE[activityId] ?? []) {
      const ms = bestWindow(detail.splits, km)
      if (ms) out.push({ id: `${activityId}:d${km}`, kind: 'time', value: ms })
    }
    if (detail.metres > 0) out.push({ id: `${activityId}:far`, kind: 'distance', value: detail.metres })
  }
  for (const s of sets) {
    if (!s?.weight || !REP_MARKS.includes(s.reps)) continue
    out.push({ id: `lift:${s.lift ?? 'Other'}:${s.reps}`, kind: 'weight', value: s.weight })
  }
  return out
}

/** The board after a session, whether or not anything on it was beaten. */
export function foldEfforts(bests = {}, session, at = Date.now()) {
  let next = bests
  for (const e of effortsIn(session)) {
    const prev = next[e.id]
    if (prev && !beats(e.kind, e.value, prev.value)) continue
    if (next === bests) next = { ...bests }
    next[e.id] = { kind: e.kind, value: e.value, at }
  }
  return next
}

/**
 * A board built out of what is already saved, for someone who was training
 * before any of this existed.
 *
 * The log keeps splits, so every distance best can be recovered exactly. It
 * does not keep individual sets — only per-exercise totals — so the lifts come
 * from the record board instead: one entry per exercise, at the reps that set
 * it. Less than the truth, but nothing in it is invented.
 */
export function effortsFromLog(log = [], records = {}) {
  let out = {}
  for (const l of [...log].sort((a, b) => a.at - b.at)) {
    out = foldEfforts(out, { activityId: l.activityId, detail: l.detail }, l.at)
  }
  for (const [lift, r] of Object.entries(records)) {
    if (!r?.weight || !REP_MARKS.includes(r.reps)) continue
    out[`lift:${lift}:${r.reps}`] = { kind: 'weight', value: r.weight, at: r.at ?? Date.now() }
  }
  return out
}

/* ------------------------------------------------------------- reading out */

const mmss = (ms) => {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m % 60)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

/** What an effort is called and what it says, from its id alone. */
export function readEffort(id, best) {
  const parts = id.split(':')
  if (parts[0] === 'lift') {
    const lift = parts.slice(1, -1).join(':')
    return { name: `${lift} × ${parts[parts.length - 1]}`, value: `${best.value}`, unit: 'kg', group: 'Lifts' }
  }
  const act = ACT_NAME[parts[0]] ?? parts[0]
  if (parts[1] === 'far') {
    return {
      name: `Longest ${act}`,
      value: (best.value / 1000).toFixed(best.value >= 10000 ? 1 : 2),
      unit: 'km',
      group: 'Distance',
    }
  }
  const km = /^d\d+$/.test(parts[1] ?? '') ? parts[1].slice(1) : null
  // An id that fits none of the shapes above can only come from a save written
  // by a version that knew something this one does not. Say what it says.
  if (!km) return { name: id, value: `${best.value}`, unit: '', group: 'Distance' }
  return { name: `${km}k ${act}`, value: mmss(best.value), unit: '', group: 'Distance' }
}

/** Everything with a best against it, newest first within its group. */
export function effortList(bests = {}) {
  return Object.entries(bests)
    .map(([id, best]) => ({ id, ...best, ...readEffort(id, best) }))
    .sort((a, b) => a.group.localeCompare(b.group) || b.at - a.at)
}

/** The three (or fewer) the player pinned, in the order they pinned them. */
export function pinnedEfforts(bests = {}, picks = []) {
  return picks
    .filter((id) => bests[id])
    .slice(0, EFFORT_SLOTS)
    .map((id) => ({ id, ...bests[id], ...readEffort(id, bests[id]) }))
}
