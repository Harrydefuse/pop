// A tracked workout: the app holds the stopwatch, so the amount is measured
// rather than typed.
//
// This is the whole anti-cheat story. A slider let anyone claim ten kilometres
// in two seconds; a session costs you the time it says it cost. Distance comes
// off GPS when the browser will give it, and falls back to the pace the
// activity is defined at — which cannot be gamed either, because the clock is
// still the thing you have to spend.

import { ACTIVITIES } from './config'

/** Under a minute is a mis-tap, not a workout. */
export const MIN_SESSION_S = 60

/** Nothing on foot covers ground this fast. A jump in the trace is a GPS
 *  glitch or a car, and either way it is not yours. */
const MAX_SPEED_MPS = 12
const MIN_FIX_M = 5

/**
 * How an activity is actually measured, which is not the same for all of them.
 *
 * A stopwatch is the right instrument for a yoga session and the wrong one for
 * a set of squats — thirty minutes in a gym says nothing about what was lifted,
 * and a HIIT block is rounds of work and rest, not one long minute counter.
 * Each mode gets the readout its sport uses.
 */
export const MODE = {
  walk: 'distance',
  run: 'distance',
  ride: 'distance',
  swim: 'distance',
  gym: 'strength',
  bodyweight: 'strength',
  hiit: 'interval',
  sport: 'interval',
  mobility: 'steady',
  aim: 'steady',
  vod: 'steady',
  sleep: 'steady',
}

export const modeOf = (activityId) => MODE[activityId] ?? 'steady'

/** How far apart the splits are. A kilometre, because that is what runners
 *  talk in and what the pace figure is already per. */
export const SPLIT_M = 1000

/** Default work and rest, in seconds. Forty on, twenty off is the block most
 *  interval sessions are built out of. */
export const INTERVAL = { work: 40, rest: 20, min: 10, max: 180 }

/**
 * Where an interval session is right now.
 *
 * Derived from the clock rather than stored, so a round cannot drift out of
 * step with the elapsed time, and closing the app mid-round costs nothing.
 */
export function intervalPhase(ms, work = INTERVAL.work, rest = INTERVAL.rest) {
  const cycle = Math.max(1, work + rest)
  const t = ms / 1000
  const done = Math.floor(t / cycle)
  const into = t - done * cycle
  const working = into < work
  return {
    phase: working ? 'work' : 'rest',
    left: Math.ceil(working ? work - into : cycle - into),
    round: done + 1,
    completed: done,
  }
}

/**
 * The lifts a gym session gets to name.
 *
 * A short list on purpose. Free text turns the log into a pile of spellings of
 * "bench press" that nothing can add up, and a full exercise database is a
 * different product. These cover most of what a session is made of, and
 * anything else goes under the last one.
 */
export const LIFTS = [
  'Bench press',
  'Squat',
  'Deadlift',
  'Overhead press',
  'Barbell row',
  'Pull-up',
  'Dip',
  'Lat pulldown',
  'Leg press',
  'Romanian deadlift',
  'Lunge',
  'Hip thrust',
  'Bicep curl',
  'Tricep extension',
  'Lateral raise',
  'Calf raise',
  'Plank',
  'Other',
]

/** How much the bar goes up and down by. 2.5kg is the smallest plate pair. */
export const WEIGHT_STEP = 2.5

/**
 * Totals across the logged sets.
 *
 * Volume is reps times weight, which is the number a lifter actually tracks —
 * and the one the Power stone already counts. A bodyweight set carries no
 * weight, so it adds reps and no volume rather than being thrown away.
 */
export function setTotals(sets = []) {
  return sets.reduce(
    (acc, s) => ({
      sets: acc.sets + 1,
      reps: acc.reps + s.reps,
      volume: acc.volume + s.reps * (s.weight ?? 0),
    }),
    { sets: 0, reps: 0, volume: 0 },
  )
}

/** The same totals, split by which lift they belong to, heaviest first. */
export function byLift(sets = []) {
  const out = new Map()
  for (const s of sets) {
    const key = s.lift ?? 'Other'
    const at = out.get(key) ?? { lift: key, sets: 0, reps: 0, volume: 0, top: 0 }
    at.sets += 1
    at.reps += s.reps
    at.volume += s.reps * (s.weight ?? 0)
    at.top = Math.max(at.top, s.weight ?? 0)
    out.set(key, at)
  }
  return [...out.values()].sort((a, b) => b.volume - a.volume || b.reps - a.reps)
}

/**
 * A trace thinned down to something worth keeping.
 *
 * A long walk is thousands of fixes and all of them go into the save. Every
 * nth point, plus both ends, is indistinguishable at map scale and a fraction
 * of the size. Five decimal places is about a metre, which is finer than the
 * fix that produced it.
 */
export const ROUTE_POINTS = 120

export function simplifyRoute(points = [], cap = ROUTE_POINTS) {
  if (points.length < 2) return []
  const round = (n) => Math.round(n * 1e5) / 1e5
  const step = Math.max(1, Math.ceil(points.length / cap))
  const out = []
  for (let i = 0; i < points.length; i += step) out.push([round(points[i].lat), round(points[i].lon)])
  const last = points[points.length - 1]
  const tail = [round(last.lat), round(last.lon)]
  if (out[out.length - 1][0] !== tail[0] || out[out.length - 1][1] !== tail[1]) out.push(tail)
  return out
}

/** Minutes per kilometre for one split, in the form a runner reads. */
export function splitPace(ms) {
  const perKm = ms / 60000
  const m = Math.floor(perKm)
  return `${m}:${String(Math.round((perKm - m) * 60)).padStart(2, '0')}`
}

/** Activities offered on the tracker, movement first. */
export const TRACKED = ['walk', 'run', 'ride', 'swim', 'gym', 'hiit', 'bodyweight', 'sport', 'mobility', 'aim', 'vod', 'sleep']
  .map((id) => ACTIVITIES.find((a) => a.id === id))
  .filter(Boolean)

/** Metres between two fixes. */
export function metresBetween(a, b) {
  const R = 6371000
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const dφ = φ2 - φ1
  const dλ = ((b.lon - a.lon) * Math.PI) / 180
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * What to do with a new fix.
 *
 * Three outcomes, and they are not the same. A jump no runner could make is a
 * glitch: it adds nothing and it does not go on the map, but it does become the
 * new anchor, because the alternative is measuring every later fix from a
 * position you have long since left. A move under five metres is standing
 * still with a wandering signal: it adds nothing and — importantly — does not
 * re-anchor, so a slow walk of three metres a fix still accumulates instead of
 * being rounded away to nothing forever. Anything else is ground covered.
 */
export function fixStep(prev, next) {
  if (!prev) return { metres: 0, anchor: true, keep: true }
  const secs = (next.t - prev.t) / 1000
  const d = metresBetween(prev, next)
  if (secs > 0 && d / secs > MAX_SPEED_MPS) return { metres: 0, anchor: true, keep: false }
  if (d < MIN_FIX_M) return { metres: 0, anchor: false, keep: false }
  return { metres: d, anchor: true, keep: true }
}

/** Milliseconds a session has actually been running. */
export function elapsedMs(session, now = Date.now()) {
  if (!session) return 0
  return session.accumulated + (session.paused ? 0 : Math.max(0, now - session.startedAt))
}

/** What the session is worth in the activity's own unit. */
export function sessionAmount(activity, ms, metres = 0) {
  const minutes = ms / 60000
  if (activity.unit === 'km') {
    // Measured distance wins. Without a fix, the clock still counts, at the
    // pace the activity is defined at — slower than most people move, on
    // purpose.
    return metres > 100 ? Math.round((metres / 1000) * 100) / 100 : Math.round((minutes / activity.minPerUnit) * 100) / 100
  }
  if (activity.unit === 'hours') return Math.round((ms / 3600000) * 100) / 100
  return Math.round(minutes * 10) / 10
}

export function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const pad = (n) => String(n).padStart(2, '0')
  return `${h ? `${h}:` : ''}${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** Minutes per kilometre, the number a runner actually reads. */
export function pace(ms, metres) {
  if (metres < 100) return null
  const perKm = ms / 60000 / (metres / 1000)
  const m = Math.floor(perKm)
  return `${m}:${String(Math.round((perKm - m) * 60)).padStart(2, '0')} /km`
}
