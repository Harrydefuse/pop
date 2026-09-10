/**
 * Reading a workout out of a file your watch already wrote.
 *
 * Plenty of training happens somewhere else — a Garmin, an Apple Watch, a
 * treadmill, a session someone recorded in Strava before they had this. Asking
 * them to type it in again means either they do not bother or they make it up,
 * and the app's whole claim is that nothing in it is typed.
 *
 * A real health-provider link needs a server and an approved app. A file does
 * not: every one of those apps exports GPX or TCX, and both are XML with the
 * time and place of every point in them. So this reads the export.
 */

import { SPLIT_M, metresBetween } from './session'

/** What a file has to have before it counts as a workout. */
const MIN_POINTS = 2

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Zipped or binary, which is what a .fit and a Strava bulk export both are. */
function looksBinary(text) {
  if (/^PK/.test(text)) return true
  for (let i = 0; i < Math.min(text.length, 400); i++) {
    // Anything below tab is a control byte no XML document starts with.
    if (text.charCodeAt(i) < 9) return true
  }
  return false
}

/** Every timestamped fix in the document, whichever of the two formats it is. */
function readPoints(doc) {
  const out = []
  // GPX puts them in <trkpt lat lon><time>; TCX in <Trackpoint><Position>.
  for (const node of doc.querySelectorAll('trkpt, rtept')) {
    const lat = num(node.getAttribute('lat'))
    const lon = num(node.getAttribute('lon'))
    const t = node.querySelector('time')?.textContent
    if (lat === null || lon === null) continue
    out.push({ lat, lon, at: t ? Date.parse(t) : null })
  }
  if (out.length) return out
  for (const node of doc.querySelectorAll('Trackpoint')) {
    const lat = num(node.querySelector('LatitudeDegrees')?.textContent)
    const lon = num(node.querySelector('LongitudeDegrees')?.textContent)
    const t = node.querySelector('Time')?.textContent
    if (lat === null || lon === null) continue
    out.push({ lat, lon, at: t ? Date.parse(t) : null })
  }
  return out
}

/** The distance a TCX states for itself, which beats one we add up. */
function statedMetres(doc) {
  let total = 0
  for (const node of doc.querySelectorAll('Lap > DistanceMeters')) total += num(node.textContent) ?? 0
  return total > 0 ? total : null
}

/** What kind of session the file says it is, mapped onto ours. */
function statedSport(doc) {
  const tcx = doc.querySelector('Activity')?.getAttribute('Sport')
  const gpx = doc.querySelector('trk > type')?.textContent
  const said = (tcx ?? gpx ?? '').toLowerCase()
  if (/bik|cycl|ride/.test(said)) return 'ride'
  if (/swim/.test(said)) return 'swim'
  if (/walk|hik/.test(said)) return 'walk'
  if (/run/.test(said)) return 'run'
  return null
}

/**
 * Splits every kilometre, from the fixes themselves.
 *
 * Rebuilt rather than read: a file's own lap markers are wherever the person
 * pressed a button, and a best-5k window assembled out of those would be
 * comparing different distances with each other.
 */
function splitsFrom(points) {
  const out = []
  let since = 0
  let mark = points[0]?.at
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    since += metresBetween(a, b)
    if (since >= SPLIT_M && mark != null && b.at != null) {
      out.push(b.at - mark)
      mark = b.at
      since -= SPLIT_M
    }
  }
  return out
}

/**
 * Turns the text of a GPX or TCX file into something the log can take.
 *
 * Throws with a sentence a person can act on rather than a parser error: the
 * commonest failure here is picking the wrong file, and "this is a .fit" is a
 * more useful thing to be told than "unexpected token".
 */
export function readWorkoutFile(text, name = '') {
  if (looksBinary(text) || /\.fit$/i.test(name)) {
    throw new Error('That looks like a .fit or a zip. Export the activity as GPX or TCX and try again.')
  }
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('That file is not GPX or TCX — there is nothing readable in it.')
  }

  const points = readPoints(doc)
  if (points.length < MIN_POINTS) {
    throw new Error('No track in that file. It needs the recorded route, not just a summary.')
  }

  const timed = points.filter((p) => p.at != null)
  const started = timed[0]?.at ?? Date.now()
  const ms = timed.length > 1 ? timed[timed.length - 1].at - started : 0
  if (!(ms > 0)) throw new Error('That file has no timestamps, so there is no session length to count.')

  let metres = statedMetres(doc)
  if (metres === null) {
    metres = 0
    for (let i = 1; i < points.length; i++) {
      metres += metresBetween(points[i - 1], points[i])
    }
  }

  return {
    activityId: statedSport(doc),
    at: started,
    ms,
    metres: Math.round(metres),
    splits: splitsFrom(points),
    // The same shape the tracker produces, so an imported route draws on the
    // map exactly like one recorded here.
    points: points.map((p) => ({ lat: p.lat, lon: p.lon })),
  }
}

/** Which activity to offer for a file, when the file did not say. */
export function guessActivity(workout) {
  if (workout.activityId) return workout.activityId
  const kmh = workout.metres / 1000 / (workout.ms / 3600000)
  if (kmh > 15) return 'ride'
  if (kmh > 7) return 'run'
  return 'walk'
}
