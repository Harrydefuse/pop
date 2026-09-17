/**
 * A training split, and what to do on today's day of it.
 *
 * The coach could already say "your back is behind" — useful, but it is a
 * correction, not a plan. A split is the plan: you choose a shape for the week
 * once, and from then on the app knows what today is without being asked.
 *
 * Two choices drive everything:
 *
 *   * The SPLIT decides which muscles today is for. Push/pull/legs, upper/
 *     lower, full body, or the five-day one everybody actually runs.
 *   * The GOAL decides what to do with them. The same chest day is four sets
 *     of five heavy singles-adjacent work for somebody chasing a number, and
 *     three sets of fifteen on machines for somebody who wants to feel better
 *     at forty. Same split, different session.
 *
 * Which day is "today" is worked out from what you last DID, not from the
 * calendar. Miss Wednesday and a calendar plan tells you you are behind and
 * skips your legs; a rotation just waits. Nobody needs an app to tell them
 * they missed a day.
 */

import { MUSCLE_NAME, allExercises, muscleOf } from './exercises'

/* --------------------------------------------------------------- goals --- */

/**
 * What the person is actually training for.
 *
 * Three, because these are the three answers people give, and a fourth would
 * be a shade of one of them. Each carries the numbers that make a session look
 * different — how heavy, how many, and how much of it should be the big lifts.
 */
export const GOALS = [
  {
    id: 'fit',
    name: 'Get fit',
    blurb: 'Feel better, move more, keep it sustainable.',
    prescribe: { sets: 3, low: 12, high: 15 },
    // How much the big barbell lifts are favoured over everything else.
    compound: 0.35,
    count: 4,
    rest: '60s',
    note: 'Lighter, longer sets. Machines and bodyweight are fine here.',
  },
  {
    id: 'muscle',
    name: 'Build muscle',
    blurb: 'Enough volume, close enough to failure, often enough.',
    prescribe: { sets: 4, low: 8, high: 12 },
    compound: 0.6,
    count: 5,
    rest: '90s',
    note: 'Compounds first, then isolation while you are warm.',
  },
  {
    id: 'strong',
    name: 'Get stronger',
    blurb: 'Heavy, low reps, the big lifts first and foremost.',
    prescribe: { sets: 5, low: 3, high: 6 },
    compound: 0.95,
    count: 4,
    rest: '3 min',
    note: 'Barbell work leads. Everything else is accessory.',
  },
]

export const goalById = (id) => GOALS.find((g) => g.id === id) ?? GOALS[1]

/** Said the way a coach writes it on a whiteboard. */
export function prescription(goal) {
  const p = goalById(goal?.id ?? goal).prescribe
  return `${p.sets} × ${p.low}–${p.high}`
}

/* -------------------------------------------------------------- splits --- */

/**
 * The shapes people actually train in.
 *
 * Days are a CYCLE, not a week. A four-day upper/lower is this list run twice,
 * and saying so keeps the data honest — the app never has to guess which
 * Tuesday you meant.
 */
export const SPLITS = [
  {
    id: 'full',
    name: 'Full body',
    blurb: 'Three sessions, everything in each one.',
    best: 'Two or three days a week',
    days: [
      { id: 'fa', name: 'Full body A', muscles: ['legs', 'chest', 'back'] },
      { id: 'fb', name: 'Full body B', muscles: ['back', 'shoulders', 'legs'] },
      { id: 'fc', name: 'Full body C', muscles: ['chest', 'legs', 'core'] },
    ],
  },
  {
    id: 'ul',
    name: 'Upper / Lower',
    blurb: 'Everything above the waist, then everything below.',
    best: 'Four days a week',
    days: [
      { id: 'up', name: 'Upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { id: 'lo', name: 'Lower', muscles: ['legs', 'glutes', 'core'] },
    ],
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    blurb: 'Split by what the movement does, not where it lands.',
    best: 'Three or six days a week',
    days: [
      { id: 'push', name: 'Push', muscles: ['chest', 'shoulders', 'arms'] },
      { id: 'pull', name: 'Pull', muscles: ['back', 'arms'] },
      { id: 'legs', name: 'Legs', muscles: ['legs', 'glutes', 'core'] },
    ],
  },
  {
    id: 'bro',
    name: 'Five day',
    blurb: 'One body part a day, the classic gym-floor split.',
    best: 'Five days a week',
    days: [
      { id: 'ch', name: 'Chest', muscles: ['chest'] },
      { id: 'bk', name: 'Back', muscles: ['back'] },
      { id: 'lg', name: 'Legs', muscles: ['legs', 'glutes'] },
      { id: 'sh', name: 'Shoulders', muscles: ['shoulders'] },
      { id: 'ar', name: 'Arms', muscles: ['arms', 'core'] },
    ],
  },
]

export const splitById = (id) => SPLITS.find((s) => s.id === id) ?? null

/* ----------------------------------------------------------- compounds --- */

/**
 * The lifts that move more than one joint and are worth leading a session
 * with. Kept as a list here rather than a flag on all 140 catalogue entries:
 * the catalogue's job is to name things, and this is an opinion about them
 * that only the coach needs.
 */
const COMPOUND = new Set([
  'Bench press', 'Incline bench press', 'Decline bench press', 'Close-grip bench press',
  'Dumbbell bench press', 'Incline dumbbell press', 'Machine chest press', 'Push-up', 'Chest dip',
  'Deadlift', 'Sumo deadlift', 'Rack pull', 'Barbell row', 'Pendlay row', 'T-bar row',
  'Dumbbell row', 'Chest-supported row', 'Seated cable row', 'Machine row', 'Inverted row',
  'Lat pulldown', 'Close-grip lat pulldown', 'Pull-up', 'Chin-up', 'Neutral-grip pull-up',
  'Overhead press', 'Push press', 'Seated dumbbell press', 'Arnold press', 'Machine shoulder press',
  'Landmine press', 'Handstand push-up',
  'Squat', 'Front squat', 'Box squat', 'Goblet squat', 'Hack squat', 'Leg press',
  'Bulgarian split squat', 'Lunge', 'Walking lunge', 'Reverse lunge', 'Step-up',
  'Romanian deadlift', 'Stiff-leg deadlift', 'Hip thrust', 'Good morning',
  'Dip', 'Clean and press', 'Power clean', 'Hang clean', 'Thruster', 'Kettlebell swing',
])

/** Bodyweight and machines are the friendliest places to start. */
const APPROACHABLE = new Set(['bodyweight', 'machine', 'dumbbell'])

/**
 * Bodyweight, and still hard.
 *
 * "Get fit" leans towards bodyweight because it needs no kit and no nerve, but
 * a dip and a pull-up are advanced movements that a lot of people simply
 * cannot do yet — handing somebody a first session of dips is how they decide
 * the gym is not for them. Only the beginner-facing goal avoids these; for
 * everyone else they are excellent.
 */
const DEMANDING = new Set([
  'Dip', 'Chest dip', 'Bench dip', 'Pull-up', 'Chin-up', 'Neutral-grip pull-up',
  'Handstand push-up', 'Pistol squat', 'Nordic curl', 'Toes-to-bar',
  'Hanging leg raise', 'Sissy squat', 'Decline push-up', 'Single-leg hip thrust',
])

/* ------------------------------------------------------------ rotation --- */

/** Every muscle a finished session actually trained. */
function musclesOf(entry, custom) {
  const out = new Set()
  for (const g of entry.detail?.lifts ?? []) out.add(muscleOf(g.lift, custom))
  return out
}

/**
 * Which day of the split comes next.
 *
 * Found by looking back for the last gym session and asking which day it looks
 * most like, then taking the one after it. A session that matches nothing —
 * a one-off arms day on a push/pull/legs split — is ignored rather than
 * forcing the rotation somewhere strange.
 *
 * Returns the first day when there is nothing to go on, which is the right
 * answer for somebody who just picked a split.
 */
export function nextDay(split, log = [], { custom = [] } = {}) {
  if (!split?.days?.length) return null
  for (const entry of log) {
    if (entry.detail?.mode !== 'strength') continue
    // One exercise is not a training day. Without this a single set of wrist
    // curls counts as an arms day and pushes the whole rotation along, which
    // is the app being confidently wrong about something it watched happen.
    if ((entry.detail.lifts ?? []).length < 2) continue
    const hit = musclesOf(entry, custom)
    if (!hit.size) continue
    let best = null
    for (let i = 0; i < split.days.length; i++) {
      const d = split.days[i]
      const overlap = d.muscles.filter((m) => hit.has(m)).length / d.muscles.length
      if (overlap >= 0.5 && (!best || overlap > best.overlap)) best = { i, overlap }
    }
    if (best) return { day: split.days[(best.i + 1) % split.days.length], index: (best.i + 1) % split.days.length, after: split.days[best.i] }
  }
  return { day: split.days[0], index: 0, after: null }
}

/* ---------------------------------------------------------- selection --- */

/** How well one exercise suits this goal, right now, for this person. */
function score(ex, goal, seen) {
  let n = 0
  const big = COMPOUND.has(ex.name)
  // The goal's whole personality lives in this one line: strength wants the
  // barbell, general fitness would rather you were not under one.
  n += big ? goal.compound : 1 - goal.compound
  if (goal.id === 'strong' && ex.gear === 'barbell') n += 0.3
  if (goal.id === 'fit' && APPROACHABLE.has(ex.gear)) n += 0.25
  // A machine sets itself up, holds the path for you and cannot be dropped.
  // For somebody whose goal is just to be fitter, that is the difference
  // between a session and a wasted trip.
  if (goal.id === 'fit' && ex.gear === 'machine') n += 0.45
  if (goal.id === 'fit' && DEMANDING.has(ex.name)) n -= 1.1
  if (goal.id === 'muscle' && (ex.gear === 'dumbbell' || ex.gear === 'cable')) n += 0.15
  // Something you have done before beats a better exercise you have not: the
  // session has to actually happen, and an unfamiliar lift is a reason to skip.
  if (seen.has(ex.name)) n += 0.5
  return n
}

/** Everything you have lifted before, newest first, as a set of names. */
export function liftsSeen(log = []) {
  const out = new Set()
  for (const entry of log) for (const g of entry.detail?.lifts ?? []) out.add(g.lift)
  return out
}

/**
 * What to do today, as a list of exercises.
 *
 * Dealt round-robin across the day's muscles rather than taken straight off a
 * ranked list, or a push day would come back as five chest movements and no
 * shoulders. Compounds are pulled to the front inside that, because the order
 * you do them in matters more than which ones you picked.
 */
export function recommend(day, goal, { log = [], custom = [] } = {}) {
  if (!day) return []
  const g = goalById(goal?.id ?? goal)
  const seen = liftsSeen(log)
  const pool = allExercises(custom).filter((e) => e.name !== 'Other')

  const rank = (list) => list.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))

  // How much of the session is big lifts, as a repeating pattern rather than a
  // block. Front-loading every compound and then filling with whatever is left
  // gives a chest day of one press and four flys; weaving them keeps the shape
  // of a real session at every length.
  const WEAVE = { strong: 'bbbr', muscle: 'brbr', fit: 'brrb' }
  const pattern = WEAVE[g.id] ?? 'brbr'

  const queues = day.muscles.map((m) => {
    const all = pool
      .filter((e) => e.muscle === m)
      .map((e) => ({ ...e, n: score(e, g, seen), big: COMPOUND.has(e.name) }))
    const big = rank(all.filter((e) => e.big))
    const rest = rank(all.filter((e) => !e.big))
    const out = []
    for (let i = 0; out.length < all.length && i < all.length * 2; i++) {
      const want = pattern[i % pattern.length]
      const first = want === 'b' ? big : rest
      const other = want === 'b' ? rest : big
      const pick = first.shift() ?? other.shift()
      if (pick) out.push(pick)
    }
    return out
  })

  const out = []
  const taken = []
  // "Dip" and "Chest dip" are one movement with two entries, and a session
  // that lists both looks like the app is padding. One name containing another
  // is a good enough test for that and costs nothing.
  const clashes = (name) => {
    const a = name.toLowerCase()
    return taken.some((t) => a.includes(t) || t.includes(a))
  }
  const take = (e) => {
    if (!e || clashes(e.name)) return false
    taken.push(e.name.toLowerCase())
    out.push(e)
    return true
  }

  for (let round = 0; out.length < g.count && round < 12; round++) {
    let added = false
    for (const q of queues) {
      if (out.length >= g.count) break
      while (q.length) {
        if (take(q.shift())) { added = true; break }
      }
    }
    if (!added) break
  }

  // Big lifts first while you are fresh — the one piece of ordering advice
  // every programme agrees on.
  return out.sort((a, b) => Number(b.big) - Number(a.big)).map((e) => e.name)
}

/** The whole answer for today, ready for a card to render. */
export function todaysSession(splitId, goalId, log = [], { custom = [] } = {}) {
  const split = splitById(splitId)
  if (!split) return null
  const rot = nextDay(split, log, { custom })
  const goal = goalById(goalId)
  return {
    split,
    goal,
    day: rot.day,
    index: rot.index,
    of: split.days.length,
    exercises: recommend(rot.day, goal, { log, custom }),
    prescribe: prescription(goal),
    muscles: rot.day.muscles.map((m) => MUSCLE_NAME[m] ?? m),
  }
}
