/**
 * The three things this app is for.
 *
 * It is easy to drift into building a character screen with a step counter
 * bolted on, because the character is the fun part to draw. It is not the
 * point. The point is that somebody who plays a lot of games gets better at
 * three specific things — getting out of the house, getting stronger, and
 * getting better at the games they already play — and the gear, the pets and
 * the levels are what those three pay out.
 *
 * So they are a data structure rather than a layout decision. Every activity
 * belongs to exactly one of them, each one reports a real number that went up
 * or down since last week, and each one carries a standing best that is the
 * proof you are actually improving rather than merely turning up.
 */

import { ACTIVITIES, GAMES } from './config'
import { dayKeyOf, minutesOf } from './engine'
import { weekSeries } from './progress'
import { readEffort } from './efforts'

export const PILLARS = [
  {
    id: 'out',
    name: 'Getting out',
    blurb: 'Outside, on your feet, covering ground.',
    icon: 'run',
    color: 'var(--color-lime)',
    activities: ['walk', 'run', 'ride', 'swim', 'sport'],
    // Distance is the number people actually quote to each other about this
    // one, so it is the headline. Minutes are the fallback for a week of
    // sport and swimming, which cover no ground the app can see.
    unit: 'km',
    empty: 'A twenty minute walk starts it.',
  },
  {
    id: 'gym',
    name: 'Gym',
    blurb: 'Load on the bar, and the bar going up.',
    icon: 'dumbbell',
    color: 'var(--color-gold)',
    activities: ['gym', 'lift', 'bodyweight', 'hiit', 'mobility'],
    unit: 'min',
    empty: 'One session, any lift, starts the board.',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    blurb: 'Aim, review, and a score that proves it.',
    icon: 'crosshair',
    color: 'var(--color-neon)',
    activities: ['aim', 'vod'],
    unit: 'min',
    empty: 'Log an aim session with its score.',
  },
]

/**
 * The empty line under a pillar, which for gaming depends on what they play.
 *
 * Telling somebody who only plays Minecraft to go and train their aim is the
 * app not listening. Telling a Valorant player the same thing is the whole
 * pitch, so the games question they answered at character creation decides
 * which of the two they get.
 */
export function pillarEmpty(pillar, games = []) {
  if (pillar.id !== 'gaming') return pillar.empty
  const named = GAMES.filter((g) => games.includes(g.id) && g.kind === 'aim')
  if (named.length) return `Aim training pays off in ${named[0].name}.`
  if (games.length) return 'Aim training and VOD review both count.'
  return pillar.empty
}

/** Which pillar an activity belongs to. Sleep belongs to none — it is
 *  recovery, it pays XP, and it is not a thing you are getting better at. */
export function pillarOf(activityId) {
  return PILLARS.find((p) => p.activities.includes(activityId)) ?? null
}

/**
 * How long a session has to be before the day counts as trained.
 *
 * The same twenty minutes the Active daily already asks for, so the app has
 * one number for "that was a day" rather than two that disagree. Below it the
 * streak was claimable by the minimum loggable sixty seconds, which made the
 * longest streak in the game a measure of who remembered to open the app.
 */
export const STREAK_MIN_MINUTES = 20

/**
 * Whether a session is the kind of thing the daily streak is about.
 *
 * Getting out or the gym — the two pillars that are your body doing something.
 * Sleep and aim training are logged, pay XP and count towards the dailies, and
 * they do not keep a streak: a hundred-day streak built out of typing in last
 * night's sleep is a number, not a habit, and it carries a x1.5 multiplier on
 * everything else.
 *
 * This is also what stops the streak and the weekly training target from
 * contradicting each other. They are deliberately different bars: the streak
 * asks for twenty minutes of moving every day, which is Apple's move ring and
 * is meant to be cleared on a rest day by walking. The target asks for the
 * days you actually trained, which is Peloton's weekly goal and is meant to be
 * four or five. Neither is the other one failing.
 */
export function keepsStreak(activityId, minutes) {
  const p = pillarOf(activityId)
  if (p?.id !== 'out' && p?.id !== 'gym') return false
  return minutes >= STREAK_MIN_MINUTES
}

/**
 * How many different days in a window held a session that counted.
 *
 * The same bar as `keepsStreak`, on purpose: the daily streak and the weekly
 * training target now agree about what a day of training is, and the only
 * difference between them is how often they ask for one. Two definitions of
 * "a day" was the thing that made the two read as contradicting each other.
 *
 * Days, not sessions. Two sessions on a Tuesday is one day, and a target of
 * four that a double day can clear in two is not a target.
 */
export function daysTrained(log = [], since) {
  const days = new Set()
  for (const e of log) {
    if (e.at < since) continue
    const act = ACTIVITIES.find((a) => a.id === e.activityId)
    if (act && keepsStreak(act.id, minutesOf(act, e.amount))) days.add(dayKeyOf(e.at))
  }
  return days.size
}

/** Which best-effort ids belong to which pillar, by the prefix the id is
 *  built from. Lifts are stored as `lift:<name>:<reps>` whatever gym activity
 *  produced them, so the gym owns one prefix rather than five. */
const PREFIX = {
  out: ['walk:', 'run:', 'ride:', 'swim:'],
  gym: ['lift:'],
  gaming: ['aim:'],
}

/**
 * This week against last, for one pillar.
 *
 * Read off the per-activity breakdown the weeks already keep, so nothing new
 * has to be recorded for this to work on a save that predates it — a week
 * folded before the breakdown existed simply reports zero, which is honest.
 */
export function pillarWeek(weeks = [], pillar, now = Date.now()) {
  const [prev, cur] = weekSeries(weeks, 2, now)
  const sum = (w) => {
    let sessions = 0
    let minutes = 0
    let km = 0
    for (const id of pillar.activities) {
      const slot = w?.byAct?.[id]
      if (!slot) continue
      sessions += slot.sessions ?? 0
      minutes += slot.minutes ?? 0
      km += slot.km ?? 0
    }
    return { sessions, minutes: Math.round(minutes), km: Math.round(km * 10) / 10 }
  }
  const a = sum(cur)
  const b = sum(prev)
  // Measured on what THIS week has. A week of swimming, five-a-side or walks
  // logged by the clock covers no ground the app can see, and heading it
  // "0.0 km · 1 session" is the app calling a session nothing. Both sides of
  // the comparison switch together, so the delta is always like for like.
  const field = pillar.unit === 'km' && a.km > 0 ? 'km' : 'minutes'
  return {
    sessions: a.sessions,
    minutes: a.minutes,
    km: a.km,
    field,
    unit: field === 'km' ? 'km' : 'min',
    value: a[field],
    was: b[field],
    delta: Math.round((a[field] - b[field]) * 10) / 10,
  }
}

/**
 * The freshest thing this pillar can prove.
 *
 * The most recently set best rather than the biggest: a 5k time from March is
 * a worse answer to "am I getting better" than a bench single from Tuesday,
 * even though the 5k is the more impressive line.
 */
export function pillarBest(pillar, bests = {}) {
  const prefixes = PREFIX[pillar.id] ?? []
  let best = null
  for (const [id, entry] of Object.entries(bests)) {
    if (!prefixes.some((p) => id.startsWith(p))) continue
    if (!best || (entry.at ?? 0) > (best.at ?? 0)) best = { id, ...entry }
  }
  if (!best) return null
  return { ...best, ...readEffort(best.id, best) }
}
