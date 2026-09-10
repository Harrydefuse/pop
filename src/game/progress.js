/**
 * Whether you are getting better.
 *
 * The app was recording everything and reading almost none of it back: every
 * gym set has been stored with its lift, its reps and its weight since the
 * tracker was built, and nothing in the game could answer "is my bench going
 * up". This is the part that reads it.
 *
 * Two things live here that the session log cannot hold on its own. The log is
 * capped at forty entries so a save stays small, which is fine for a history
 * list and useless for a record — a personal best from March would fall off the
 * end of the array and stop being a best. So the best for each lift and the
 * week-by-week totals are folded forward as their own state and never trimmed.
 */

import { minutesOf } from './engine'

/** How many weeks of history the chart keeps. A quarter of a year. */
export const WEEKS_KEPT = 13

/** Below this a "record" is rounding, not progress. */
const PR_EPSILON = 0.5

/** A personal best pays this much XP, and this much damage to the boss. */
export const PR_XP = 60
export const PR_DAMAGE = 40

/** At most this many are paid in one session, so a first day in the gym with
 *  twelve lifts in it cannot print a level. */
export const PR_PER_SESSION = 3

/**
 * One-rep max, estimated — Epley.
 *
 * A lifter does not compare "eight at sixty" with "five at seventy" in their
 * head, and neither should the app: both become one number and the number is
 * comparable. It is an estimate and it is honest about that everywhere it is
 * shown. Bodyweight sets carry no load, so they have no maximum.
 */
export function e1rm(reps, weight) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/** The best estimated max each lift reached inside one session's sets. */
export function bestPerLift(sets = []) {
  const out = new Map()
  for (const s of sets) {
    const est = e1rm(s.reps, s.weight)
    if (!est) continue
    const lift = s.lift ?? 'Other'
    const at = out.get(lift)
    if (!at || est > at.e1rm) out.set(lift, { lift, e1rm: est, reps: s.reps, weight: s.weight })
  }
  return [...out.values()]
}

/**
 * Which of this session's lifts beat what was already on the board.
 *
 * A lift with no record yet is NOT a personal best — it is the first entry.
 * Paying for it would mean a first session in the gym printing XP once per
 * exercise, which is exactly the kind of thing that turns a training record
 * into a currency.
 */
export function newRecords(records = {}, sets = []) {
  const out = []
  for (const best of bestPerLift(sets)) {
    const prev = records[best.lift]
    if (!prev) continue
    if (best.e1rm > prev.e1rm + PR_EPSILON) out.push({ ...best, prev: prev.e1rm })
  }
  return out.sort((a, b) => b.e1rm - b.prev - (a.e1rm - a.prev))
}

/**
 * The heaviest set in a list, which is the one worth repeating.
 *
 * Not the last set: a session that finishes with a drop set would otherwise
 * hand back the lightest thing you did and set you up to go backwards.
 */
export function topSet(sets = []) {
  let best = null
  for (const s of sets) {
    if (!best) { best = s; continue }
    const w = s.weight ?? 0
    const bw = best.weight ?? 0
    if (w > bw || (w === bw && s.reps > best.reps)) best = s
  }
  return best
}

/**
 * What you did last time, per lift.
 *
 * Kept apart from the log for the same reason the records are: the log holds
 * forty sessions, and the whole point of this is to still be there when you
 * come back to a lift you have not touched in two months.
 *
 * Only the sets themselves are stored — no totals — because the question it
 * answers is "what was I doing", and four numbers answer that better than one.
 */
export function foldLastSets(lastSets = {}, sets = [], at = Date.now()) {
  const byLift = new Map()
  for (const s of sets) {
    const lift = s.lift ?? 'Other'
    if (!byLift.has(lift)) byLift.set(lift, [])
    byLift.get(lift).push({ reps: s.reps, weight: s.weight ?? 0 })
  }
  if (!byLift.size) return lastSets
  const next = { ...lastSets }
  for (const [lift, done] of byLift) next[lift] = { at, sets: done }
  return next
}

/** The board after a session, whether or not anything on it was beaten. */
export function foldRecords(records = {}, sets = [], at = Date.now()) {
  const next = { ...records }
  for (const best of bestPerLift(sets)) {
    const prev = next[best.lift]
    if (prev && prev.e1rm >= best.e1rm) continue
    next[best.lift] = { e1rm: best.e1rm, reps: best.reps, weight: best.weight, at }
  }
  return next
}

/**
 * The lifts of your most recent gym session, in the order you did them.
 *
 * What "repeat last session" repeats. Read off the log rather than off a saved
 * routine, because the most common plan is the one you did on Tuesday and
 * nobody sits down to write that one out.
 */
export function lastPlan(log = []) {
  for (const entry of log) {
    if (entry.detail?.mode !== 'strength') continue
    const lifts = (entry.detail.lifts ?? []).map((g) => g.lift).filter(Boolean)
    if (lifts.length) return { at: entry.at, lifts }
  }
  return null
}

/**
 * Which week a moment belongs to, as a sortable key.
 *
 * Weeks start on Monday, because a training week does and because "this week"
 * has to mean the same thing on Sunday night as it did on Monday morning.
 */
export function weekStart(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  // getDay is 0 for Sunday, which is the end of the week rather than the start.
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export function weekKey(ms) {
  return new Date(weekStart(ms)).toISOString().slice(0, 10)
}

const EMPTY_WEEK = { sessions: 0, minutes: 0, volume: 0, km: 0, xp: 0 }

/**
 * Folds one finished session into the rolling weeks.
 *
 * Newest first, and the moment a week rolls over the oldest falls off the end —
 * the chart is a quarter of a year and the save should not grow forever.
 */
export function foldWeek(weeks = [], { act, amount, xp, detail }, at = Date.now()) {
  const key = weekKey(at)
  const rest = weeks.filter((w) => w.key !== key)
  const cur = weeks.find((w) => w.key === key) ?? { key, at: weekStart(at), ...EMPTY_WEEK }
  const minutes = minutesOf(act, amount)
  const km = act.unit === 'km' ? amount : 0
  // Also kept per activity, so a chart can be filtered to "just my runs" the
  // way every training app's is. Weeks folded before this existed simply have
  // no breakdown, and a filtered chart says so by showing nothing for them.
  const byAct = { ...(cur.byAct ?? {}) }
  const slot = byAct[act.id] ?? { sessions: 0, minutes: 0, km: 0 }
  byAct[act.id] = {
    sessions: slot.sessions + 1,
    minutes: Math.round((slot.minutes + minutes) * 10) / 10,
    km: Math.round((slot.km + km) * 10) / 10,
  }
  const merged = {
    ...cur,
    sessions: cur.sessions + 1,
    minutes: cur.minutes + minutes,
    volume: cur.volume + (detail?.mode === 'strength' ? Math.round(detail.volume ?? 0) : 0),
    km: Math.round((cur.km + km) * 10) / 10,
    xp: cur.xp + xp,
    byAct,
  }
  return [merged, ...rest].sort((a, b) => b.at - a.at).slice(0, WEEKS_KEPT)
}

/** One week's numbers, for everything or for a single activity. */
export function weekOf(week, activityId = null) {
  if (!activityId) return week
  const slot = week.byAct?.[activityId]
  return { ...week, ...(slot ?? { sessions: 0, minutes: 0, km: 0 }), volume: 0, xp: 0 }
}

/** Which activities this quarter actually contains, most-used first. */
export function weekActivities(weeks = []) {
  const count = new Map()
  for (const w of weeks) {
    for (const [id, slot] of Object.entries(w.byAct ?? {})) {
      count.set(id, (count.get(id) ?? 0) + (slot.sessions ?? 0))
    }
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/**
 * The last N weeks in order, oldest first, with the gaps filled in.
 *
 * A chart that only plots the weeks you trained draws a straight line through a
 * fortnight off, which is the opposite of what a consistency chart is for.
 */
export function weekSeries(weeks = [], n = WEEKS_KEPT, now = Date.now()) {
  const byKey = new Map(weeks.map((w) => [w.key, w]))
  const out = []
  const start = weekStart(now)
  for (let i = n - 1; i >= 0; i--) {
    const at = start - i * 7 * 24 * 3600 * 1000
    const key = weekKey(at)
    out.push(byKey.get(key) ?? { key, at, ...EMPTY_WEEK })
  }
  return out
}

/** This week against last, for whichever measure the player is here for. */
export function weekOverWeek(weeks = [], field = 'minutes', now = Date.now()) {
  const series = weekSeries(weeks, 2, now)
  const [prev, cur] = series
  const a = cur?.[field] ?? 0
  const b = prev?.[field] ?? 0
  return { now: a, prev: b, delta: a - b, pct: b > 0 ? Math.round(((a - b) / b) * 100) : null }
}

/**
 * Every lift you have a record for, best first.
 *
 * `at` is when the best was set, which is the part that makes it a progress
 * view rather than a table: a best from four months ago reads very differently
 * from one set on Tuesday.
 */
export function liftBoard(records = {}) {
  return Object.entries(records)
    .map(([lift, r]) => ({ lift, ...r }))
    .sort((a, b) => b.e1rm - a.e1rm)
}

/**
 * What a single lift has done over time, from whatever sessions are still in
 * the log.
 *
 * This is the one place that is honestly limited by the forty-session cap: the
 * record survives forever, the line behind it only goes back as far as the log
 * does. Better an honest short line than a fabricated long one.
 */
export function liftSeries(log = [], lift) {
  const out = []
  for (const entry of log) {
    if (entry.detail?.mode !== 'strength') continue
    // A session is stored grouped by lift rather than set by set, so the per
    // lift totals are what can be read back out of it.
    const group = (entry.detail.lifts ?? []).find((g) => g.lift === lift)
    if (!group) continue
    out.push({ at: entry.at, top: group.top ?? 0, volume: group.volume ?? 0, reps: group.reps ?? 0 })
  }
  return out.sort((a, b) => a.at - b.at)
}
