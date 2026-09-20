/**
 * The part of the app that has an opinion.
 *
 * Everything else here records what you did. This decides what to do next, and
 * it is the difference between a logbook and a training app: a logbook waits
 * to be filled in, a training app meets you at the door with an answer. The
 * question "what am I doing today" is the one that actually stops people, and
 * a screen whose whole answer is a list of twelve activities is not an answer.
 *
 * Two opinions live here, at two scales:
 *
 *   * `planToday` — what this session should be, before you start it.
 *   * `nextTarget` — what this set should be, while you are standing over it.
 *
 * Both are deliberately soft. Nothing here blocks anything: the plan is a
 * suggestion with a start button on it, and the target is a number the stepper
 * opens on. Ignore either and the app does not care.
 */

import { MUSCLES, muscleOf, muscleSplit, neglected } from './exercises'
import { e1rm, topSet, weekStart } from './progress'
import { PILLARS, pillarOf } from './pillars'
import { todaysSession } from './splits'

/* ------------------------------------------------------------ overload --- */

/** The smallest jump worth making, in kg. Below this a "target" is noise. */
export const STEP_KG = 2.5

/** Rep range we push to before adding weight. Classic double progression. */
export const REP_CEILING = 12
export const REP_FLOOR = 5

/**
 * What to try on a lift this time, given what you did last time.
 *
 * Double progression, which is the one scheme that survives contact with a
 * real gym: add reps at the same weight until you reach the top of the range,
 * then add the smallest plate you have and drop back down. It needs no
 * percentages, no maxes and no test week, and it degrades gracefully — miss
 * the target and next time it asks for the same thing again.
 *
 * Returns null when there is nothing to go on. A first session with a lift is
 * not a session to have opinions about.
 */
export function nextTarget(lastSets = []) {
  const top = topSet(lastSets)
  if (!top) return null
  const weight = top.weight ?? 0
  const reps = top.reps ?? 0
  if (!reps) return null

  // Bodyweight work has no plate to add, so it only ever goes up in reps.
  if (weight <= 0) return { reps: reps + 1, weight: 0, why: 'reps' }

  if (reps >= REP_CEILING) return { reps: REP_FLOOR, weight: weight + STEP_KG, why: 'weight' }
  return { reps: reps + 1, weight, why: 'reps' }
}

/** Said the way a person would say it, not as a pair of numbers. */
export function targetLabel(target) {
  if (!target) return null
  return target.weight > 0 ? `${target.weight}kg × ${target.reps}` : `${target.reps} reps`
}

/**
 * Whether this set, right now, beats the board.
 *
 * The same rule the end-of-session tally uses, asked one set early so it can
 * be said while you are still holding the bar. A lift with no record yet is
 * not a record — the first entry is a starting point, and paying for it would
 * turn a first gym session into a printing press.
 */
export function beatsRecord(records = {}, lift, reps, weight, warmup = false) {
  if (warmup) return false
  const prev = records[lift]
  if (!prev) return false
  const est = e1rm(reps, weight)
  if (!est) return false
  return est > prev.e1rm + 0.01 ? { e1rm: est, prev: prev.e1rm, by: est - prev.e1rm } : false
}

/* --------------------------------------------------------------- bar ----- */

/** What is normally on a rack, heaviest first. Everything loads in pairs. */
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
export const BAR_KG = 20

/**
 * What to hang on each end to make the number on the card.
 *
 * A calculator rather than a table because the arithmetic is genuinely
 * annoying mid-session — 82.5kg is a bar, a 25, a 5 and a 1.25 a side, and
 * nobody wants to work that out between sets with their heart rate up.
 *
 * Returns null when the weight cannot be made from a bar and pairs of plates,
 * which is the honest answer for a dumbbell or a machine.
 */
export function plateLoad(weight, bar = BAR_KG) {
  if (!weight || weight < bar) return null
  let side = (weight - bar) / 2
  if (side < 0) return null
  const out = []
  for (const p of PLATES) {
    let n = 0
    while (side >= p - 0.001) {
      side -= p
      n += 1
    }
    if (n) out.push({ plate: p, n })
  }
  return side > 0.001 ? null : { bar, side: out }
}

/* -------------------------------------------------------------- today ---- */

/**
 * How long a muscle group is left alone before it is worth naming. Not a
 * recovery model — it is a reminder that a fortnight has gone by without you
 * training your back, which is the useful version of the same idea.
 */
const COLD_DAYS = 6

/** Days since this group was last worked, or null if never in the window. */
export function lastWorked(log = [], muscle, { custom = [], now = Date.now() } = {}) {
  let latest = 0
  for (const entry of log) {
    if (entry.detail?.mode !== 'strength') continue
    for (const g of entry.detail.lifts ?? []) {
      if (muscleOf(g.lift, custom) === muscle && entry.at > latest) latest = entry.at
    }
  }
  return latest ? Math.floor((now - latest) / 86400000) : null
}

/**
 * The session to do today, and the reason for it.
 *
 * The reasons are ordered by how much they actually matter, and the first one
 * that applies wins. That ordering is the whole design: an app that lists five
 * things you could do has given you a menu, not a plan, and the point of this
 * card is that it answers with one thing.
 *
 *   1. Nothing at all this week — the only thing that matters is starting.
 *   2. A muscle group that has gone cold — the gap that costs you most.
 *   3. A pillar with nothing in it this week — the shape of the week is off.
 *   4. Otherwise, the thing you do most, because consistency is the point.
 */
export function planToday(state, { now = Date.now() } = {}) {
  const log = state.log ?? []
  const custom = state.exercises ?? []

  // Read off the log rather than the folded weeks, so every rule here is
  // answering from the same place. The two can legitimately disagree — an
  // imported session lands in the log before it is folded — and a card that
  // says "nothing logged this week" over a week of sessions is worse than no
  // card at all.
  const since = weekStart(now)
  const week = log.filter((e) => e.at >= since)
  const touched = new Set()
  for (const e of week) {
    const p = pillarOf(e.activityId)
    if (p) touched.add(p.id)
  }

  // 0. A split somebody chose beats anything the app worked out on its own.
  // They told us the shape of their week; second-guessing that with "your back
  // is behind" is the app talking over them. The one exception is a completely
  // blank week, where starting matters more than starting with the right day.
  const chosen = state.player?.split
  if (chosen && week.length) {
    const t = todaysSession(chosen, state.player?.goal, log, { custom })
    if (t) {
      return {
        kind: 'split',
        activityId: 'gym',
        title: `${t.day.name} day`,
        why: `${t.split.name} · day ${t.index + 1} of ${t.of} · ${t.prescribe}`,
        tone: 'var(--color-gold-ink)',
        session: t,
      }
    }
  }

  // 1. A blank week. Anything at all beats a clever recommendation.
  if (!week.length) {
    return {
      kind: 'start',
      activityId: 'walk',
      title: 'Get the week going',
      why: 'Nothing logged yet this week. Twenty minutes of anything starts it.',
      tone: 'var(--color-lime)',
    }
  }

  // 2. A muscle group that has gone quiet. The most specific thing we can say.
  const split = muscleSplit(log, { days: 30, custom, now })
  const behind = neglected(split)
  if (behind) {
    const days = lastWorked(log, behind.id, { custom, now })
    return {
      kind: 'muscle',
      activityId: 'gym',
      muscle: behind.id,
      title: `${behind.name} day`,
      why:
        days == null
          ? `No ${behind.name.toLowerCase()} work in the last month.`
          : `${behind.name} last trained ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`} — furthest behind the rest of you.`,
      tone: behind.tone,
    }
  }

  // 3. A pillar with nothing in it. The week has a shape and one side is empty.
  const empty = PILLARS.find((p) => !touched.has(p.id))
  if (empty) {
    return {
      kind: 'pillar',
      activityId: empty.activities?.[0] ?? 'walk',
      pillar: empty.id,
      title: empty.name,
      why: `Nothing under ${empty.name.toLowerCase()} this week.`,
      tone: empty.color ?? 'var(--arena)',
    }
  }

  // 4. Nothing is wrong. Do the thing you do, which is the whole game.
  const counts = new Map()
  for (const e of log.slice(0, 20)) counts.set(e.activityId, (counts.get(e.activityId) ?? 0) + 1)
  const usual = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'walk'
  const cold = MUSCLES.filter((m) => m.id !== 'cardio' && m.id !== 'full')
    .map((m) => ({ m, d: lastWorked(log, m.id, { custom, now }) }))
    .filter((x) => x.d != null && x.d >= COLD_DAYS)
  return {
    kind: 'usual',
    activityId: usual,
    title: 'Keep it rolling',
    why: cold.length
      ? `The week is on track. ${cold[0].m.name} is ${cold[0].d} days cold if you want a target.`
      : 'The week is on track. Do the thing you do.',
    tone: 'var(--arena)',
  }
}
