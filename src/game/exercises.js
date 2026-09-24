/**
 * The exercise catalogue.
 *
 * Eighteen lifts and "Other" is a demo. Anyone who trains seriously does at
 * least a dozen things that were not on that list, and the moment their fourth
 * exercise of the session has to be logged as "Other" the record stops being
 * worth keeping — every chart flattens into one meaningless bar.
 *
 * So: a real catalogue, plus room to add your own. Each entry carries the
 * muscle it trains, which is what makes "you have not pulled anything in three
 * weeks" possible, and the equipment it needs, which is what makes a set of
 * dumbbells in a garage a usable filter.
 *
 * Names are the identity — the log has always keyed on them, and a rename that
 * orphaned three months of records would be worse than a slightly untidy list.
 */

/** The groups a coverage chart can actually be read at a glance. */
export const MUSCLES = [
  { id: 'chest', name: 'Chest', tone: 'var(--tone-orange)' },
  { id: 'back', name: 'Back', tone: 'var(--tone-blue)' },
  { id: 'shoulders', name: 'Shoulders', tone: 'var(--tone-sky)' },
  { id: 'arms', name: 'Arms', tone: 'var(--color-neon)' },
  { id: 'legs', name: 'Legs', tone: 'var(--tone-green)' },
  { id: 'glutes', name: 'Glutes', tone: 'var(--tone-jade)' },
  { id: 'core', name: 'Core', tone: 'var(--color-cyan)' },
  { id: 'full', name: 'Full body', tone: 'var(--tone-bronze)' },
  { id: 'cardio', name: 'Conditioning', tone: 'var(--tone-slate)' },
]

export const MUSCLE_NAME = Object.fromEntries(MUSCLES.map((m) => [m.id, m.name]))

/** What it takes to do it, for the days you only have one of these. */
export const GEAR = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other']

const E = (name, muscle, gear) => ({ name, muscle, gear })

export const EXERCISES = [
  // ------------------------------------------------------------------ chest
  E('Bench press', 'chest', 'barbell'),
  E('Incline bench press', 'chest', 'barbell'),
  E('Decline bench press', 'chest', 'barbell'),
  E('Close-grip bench press', 'arms', 'barbell'),
  E('Dumbbell bench press', 'chest', 'dumbbell'),
  E('Incline dumbbell press', 'chest', 'dumbbell'),
  E('Dumbbell fly', 'chest', 'dumbbell'),
  E('Incline dumbbell fly', 'chest', 'dumbbell'),
  E('Cable fly', 'chest', 'cable'),
  E('Cable crossover', 'chest', 'cable'),
  E('Pec deck', 'chest', 'machine'),
  E('Machine chest press', 'chest', 'machine'),
  E('Push-up', 'chest', 'bodyweight'),
  E('Incline push-up', 'chest', 'bodyweight'),
  E('Decline push-up', 'chest', 'bodyweight'),
  E('Chest dip', 'chest', 'bodyweight'),

  // ------------------------------------------------------------------- back
  E('Deadlift', 'back', 'barbell'),
  E('Sumo deadlift', 'legs', 'barbell'),
  E('Rack pull', 'back', 'barbell'),
  E('Barbell row', 'back', 'barbell'),
  E('Pendlay row', 'back', 'barbell'),
  E('Dumbbell row', 'back', 'dumbbell'),
  E('Chest-supported row', 'back', 'dumbbell'),
  E('Seated cable row', 'back', 'cable'),
  E('T-bar row', 'back', 'barbell'),
  E('Machine row', 'back', 'machine'),
  E('Inverted row', 'back', 'bodyweight'),
  E('Lat pulldown', 'back', 'cable'),
  E('Close-grip lat pulldown', 'back', 'cable'),
  E('Straight-arm pulldown', 'back', 'cable'),
  E('Pull-up', 'back', 'bodyweight'),
  E('Chin-up', 'back', 'bodyweight'),
  E('Neutral-grip pull-up', 'back', 'bodyweight'),
  E('Back extension', 'back', 'bodyweight'),
  E('Good morning', 'back', 'barbell'),
  E('Shrug', 'back', 'barbell'),
  E('Dumbbell shrug', 'back', 'dumbbell'),

  // -------------------------------------------------------------- shoulders
  E('Overhead press', 'shoulders', 'barbell'),
  E('Seated dumbbell press', 'shoulders', 'dumbbell'),
  E('Arnold press', 'shoulders', 'dumbbell'),
  E('Machine shoulder press', 'shoulders', 'machine'),
  E('Push press', 'shoulders', 'barbell'),
  E('Landmine press', 'shoulders', 'barbell'),
  E('Lateral raise', 'shoulders', 'dumbbell'),
  E('Cable lateral raise', 'shoulders', 'cable'),
  E('Front raise', 'shoulders', 'dumbbell'),
  E('Rear delt fly', 'shoulders', 'dumbbell'),
  E('Reverse pec deck', 'shoulders', 'machine'),
  E('Face pull', 'shoulders', 'cable'),
  E('Upright row', 'shoulders', 'barbell'),
  E('Handstand push-up', 'shoulders', 'bodyweight'),

  // ------------------------------------------------------------------- arms
  E('Bicep curl', 'arms', 'barbell'),
  E('Dumbbell curl', 'arms', 'dumbbell'),
  E('Hammer curl', 'arms', 'dumbbell'),
  E('Incline dumbbell curl', 'arms', 'dumbbell'),
  E('Preacher curl', 'arms', 'barbell'),
  E('EZ-bar curl', 'arms', 'barbell'),
  E('Cable curl', 'arms', 'cable'),
  E('Concentration curl', 'arms', 'dumbbell'),
  E('Reverse curl', 'arms', 'barbell'),
  E('Tricep extension', 'arms', 'dumbbell'),
  E('Overhead tricep extension', 'arms', 'dumbbell'),
  E('Skullcrusher', 'arms', 'barbell'),
  E('Tricep pushdown', 'arms', 'cable'),
  E('Rope pushdown', 'arms', 'cable'),
  E('Tricep kickback', 'arms', 'dumbbell'),
  E('Dip', 'arms', 'bodyweight'),
  E('Bench dip', 'arms', 'bodyweight'),
  E('Wrist curl', 'arms', 'dumbbell'),
  E('Reverse wrist curl', 'arms', 'dumbbell'),
  E('Farmer carry', 'arms', 'dumbbell'),

  // ------------------------------------------------------------------- legs
  E('Squat', 'legs', 'barbell'),
  E('Front squat', 'legs', 'barbell'),
  E('Box squat', 'legs', 'barbell'),
  E('Goblet squat', 'legs', 'dumbbell'),
  E('Hack squat', 'legs', 'machine'),
  E('Leg press', 'legs', 'machine'),
  E('Bulgarian split squat', 'legs', 'dumbbell'),
  E('Lunge', 'legs', 'dumbbell'),
  E('Walking lunge', 'legs', 'dumbbell'),
  E('Reverse lunge', 'legs', 'dumbbell'),
  E('Step-up', 'legs', 'dumbbell'),
  E('Pistol squat', 'legs', 'bodyweight'),
  E('Sissy squat', 'legs', 'bodyweight'),
  E('Leg extension', 'legs', 'machine'),
  E('Leg curl', 'legs', 'machine'),
  E('Seated leg curl', 'legs', 'machine'),
  E('Romanian deadlift', 'legs', 'barbell'),
  E('Stiff-leg deadlift', 'legs', 'barbell'),
  E('Nordic curl', 'legs', 'bodyweight'),
  E('Calf raise', 'legs', 'bodyweight'),
  E('Standing calf raise', 'legs', 'machine'),
  E('Seated calf raise', 'legs', 'machine'),

  // ----------------------------------------------------------------- glutes
  E('Hip thrust', 'glutes', 'barbell'),
  E('Glute bridge', 'glutes', 'bodyweight'),
  E('Single-leg hip thrust', 'glutes', 'bodyweight'),
  E('Cable kickback', 'glutes', 'cable'),
  E('Hip abduction', 'glutes', 'machine'),
  E('Sumo squat', 'glutes', 'dumbbell'),
  E('Curtsy lunge', 'glutes', 'dumbbell'),
  E('Frog pump', 'glutes', 'bodyweight'),

  // ------------------------------------------------------------------- core
  E('Plank', 'core', 'bodyweight'),
  E('Side plank', 'core', 'bodyweight'),
  E('Crunch', 'core', 'bodyweight'),
  E('Sit-up', 'core', 'bodyweight'),
  E('Hanging leg raise', 'core', 'bodyweight'),
  E('Lying leg raise', 'core', 'bodyweight'),
  E('Toes-to-bar', 'core', 'bodyweight'),
  E('Cable crunch', 'core', 'cable'),
  E('Russian twist', 'core', 'other'),
  E('Ab wheel', 'core', 'other'),
  E('Mountain climber', 'core', 'bodyweight'),
  E('Dead bug', 'core', 'bodyweight'),
  E('Bird dog', 'core', 'bodyweight'),
  E('Hollow hold', 'core', 'bodyweight'),
  E('V-up', 'core', 'bodyweight'),
  E('Woodchop', 'core', 'cable'),

  // -------------------------------------------------------------- full body
  E('Clean and jerk', 'full', 'barbell'),
  E('Power clean', 'full', 'barbell'),
  E('Hang clean', 'full', 'barbell'),
  E('Clean and press', 'full', 'barbell'),
  E('Snatch', 'full', 'barbell'),
  E('Power snatch', 'full', 'barbell'),
  E('Thruster', 'full', 'barbell'),
  E('Kettlebell swing', 'full', 'kettlebell'),
  E('Turkish get-up', 'full', 'kettlebell'),
  E('Kettlebell clean', 'full', 'kettlebell'),
  E('Burpee', 'full', 'bodyweight'),
  E('Sled push', 'full', 'other'),
  E('Sled pull', 'full', 'other'),

  // ----------------------------------------------------------- conditioning
  E('Rowing machine', 'cardio', 'machine'),
  E('Assault bike', 'cardio', 'machine'),
  E('Ski erg', 'cardio', 'machine'),
  E('Treadmill run', 'cardio', 'machine'),
  E('Stair climber', 'cardio', 'machine'),
  E('Elliptical', 'cardio', 'machine'),
  E('Jump rope', 'cardio', 'other'),
  E('Battle ropes', 'cardio', 'other'),
  E('Box jump', 'cardio', 'bodyweight'),

  // The one that has to exist, because no list is ever finished.
  E('Other', 'full', 'other'),
]

const BY_NAME = new Map(EXERCISES.map((e) => [e.name.toLowerCase(), e]))

/** The catalogue plus whatever this person added, as one list. */
export function allExercises(custom = []) {
  return [...EXERCISES, ...custom.filter((c) => !BY_NAME.has(c.name.toLowerCase()))]
}

/** An exercise by name, from either list. Unknown names are still trainable. */
export function exerciseByName(name, custom = []) {
  if (!name) return null
  const key = name.toLowerCase()
  return BY_NAME.get(key) ?? custom.find((c) => c.name.toLowerCase() === key) ?? null
}

/** Which group a logged lift belongs to, for anything that adds them up. */
export const muscleOf = (name, custom = []) => exerciseByName(name, custom)?.muscle ?? 'full'

/**
 * Search that forgives how people actually type.
 *
 * A name match at the start beats one in the middle, which beats a match on
 * the muscle or the equipment — so "press" puts the presses above the leg
 * press, and "dumb" finds the whole dumbbell shelf.
 */
export function searchExercises(query, { custom = [], muscle = null, gear = null } = {}) {
  const q = query.trim().toLowerCase()
  const pool = allExercises(custom).filter(
    (e) => (!muscle || e.muscle === muscle) && (!gear || e.gear === gear),
  )
  if (!q) return pool
  const scored = []
  for (const e of pool) {
    const name = e.name.toLowerCase()
    let score = null
    if (name.startsWith(q)) score = 0
    else if (name.includes(q)) score = 1
    else if (e.muscle.startsWith(q) || MUSCLE_NAME[e.muscle]?.toLowerCase().includes(q)) score = 2
    else if (e.gear.startsWith(q)) score = 3
    if (score !== null) scored.push([score, e])
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).map(([, e]) => e)
}

/**
 * How the last few weeks of lifting were spread across the body.
 *
 * Counted in sets rather than volume, because a set of curls and a set of
 * squats are one decision each and volume would say the squats are twenty
 * times the training. This is the chart that answers "what am I skipping",
 * and the answer is usually the same two groups.
 */
export function muscleSplit(log = [], { days = 30, custom = [], now = Date.now() } = {}) {
  const since = now - days * 86400000
  const sets = Object.fromEntries(MUSCLES.map((m) => [m.id, 0]))
  let total = 0
  for (const entry of log) {
    if (entry.at < since || entry.detail?.mode !== 'strength') continue
    for (const g of entry.detail.lifts ?? []) {
      const id = muscleOf(g.lift, custom)
      sets[id] = (sets[id] ?? 0) + (g.sets ?? 0)
      total += g.sets ?? 0
    }
  }
  return {
    total,
    days,
    groups: MUSCLES.map((m) => ({ ...m, sets: sets[m.id], pct: total ? Math.round((sets[m.id] / total) * 100) : 0 })),
  }
}

/** The group with the least work in it, ignoring the ones nobody splits out. */
export function neglected(split) {
  if (!split.total) return null
  const candidates = split.groups.filter((g) => g.id !== 'cardio' && g.id !== 'full')
  const worst = candidates.reduce((a, b) => (b.sets < a.sets ? b : a))
  // Only worth saying if it is genuinely behind the rest of the body.
  const average = candidates.reduce((n, g) => n + g.sets, 0) / candidates.length
  return worst.sets < average * 0.5 ? worst : null
}
