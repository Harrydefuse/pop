/**
 * A different thing to chase every week.
 *
 * Fitocracy — the app this one shares a model with, launched 2011, dead — was
 * post-mortemed on three causes, and the first was gamification that never
 * moved: XP, levels and quests that were brilliant on day one and identical two
 * years later. LVL100 had exactly that shape. Three daily slots, the same three
 * forever, and ten bosses that only ever arrive in one order.
 *
 * So one goal a week, drawn from a rota, scored off numbers the app already
 * keeps. It is deliberately not personalised: everyone on the same week gets
 * the same challenge, which is what makes it something to talk about rather
 * than a private target the app invented for you.
 */

import { weekKey, weekSeries } from './progress'
import { ACTIVITIES } from './config'

/** What a week can ask of you. Each reads off totals the tracker already has. */
export const CHALLENGES = [
  {
    id: 'ground',
    name: 'Cover ten kilometres',
    note: 'Walk, run, ride or swim — every kind of distance counts.',
    unit: 'km',
    goal: 10,
    cores: 400,
    of: (w) => w.km,
  },
  {
    id: 'showing-up',
    name: 'Five sessions',
    note: 'Length does not matter. Turning up five times does.',
    unit: '',
    goal: 5,
    cores: 350,
    of: (w) => w.sessions,
  },
  {
    id: 'tonnage',
    name: 'Move fifteen tonnes',
    note: 'Reps times weight, added up across everything you lift this week.',
    unit: 'kg',
    goal: 15000,
    cores: 450,
    of: (w) => w.volume,
  },
  {
    id: 'hours',
    name: 'Three hours moving',
    note: 'Any three hours, split however the week lets you split them.',
    unit: 'min',
    goal: 180,
    cores: 400,
    of: (w) => w.minutes,
  },
  {
    id: 'spread',
    name: 'Four different disciplines',
    note: 'A run, a lift, a stretch and a swim beats four of anything.',
    unit: '',
    goal: 4,
    cores: 500,
    // The only one the weekly totals cannot answer: it needs to know what the
    // sessions actually were, not how much they added up to.
    of: (w, log) => {
      const kinds = new Set()
      for (const entry of log) {
        if (entry.at < w.at) continue
        const act = ACTIVITIES.find((a) => a.id === entry.activityId)
        if (act) kinds.add(act.tag ?? act.id)
      }
      return kinds.size
    },
  },
]

/**
 * Which challenge a given week runs.
 *
 * Derived from the week's own key rather than stored or rolled, so it is the
 * same for everybody, the same every time it is computed, and cannot be
 * rerolled by closing the app.
 */
export function challengeFor(key) {
  let n = 0
  for (let i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) >>> 0
  return CHALLENGES[n % CHALLENGES.length]
}

/** Where this week stands against what it asked for. */
export function challengeProgress(state, now = Date.now()) {
  const key = weekKey(now)
  const challenge = challengeFor(key)
  const week = weekSeries(state.weeks ?? [], 1, now)[0]
  const have = Math.max(0, challenge.of(week, state.log ?? []))
  return {
    key,
    challenge,
    have,
    goal: challenge.goal,
    pct: Math.min(1, have / challenge.goal),
    done: have >= challenge.goal,
    // Paid once. The claim is recorded against the week, so a new week reopens
    // it and finishing the same challenge twice in one week does not pay twice.
    claimed: state.challenge?.week === key && state.challenge?.claimed === true,
  }
}

/** How far along, in the units the challenge is counted in. */
export function challengeLabel({ challenge, have, goal }) {
  const round = (n) => (challenge.unit === 'km' ? n.toFixed(1) : Math.round(n).toLocaleString())
  return `${round(have)} / ${round(goal)}${challenge.unit ? ` ${challenge.unit}` : ''}`
}
