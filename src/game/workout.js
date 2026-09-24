/**
 * Reading a workout out of a file somebody exported from somewhere else.
 *
 * WHY THIS IS A FILE PICKER AND NOT A LOGIN BUTTON
 *
 * The obvious feature here is a switch in settings that says "connect Apple
 * Health" and then workouts arrive on their own. That switch cannot be built
 * in this app, and it is worth writing down why so nobody spends a week
 * finding out:
 *
 *   * Apple HealthKit has no web API of any kind. It is an iOS framework, it
 *     needs a signed native app carrying the HealthKit entitlement, and Apple
 *     deliberately gives no server-side or browser-side way in. A page in
 *     Safari cannot read it. Adding the app to the home screen does not change
 *     that.
 *   * Android Health Connect is the same shape: an Android SDK, a native app,
 *     permissions declared in a manifest. Google Fit's old REST API is being
 *     retired in favour of it, and Health Connect never had a web side.
 *   * The aggregators that paper over this — Terra, Vital, Rook and friends —
 *     are server products. They need a backend holding an API key, and every
 *     user's health data goes through their machines. That is a different app
 *     from this one, and it would make the privacy policy untrue.
 *
 * What both platforms DO offer is an export, and so does every watch and every
 * running app: GPX and TCX, the two formats the whole industry agreed on
 * twenty years ago. Apple writes GPX for workout routes, Garmin, Strava,
 * Polar, Suunto, Coros, Runkeeper and Nike all export one or both. A file is
 * slower than a sync and it is the honest version: it works offline, it needs
 * no account, and nothing leaves the device.
 *
 * Everything below is a pure function over a string. No fetch, no DOM beyond
 * the browser's own XML parser, nothing to mock.
 */

import { SPLIT_M, fixStep, metresBetween } from './session'

/** What a parsed file turns into: the shape `importWorkout` already takes. */
const EMPTY = { points: [], metres: 0, ms: 0, splits: [], startedAt: null, sport: null }

/**
 * Which activity a file is claiming to be.
 *
 * GPX has no agreed field for it — Garmin and Strava both write their own
 * extension — so this reads whatever is there and falls back to nothing. A
 * guess the importer offers is better than a guess it commits to, so the
 * result is a suggestion the person confirms rather than a decision.
 */
const SPORTS = [
  { id: 'run', match: /run|jog|trail/i },
  { id: 'ride', match: /rid|cycl|bike|biking/i },
  { id: 'walk', match: /walk|hik/i },
  { id: 'swim', match: /swim/i },
  { id: 'sport', match: /row|ski|skat|paddl/i },
]

function sportOf(text) {
  if (!text) return null
  return SPORTS.find((s) => s.match.test(text))?.id ?? null
}

/**
 * Parse XML with the browser's own parser, and treat a parse error as an
 * error rather than as a document — `DOMParser` reports a malformed file by
 * handing back a document containing a `<parsererror>` element, which is easy
 * to miss and looks like an empty workout.
 */
function parseXml(text) {
  if (typeof DOMParser === 'undefined') return null
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  return doc.querySelector('parsererror') ? null : doc
}

/** Every `<trkpt>`/`<Trackpoint>` in the file, as fixes the tracker understands. */
function fixesFrom(doc) {
  const out = []
  // GPX puts the position on the element and the time in a child. TCX nests
  // the position one level down. Both are handled by reading whichever is
  // there rather than by branching on the format.
  for (const node of doc.querySelectorAll('trkpt, Trackpoint')) {
    const lat = Number(node.getAttribute('lat') ?? node.querySelector('LatitudeDegrees')?.textContent)
    const lon = Number(node.getAttribute('lon') ?? node.querySelector('LongitudeDegrees')?.textContent)
    const when = Date.parse(node.querySelector('time, Time')?.textContent ?? '')
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue
    out.push({ lat, lon, t: Number.isFinite(when) ? when : null })
  }
  return out
}

/**
 * Turn a list of fixes into a workout.
 *
 * Run through `fixStep`, which is the same filter the live tracker uses: a
 * jump no human could have made is dropped, a wander of under five metres is
 * not counted, and everything else is ground covered. A file exported from a
 * watch that lost signal under a bridge has exactly the stray point that rule
 * exists for.
 */
export function fromFixes(fixes) {
  const timed = fixes.filter((f) => f.t != null)
  const points = []
  const splits = []
  let metres = 0
  let prev = null
  for (const f of fixes) {
    const step = fixStep(prev, { ...f, t: f.t ?? prev?.t ?? 0 })
    if (step.metres) {
      metres += step.metres
      const crossed = Math.floor(metres / SPLIT_M)
      if (crossed > splits.length && timed.length) {
        const at = f.t - timed[0].t
        splits.push({ km: splits.length + 1, at, ms: at - (splits[splits.length - 1]?.at ?? 0) })
      }
    }
    if (step.keep || !points.length) points.push({ lat: f.lat, lon: f.lon, t: f.t })
    if (step.anchor) prev = f
  }
  // No timestamps at all is a route somebody drew, not a workout they did.
  // It still has a shape and a distance; it has no duration, and inventing
  // one would be the app making up training.
  const ms = timed.length > 1 ? timed[timed.length - 1].t - timed[0].t : 0
  return {
    points,
    metres: Math.round(metres),
    ms: Math.max(0, ms),
    splits,
    startedAt: timed.length ? timed[0].t : null,
  }
}

/**
 * Read one exported workout.
 *
 * Returns null for anything that is not a track with at least two positions in
 * it — an empty file, a photo somebody picked by mistake, an Apple Health
 * bundle (which is a zip, and a different job).
 */
export function readWorkout(text) {
  const doc = parseXml(text)
  if (!doc) return null
  const fixes = fixesFrom(doc)
  if (fixes.length < 2) return null

  const parsed = fromFixes(fixes)
  if (!parsed.metres) return null

  // TCX carries a distance the device measured itself, which is better than
  // one worked out from a sparse trace — a watch samples its own wheel or
  // accelerometer far more often than it writes a position.
  const stated = Number(doc.querySelector('DistanceMeters')?.textContent)
  const laps = [...doc.querySelectorAll('Lap')]
  const deviceMetres = laps.length
    ? laps.reduce((n, l) => n + (Number(l.querySelector('DistanceMeters')?.textContent) || 0), 0)
    : stated
  // ...but only when the two roughly agree. A device figure that is nowhere
  // near the trace is a unit mix-up or a field this file uses for something
  // else, and the trace is the thing we can actually see.
  const metres =
    deviceMetres > 0 && Math.abs(deviceMetres - parsed.metres) < parsed.metres * 0.35
      ? Math.round(deviceMetres)
      : parsed.metres

  const sport =
    sportOf(doc.querySelector('Activity')?.getAttribute('Sport')) ??
    sportOf(doc.querySelector('type, Sport, activity')?.textContent) ??
    sportOf(doc.querySelector('trk > name, Name')?.textContent)

  return { ...parsed, metres, sport }
}

/** Straight-line span of a trace, for the "is this even near you" sanity line. */
export function spanMetres(points = []) {
  if (points.length < 2) return 0
  let far = 0
  for (const p of points) far = Math.max(far, metresBetween(points[0], p))
  return Math.round(far)
}

export { EMPTY as EMPTY_WORKOUT }
