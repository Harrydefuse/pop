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

/** Total reps across the logged sets, and how many sets that was. */
export function setTotals(sets = []) {
  return sets.reduce((acc, s) => ({ sets: acc.sets + 1, reps: acc.reps + s.reps }), { sets: 0, reps: 0 })
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

/** How far a new fix should add to the trace, or 0 if it is noise. */
export function stepMetres(prev, next, secondsApart) {
  if (!prev) return 0
  const d = metresBetween(prev, next)
  if (d < MIN_FIX_M) return 0
  if (secondsApart > 0 && d / secondsApart > MAX_SPEED_MPS) return 0
  return d
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
