import { useEffect, useMemo, useReducer, useRef } from 'react'
import { GameContext } from './context'
import { BOSS, CATALOG, FRESH_START, INITIAL_STATE, TEST_ACCOUNT, freshDailies, gearPiece } from './data'
import { ACTIVITIES, DAILY_SLOTS, EQUIP_SLOTS, FOUNDER_GIFT, OFFHAND_KINDS, RARITY, setForRarity } from './config'
import { INTERVAL, MIN_SESSION_S, SPLIT_M, byLift, elapsedMs, modeOf, sessionAmount, setTotals, simplifyRoute } from './session'
import { coverPoints } from './ground'
import { bestLoadout, bossHit, campaignState, grantPetXp, grantXp, minutesOf, resolveActivity, rollDailyChest, stoneProgress, todayKey } from './engine'
import { PR_DAMAGE, PR_PER_SESSION, PR_XP, foldLastSets, foldRecords, foldWeek, newRecords } from './progress'
import { challengeProgress } from './challenge'
import { EFFORT_SLOTS, effortsFromLog, foldEfforts } from './efforts'
import { exerciseByName } from './exercises'

const SAVE_KEY = 'lvl100.save.v12' // v12: explored ground is real map tiles now, not cells of a drawn Sydney

let uid = 0
const nextId = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`

function baseState() {
  return {
    ...structuredClone(INITIAL_STATE),
    world: { bossKm: BOSS.startKm },
    liked: [],
    purchased: [],
    lastReward: null,
    // Kept apart from `log`, which is trimmed to forty entries: a best from
    // three months ago has to survive the sessions that pushed it off the list,
    // and so does the shape of the last quarter.
    records: {},
    weeks: [],
    // What you did last time, per lift, so the app can put it in front of you
    // at the moment you are deciding what to do today.
    lastSets: {},
    // Saved plans. Most people do the same handful of lifts on the same days,
    // and rebuilding that list every session is the friction that sends them
    // back to a notes app.
    routines: [],
    // Which week's challenge has been paid out. Keyed by the week so a new one
    // reopens it and finishing twice inside one week cannot pay twice.
    challenge: { week: null, claimed: false },
    // Best efforts, one per thing worth having a best at. Kept for the same
    // reason as the records: a 5k from last winter is still your 5k.
    bests: {},
    // Exercises this person added themselves. No catalogue is ever finished,
    // and the alternative is logging half a session as "Other".
    exercises: [],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return baseState()
    const parsed = JSON.parse(raw)
    // Shallow-merge onto a fresh base so new fields appear for old saves.
    const merged = { ...baseState(), ...parsed, player: { ...baseState().player, ...parsed.player } }
    // Someone who was training before best efforts existed still has the
    // evidence in their log and on their record board. Read it back once.
    if (!parsed.bests) merged.bests = effortsFromLog(merged.log, merged.records)
    return merged
  } catch {
    return baseState()
  }
}

function toast(state, t) {
  return { ...state, toasts: [...state.toasts, { id: nextId('t'), ...t }] }
}

/**
 * Credits a logged activity to whichever slot accepts it. Everything is
 * measured in minutes so one slot can hold one honest minimum regardless of
 * whether it was filled by a walk, a run or a ride.
 */
function bumpDailies(dailies, act, amount) {
  const mins = minutesOf(act, amount)
  return dailies.map((d) => {
    const slot = DAILY_SLOTS.find((s) => s.id === d.id)
    if (!slot || !slot.accepts.includes(act.id)) return d
    const minutes = Math.round((d.minutes + mins) * 10) / 10
    return {
      ...d,
      minutes,
      done: d.done || minutes >= slot.minMinutes,
      loggedAs: d.loggedAs ?? act.name,
    }
  })
}

/**
 * Hands over a defeated boss's drop. Campaign rewards are guaranteed — the
 * rarity is written into the boss, not rolled — because a story beat you earned
 * by turning up for a week should never come back a common.
 */
function grantBossReward(state, boss) {
  const r = boss.reward
  const drops = []
  let player = { ...state.player, cores: state.player.cores + r.cores }

  if (r.gear) {
    // Boss drops are always a piece of the set that matches their rarity, so a
    // kill visibly moves you toward a matching suit rather than a random tint.
    const slot = EQUIP_SLOTS[Math.floor(Math.random() * EQUIP_SLOTS.length)].key
    const side = OFFHAND_KINDS[Math.floor(Math.random() * OFFHAND_KINDS.length)].id
    const piece = gearPiece(slot, setForRarity(r.gear).id, side)
    player = { ...player, inventory: [...player.inventory, { id: nextId('i'), ...piece, level: 1 }] }
    drops.push({ kind: 'gear', ...piece })
  }

  if (r.pet) {
    const base = CATALOG.pets.find((p) => p.id === r.pet)
    if (player.pets.some((p) => p.ref === base.id)) {
      player = { ...player, cores: player.cores + 500 }
      drops.push({ kind: 'pet', rarity: base.rarity, ref: base.id, name: base.name, duplicate: true })
    } else {
      player = {
        ...player,
        pets: [...player.pets, { id: nextId('p_'), ref: base.id, name: base.name, rarity: base.rarity, stat: base.stat, level: 1, xp: 0 }],
      }
      drops.push({ kind: 'pet', rarity: base.rarity, ref: base.id, name: base.name })
    }
  }

  if (r.title && !player.titles.includes(r.title)) {
    player = { ...player, titles: [...player.titles, r.title] }
  }

  return {
    ...state,
    player,
    lastReward: { kind: 'boss', boss: boss.id, bossName: boss.name, title: r.title, cores: r.cores, drops },
  }
}

/**
 * Every session lands on whichever boss the player is standing in front of.
 * This is the whole reframe: you are not logging exercise, you are hitting the
 * thing between you and the next chapter.
 */
function applyBossDamage(state, act, xp) {
  const { current } = campaignState(state.player, state.campaign)
  if (!current) return state

  const { damage, weak } = bossHit(current, act, xp)
  if (damage <= 0) return state

  const total = state.campaign.damage + damage
  if (total < current.hp) {
    let next = { ...state, campaign: { ...state.campaign, damage: total } }
    if (weak) {
      next = toast(next, {
        kind: 'boss',
        title: `Weakness · ${damage} damage`,
        body: `${current.name} takes double from ${act.name.toLowerCase()}`,
      })
    }
    return next
  }

  let next = {
    ...state,
    campaign: { ...state.campaign, defeated: [...state.campaign.defeated, current.id], damage: 0 },
  }
  next = toast(next, { kind: 'boss', title: `${current.name} is down`, body: current.title })
  return grantBossReward(next, current)
}

/**
 * What the session measured, kept alongside the amount.
 *
 * The amount is one number and every session collapses into it, which is fine
 * for XP and useless for looking back — "45 min" says nothing about whether it
 * was five sets or fifteen. Only the fields the mode actually filled are kept.
 */
function sessionDetail(s, ms) {
  const mode = modeOf(s.activityId)
  if (mode === 'strength') {
    const t = setTotals(s.sets)
    return t.sets ? { mode, ...t, lifts: byLift(s.sets) } : null
  }
  if (mode === 'interval') {
    const cycle = Math.max(1, (s.work ?? INTERVAL.work) + (s.rest ?? INTERVAL.rest))
    const rounds = Math.floor(ms / 1000 / cycle)
    return rounds ? { mode, rounds, work: s.work ?? INTERVAL.work, rest: s.rest ?? INTERVAL.rest } : null
  }
  if (mode === 'distance' && (s.splits?.length || s.points?.length > 1)) {
    return {
      mode,
      splits: (s.splits ?? []).map((sp) => sp.ms),
      metres: Math.round(s.metres),
      // Kept so the walk can be looked at again later, not just counted once.
      route: simplifyRoute(s.points),
    }
  }
  return null
}

function applyLog(state, { activityId, amount, verified, source, detail, sets = [] }) {
  const player = state.player
  const result = resolveActivity(player, { activityId, amount, verified })
  const act = result.activity

  // What this session beat. Read before the board is updated, and only ever for
  // a lift that already had a record — the first time you bench is not a
  // personal best, it is the first entry.
  //
  // The sets come in whole rather than out of `detail`, which stores them
  // grouped by lift: a group knows the heaviest weight in it but not the reps
  // that went with it, and an estimated max needs both.
  const prs = newRecords(state.records, sets).slice(0, PR_PER_SESSION)
  const prXp = prs.length * PR_XP

  // XP + levels. A record pays on top of the session that set it.
  const { level, xp, levelsGained } = grantXp(player.level, player.xp, result.xp + prXp)

  // Stats
  const stats = { ...player.stats }
  for (const [k, v] of Object.entries(result.statGains)) stats[k] = (stats[k] ?? 0) + v

  // Lifetime counters feed the stones
  const lifetime = { ...player.lifetime }
  if (act.id === 'lift') lifetime.volume += amount
  // A tracked gym session now knows what was actually moved, so the stone that
  // counts lifted kilos can finally be fed by the tracker rather than only by
  // the old manual entry.
  if (detail?.mode === 'strength' && detail.volume) lifetime.volume += Math.round(detail.volume)
  if (act.id === 'run' || act.id === 'ride') lifetime.distance += amount
  if (verified) lifetime.sessions += 1
  lifetime.bossKm = Math.round((lifetime.bossKm + result.bossDamage) * 10) / 10

  // Pet rides along on your sessions
  let pets = player.pets
  let petLeveled = null
  if (player.activePetId) {
    pets = player.pets.map((p) => {
      if (p.id !== player.activePetId) return p
      const grown = grantPetXp(p, level, Math.round(result.xp * 0.4))
      if (grown.leveled) petLeveled = grown
      const { leveled: _ignored, ...rest } = grown
      return rest
    })
  }

  const week = {
    ...player.week,
    activeMinutes: player.week.activeMinutes + (act.unit === 'min' ? amount : act.id === 'run' ? amount * 6 : 25),
    km: Math.round((player.week.km + (act.id === 'run' || act.id === 'ride' ? amount : 0)) * 10) / 10,
    sessions: player.week.sessions + 1,
  }

  let next = {
    ...state,
    player: {
      ...player,
      level,
      xp,
      stats,
      lifetime,
      pets,
      week,
      cores: player.cores + result.cores,
    },
    dailies: bumpDailies(state.dailies, act, amount),
    world: { ...state.world, bossKm: state.world.bossKm + result.bossDamage },
    records: foldRecords(state.records, sets),
    lastSets: foldLastSets(state.lastSets, sets),
    bests: foldEfforts(state.bests, { activityId, detail, sets }),
    weeks: foldWeek(state.weeks, { act, amount, xp: result.xp + prXp, detail }),
    log: [
      {
        id: nextId('l'),
        activityId,
        amount,
        verified,
        at: Date.now(),
        xp: result.xp + prXp,
        source: source ?? (verified ? 'Health app' : 'Manual'),
        ...(prs.length ? { prs: prs.map((r) => r.lift) } : null),
        ...(detail ? { detail } : null),
      },
      ...state.log,
    ].slice(0, 40),
  }

  next = toast(next, {
    kind: 'xp',
    title: `+${result.xp + prXp} XP`,
    body: `${act.name} · ${amount}${act.unit === 'kg volume' ? ' kg' : ` ${act.unit}`}${verified ? '' : ' · unverified, half rate'}`,
    stats: result.statGains,
  })
  for (const pr of prs) {
    next = toast(next, {
      kind: 'pr',
      title: `${pr.lift} · personal best`,
      body: `${pr.reps} × ${pr.weight}kg — an estimated ${Math.round(pr.e1rm)}kg max, up from ${Math.round(pr.prev)}kg.`,
    })
  }
  for (const lv of levelsGained) {
    next = toast(next, { kind: 'level', title: `Level ${lv}`, body: 'New level reached. Power recalculated.' })
  }
  if (petLeveled) {
    next = toast(next, { kind: 'pet', title: `${petLeveled.name} → LV ${petLeveled.level}`, body: 'Your pet levelled up' })
  }

  // Moving unlocks today's chest. There is no ladder to climb any more — one
  // chest a day, and every open can roll anything.
  // The week's challenge, checked against the totals this session just changed.
  const weekly = challengeProgress(next)
  if (weekly.done && !weekly.claimed) {
    next = {
      ...next,
      challenge: { week: weekly.key, claimed: true },
      player: { ...next.player, cores: next.player.cores + weekly.challenge.cores },
    }
    next = toast(next, {
      kind: 'chest',
      title: 'Weekly challenge done',
      body: `${weekly.challenge.name} · +${weekly.challenge.cores} cores`,
    })
  }

  const activeDone = next.dailies.find((d) => d.id === 'active')?.done
  if (activeDone && !next.chest.unlocked && !next.chest.openedToday) {
    next = { ...next, chest: { ...next.chest, unlocked: true } }
    next = toast(next, { kind: 'chest', title: 'Chest unlocked', body: 'Open it whenever you like.' })
  }

  const allDone = next.dailies.every((d) => d.done)
  if (allDone && !next.perfectToday) {
    next = { ...next, perfectToday: true, player: { ...next.player, cores: next.player.cores + 250 } }
    next = toast(next, { kind: 'level', title: 'All three done', body: '+250 cores for a full day' })
  }

  next = applyBossDamage(next, act, result.xp + prs.length * PR_DAMAGE)

  // Stones are checked last so a single session can complete one
  const earned = stoneProgress(next.player).filter((s) => s.pct >= 1 && !s.earned)
  if (earned.length) {
    next = {
      ...next,
      player: { ...next.player, stones: [...next.player.stones, ...earned.map((s) => s.key)] },
    }
    for (const s of earned) {
      next = toast(next, { kind: 'stone', title: `${s.name} stone`, body: s.reward, color: s.color })
    }
  }
  return next
}

/** Fabricates the kind of payload a real health provider would push over. */
function syntheticSync(links) {
  const pool = [
    { activityId: 'run', amount: +(3 + Math.random() * 6).toFixed(1) },
    { activityId: 'lift', amount: Math.round((3 + Math.random() * 4) * 1000) },
    { activityId: 'hiit', amount: 10 + Math.round(Math.random() * 4) * 5 },
    { activityId: 'walk', amount: 15 + Math.round(Math.random() * 6) * 5 },
    { activityId: 'sleep', amount: +(6 + Math.random() * 2.5).toFixed(1) },
    { activityId: 'mobility', amount: 10 + Math.round(Math.random() * 4) * 5 },
    { activityId: 'ride', amount: Math.round(8 + Math.random() * 24) },
  ]
  const source = links.length ? links[Math.floor(Math.random() * links.length)] : 'Health app'
  const count = 1 + Math.floor(Math.random() * 2)
  const picks = []
  for (let i = 0; i < count; i++) {
    const p = pool[Math.floor(Math.random() * pool.length)]
    if (!picks.some((x) => x.activityId === p.activityId)) picks.push({ ...p, verified: true, source })
  }
  return picks
}

function reducer(state, action) {
  switch (action.type) {
    case 'onboard': {
      const { name, handle, classId, avatar, health, games } = action
      // Making a character clears the showroom save out from under it. You
      // start at one, with nothing, on a map you have not walked.
      return toast(
        {
          ...state,
          ...FRESH_START,
          onboarded: true,
          player: {
            ...state.player,
            ...FRESH_START.player,
            name,
            handle,
            classId,
            avatar: { ...state.player.avatar, ...avatar },
            games,
          },
          dailies: freshDailies(),
          links: { ...state.links, health },
        },
        { kind: 'level', title: `Welcome, ${name}`, body: 'Level 1. Everything from here is yours.' },
      )
    }

    case 'log':
      return applyLog(state, action)

    // ---------------------------------------------------------- sessions --
    // A workout is a stopwatch the app owns. Everything the log needs — how
    // long, how far, where — is measured while it runs, which is what stops
    // anyone claiming a marathon by dragging a slider.
    case 'startSession':
      if (state.session) return state
      return {
        ...state,
        session: {
          activityId: action.activityId,
          // The lifts you meant to do, in order. A gym session started from a
          // routine carries its plan so the app can work down the list with
          // you rather than asking what is next nineteen times.
          plan: action.plan ?? [],
          startedAt: Date.now(),
          accumulated: 0,
          paused: false,
          metres: 0,
          points: [],
          // A distance session fills splits, a strength session fills sets, an
          // interval session reads its rounds off the clock. All three ride in
          // the same record so a session is one thing, whatever it measures.
          splits: [],
          sets: [],
          work: INTERVAL.work,
          rest: INTERVAL.rest,
        },
      }

    case 'pauseSession':
      if (!state.session || state.session.paused) return state
      return {
        ...state,
        session: {
          ...state.session,
          paused: true,
          accumulated: state.session.accumulated + (Date.now() - state.session.startedAt),
        },
      }

    case 'resumeSession':
      if (!state.session?.paused) return state
      return { ...state, session: { ...state.session, paused: false, startedAt: Date.now() } }

    // A set: which lift, how many reps, how heavy. None of it earns XP — that
    // still comes off the clock, so a typed number cannot be turned into a
    // level. It is a training record, and it is worth keeping for that alone.
    case 'sessionSet': {
      if (!state.session) return state
      const reps = Math.max(1, Math.min(500, Math.round(action.reps)))
      const weight = Math.max(0, Math.min(1000, Math.round((action.weight ?? 0) * 2) / 2))
      return {
        ...state,
        session: {
          ...state.session,
          lift: action.lift ?? state.session.lift,
          sets: [...(state.session.sets ?? []), { lift: action.lift ?? 'Other', reps, weight, at: elapsedMs(state.session) }],
        },
      }
    }

    case 'saveRoutine': {
      const lifts = action.lifts.filter(Boolean)
      if (!lifts.length) return state
      const name = (action.name ?? '').trim() || lifts[0]
      // Saving the same set of lifts twice replaces the first rather than
      // stacking a second identical row up.
      const same = (r) => r.lifts.length === lifts.length && r.lifts.every((l, i) => l === lifts[i])
      const rest = state.routines.filter((r) => !same(r))
      const routine = { id: nextId('r'), name, lifts, at: Date.now() }
      const next = { ...state, routines: [routine, ...rest].slice(0, 12) }
      return toast(next, { kind: 'gear', title: 'Routine saved', body: `${name} · ${lifts.length} lifts` })
    }

    case 'deleteRoutine':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.id) }

    // Which bests are pinned to the profile. Nothing is shown until this is
    // set: a board that fills itself would put your slowest ever kilometre in
    // front of the people you least want to show it to.
    /**
     * A session that happened somewhere else.
     *
     * It goes through exactly the same door as a tracked one — same XP, same
     * records, same ground claimed — because it is the same evidence: a device
     * recorded it, and the file is what the device wrote. The only difference
     * is where it says it came from.
     */
    case 'importWorkout': {
      const { activityId, workout } = action
      const act = ACTIVITIES.find((a) => a.id === activityId)
      if (!act || !(workout?.ms > 0)) return state
      const detail = {
        mode: 'distance',
        splits: workout.splits ?? [],
        metres: Math.round(workout.metres ?? 0),
        route: simplifyRoute(workout.points ?? []),
      }
      const next = applyLog(state, {
        activityId,
        amount: sessionAmount(act, workout.ms, workout.metres),
        verified: true,
        source: 'Imported',
        detail,
        sets: [],
      })
      if (!workout.points?.length) return next
      return { ...next, explored: [...coverPoints(new Set(next.explored), workout.points)] }
    }

    /** An exercise the catalogue does not have. Named once, theirs forever. */
    case 'addExercise': {
      const name = (action.name ?? '').trim().replace(/\s+/g, ' ')
      if (!name || name.length > 40) return state
      if (exerciseByName(name, state.exercises)) return state
      const made = { name, muscle: action.muscle ?? 'full', gear: action.gear ?? 'other', custom: true }
      return { ...state, exercises: [made, ...state.exercises].slice(0, 200) }
    }

    case 'setEfforts':
      return {
        ...state,
        player: { ...state.player, efforts: (action.ids ?? []).filter((id) => state.bests[id]).slice(0, EFFORT_SLOTS) },
      }

    case 'sessionUndoSet': {
      if (!state.session?.sets?.length) return state
      return { ...state, session: { ...state.session, sets: state.session.sets.slice(0, -1) } }
    }

    case 'sessionInterval': {
      if (!state.session) return state
      const clamp = (n) => Math.max(INTERVAL.min, Math.min(INTERVAL.max, Math.round(n)))
      return { ...state, session: { ...state.session, work: clamp(action.work), rest: clamp(action.rest) } }
    }

    // Fixes arrive a few seconds apart; the trace is kept so the map can be
    // opened up by ground actually covered.
    case 'sessionFix': {
      if (!state.session || state.session.paused) return state
      const metres = state.session.metres + action.metres
      // A split lands the moment the trace crosses the next kilometre, so the
      // list builds itself as you run rather than being worked out at the end.
      const splits = state.session.splits ?? []
      const crossed = Math.floor(metres / SPLIT_M)
      const at = elapsedMs(state.session)
      const grown =
        crossed > splits.length
          ? [...splits, { km: splits.length + 1, at, ms: at - (splits[splits.length - 1]?.at ?? 0) }]
          : splits
      return {
        ...state,
        session: {
          ...state.session,
          metres,
          splits: grown,
          // Only fixes that were accepted go on the trace. A glitch that is
          // not counted as distance must not be drawn as a line across the
          // city, or lift the fog off ground nobody walked.
          points: action.keep || !state.session.points.length
            ? [...state.session.points, action.point].slice(-4000)
            : state.session.points,
        },
      }
    }

    case 'discardSession':
      return { ...state, session: null }

    case 'finishSession': {
      const s = state.session
      if (!s) return state
      const act = ACTIVITIES.find((a) => a.id === s.activityId)
      const ms = s.accumulated + (s.paused ? 0 : Date.now() - s.startedAt)
      if (!act || ms < MIN_SESSION_S * 1000) return { ...state, session: null }
      // Tracked by the app, so it counts as verified — this is the path a
      // provider link will one day share.
      const next = applyLog({ ...state, session: null }, {
        activityId: act.id,
        amount: sessionAmount(act, ms, s.metres),
        verified: true,
        source: 'tracked',
        detail: sessionDetail(s, ms),
        sets: s.sets ?? [],
      })
      if (!s.points.length) return next
      return { ...next, explored: [...coverPoints(new Set(next.explored), s.points)] }
    }

    case 'sync': {
      const picks = syntheticSync(state.links.health)
      if (!picks.length) return state
      let next = state
      for (const p of picks) next = applyLog(next, p)
      return next
    }

    // The gift is claimed once, ever. It goes straight into the inventory so it
    // can be tried on immediately rather than sitting in a claim queue.
    case 'openGift': {
      if (!state.gift.pending) return state
      const item = { id: nextId('i'), ...FOUNDER_GIFT }
      return toast(
        {
          ...state,
          gift: { pending: false, opened: true },
          player: { ...state.player, inventory: [...state.player.inventory, item], titles: [...state.player.titles, FOUNDER_GIFT.title] },
        },
        { kind: 'level', title: 'Beta founder', body: `${FOUNDER_GIFT.name} added to your gear` },
      )
    }

    case 'openChest': {
      if (!state.chest.unlocked || state.chest.openedToday) return state
      const result = rollDailyChest(CATALOG)
      let next = { ...state, player: { ...state.player, cores: state.player.cores + result.cores } }

      const inventory = [...next.player.inventory]
      const pets = [...next.player.pets]
      for (const d of result.drops) {
        if (d.kind === 'gear') {
          inventory.push({ id: nextId('i'), ...gearPiece(d.slot, d.set, d.side), level: 1 })
        } else {
          const base = CATALOG.pets.find((p) => p.id === d.ref)
          if (pets.some((p) => p.ref === base.id)) {
            // A duplicate companion converts to cores rather than clutter the roster.
            next = { ...next, player: { ...next.player, cores: next.player.cores + 300 } }
            d.duplicate = true
          } else {
            pets.push({
              id: nextId('p_'),
              ref: base.id,
              name: base.name,
              rarity: base.rarity,
              stat: base.stat,
              level: 1,
              xp: 0,
            })
          }
        }
      }

      return {
        ...next,
        player: { ...next.player, inventory, pets },
        chest: { unlocked: false, openedToday: true },
        lastReward: result,
      }
    }

    case 'dismissReward':
      return { ...state, lastReward: null }

    case 'equip': {
      const item = state.player.inventory.find((i) => i.id === action.itemId)
      if (!item) return state
      return {
        ...state,
        player: { ...state.player, equipped: { ...state.player.equipped, [item.slot]: item.id } },
      }
    }

    case 'equipBest': {
      const equipped = { ...state.player.equipped, ...bestLoadout(state.player.inventory) }
      return toast(
        { ...state, player: { ...state.player, equipped } },
        { kind: 'gear', title: 'Best gear on', body: 'Highest-scoring item in every slot' },
      )
    }

    case 'unequip':
      return {
        ...state,
        player: { ...state.player, equipped: { ...state.player.equipped, [action.slot]: null } },
      }

    case 'upgrade': {
      const item = state.player.inventory.find((i) => i.id === action.itemId)
      if (!item || state.player.cores < action.cost) return state
      return toast(
        {
          ...state,
          player: {
            ...state.player,
            cores: state.player.cores - action.cost,
            inventory: state.player.inventory.map((i) => (i.id === item.id ? { ...i, level: i.level + 1 } : i)),
          },
        },
        {
          kind: 'gear',
          title: `${item.name} → LV ${item.level + 1}`,
          body: `${RARITY[item.rarity].label} upgraded`,
          color: RARITY[item.rarity].color,
        },
      )
    }

    case 'setPet':
      return { ...state, player: { ...state.player, activePetId: action.petId } }

    case 'toggleHealth': {
      const has = state.links.health.includes(action.id)
      const health = has ? state.links.health.filter((h) => h !== action.id) : [...state.links.health, action.id]
      return { ...state, links: { ...state.links, health } }
    }

    case 'toggleGame': {
      const has = state.links.games.includes(action.id)
      const games = has ? state.links.games.filter((g) => g !== action.id) : [...state.links.games, action.id]
      return { ...state, links: { ...state.links, games } }
    }

    case 'post': {
      const post = {
        id: nextId('p'),
        channel: action.channel,
        author: {
          id: 'me',
          name: state.player.name,
          handle: state.player.handle,
          level: state.player.level,
          avatar: state.player.avatar,
          classId: state.player.classId,
        },
        at: Date.now(),
        body: action.body,
        tags: action.tags,
        likes: 0,
        replies: 0,
        mine: true,
      }
      return { ...state, feed: [post, ...state.feed] }
    }

    case 'like': {
      const liked = state.liked.includes(action.postId)
      return {
        ...state,
        liked: liked ? state.liked.filter((p) => p !== action.postId) : [...state.liked, action.postId],
        feed: state.feed.map((p) => (p.id === action.postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p)),
      }
    }

    case 'buyCoaching':
      if (state.purchased.includes(action.id)) return state
      return toast(
        { ...state, purchased: [...state.purchased, action.id] },
        { kind: 'gear', title: 'Session unlocked', body: `${action.name} · lifetime access` },
      )

    // One trip to the arena a day. The damage sticks whether you win or lose,
    // so a bad week costs you the kill rather than the progress — but it does
    // cost you, because you cannot simply swing again until it works.
    case 'battle': {
      const { current } = campaignState(state.player, state.campaign)
      if (!current) return state
      const day = todayKey()
      if (state.campaign.lastFightDay === day) return state
      const dealt = Math.max(0, Math.min(current.hp, Math.round(action.dealt ?? 0)))
      const total = state.campaign.damage + dealt
      const base = { ...state, campaign: { ...state.campaign, lastFightDay: day } }
      if (!action.won || total < current.hp) {
        return {
          ...base,
          campaign: { ...base.campaign, damage: Math.min(current.hp - 1, total) },
        }
      }
      let next = {
        ...base,
        campaign: { ...base.campaign, defeated: [...state.campaign.defeated, current.id], damage: 0 },
      }
      next = toast(next, { kind: 'boss', title: `${current.name} is down`, body: current.title })
      return grantBossReward(next, current)
    }

    case 'bossTick':
      return { ...state, world: { ...state.world, bossKm: state.world.bossKm + action.km } }

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    case 'newDay':
      return {
        ...state,
        dailies: freshDailies(),
        perfectToday: false,
        chest: { unlocked: false, openedToday: false },
        player: { ...state.player, streak: state.player.streak + 1 },
      }

    // Restoring is a whole-save swap. There is no server behind any of this,
    // so a character code is how a character moves between two phones.
    case 'restore': {
      const next = action.state
      if (!next?.player?.name || !Array.isArray(next.player.inventory)) return state
      return toast({ ...next, toasts: state.toasts }, {
        kind: 'level',
        title: `Welcome back, ${next.player.name}`,
        body: 'Character restored on this device.',
      })
    }

    // Testing only. It skips the game rather than playing it, which is exactly
    // what it is for and exactly why it should not survive to launch.
    case 'testAccount':
      return toast(
        {
          ...state,
          ...TEST_ACCOUNT,
          player: {
            ...state.player,
            ...TEST_ACCOUNT.player,
            // The character you built is the thing you are usually testing, so
            // it survives; only the numbers and the kit are replaced.
            avatar: state.player.avatar,
            name: state.onboarded ? state.player.name : TEST_ACCOUNT.player.name,
            handle: state.onboarded ? state.player.handle : TEST_ACCOUNT.player.handle,
          },
          explored: state.explored?.length ? state.explored : INITIAL_STATE.explored,
          // Read out of the seeded log rather than written down beside it, so
          // the test account's bests are the same bests the app would compute.
          bests: effortsFromLog(TEST_ACCOUNT.log, TEST_ACCOUNT.records),
          dailies: freshDailies(),
        },
        { kind: 'level', title: 'Test account', body: 'Level 100 and every drop. Ten bosses still standing.' },
      )

    case 'reset':
      return baseState()

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  const saveRef = useRef(0)

  // Persist, but not on every keystroke-fast dispatch.
  useEffect(() => {
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      try {
        const { toasts: _t, lastReward: _r, ...persist } = state
        localStorage.setItem(SAVE_KEY, JSON.stringify(persist))
      } catch {
        /* storage full or blocked — the session still works, it just won't persist */
      }
    }, 400)
    return () => clearTimeout(saveRef.current)
  }, [state])

  // The world boss is a live event: other players keep chipping at it.
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'bossTick', km: 40 + Math.random() * 180 }), 3200)
    return () => clearInterval(t)
  }, [])

  const api = useMemo(
    () => ({
      log: (payload) => dispatch({ type: 'log', ...payload }),
      sync: () => dispatch({ type: 'sync' }),
      startSession: (activityId, plan) => dispatch({ type: 'startSession', activityId, plan }),
      saveRoutine: (name, lifts) => dispatch({ type: 'saveRoutine', name, lifts }),
      deleteRoutine: (id) => dispatch({ type: 'deleteRoutine', id }),
      setEfforts: (ids) => dispatch({ type: 'setEfforts', ids }),
      addExercise: (name, muscle, gear) => dispatch({ type: 'addExercise', name, muscle, gear }),
      importWorkout: (activityId, workout) => dispatch({ type: 'importWorkout', activityId, workout }),
      pauseSession: () => dispatch({ type: 'pauseSession' }),
      resumeSession: () => dispatch({ type: 'resumeSession' }),
      sessionFix: (point, metres, keep) => dispatch({ type: 'sessionFix', point, metres, keep }),
      sessionSet: (lift, reps, weight) => dispatch({ type: 'sessionSet', lift, reps, weight }),
      sessionUndoSet: () => dispatch({ type: 'sessionUndoSet' }),
      sessionInterval: (work, rest) => dispatch({ type: 'sessionInterval', work, rest }),
      finishSession: () => dispatch({ type: 'finishSession' }),
      discardSession: () => dispatch({ type: 'discardSession' }),
      openChest: () => dispatch({ type: 'openChest' }),
      openGift: () => dispatch({ type: 'openGift' }),
      dismissReward: () => dispatch({ type: 'dismissReward' }),
      equip: (itemId) => dispatch({ type: 'equip', itemId }),
      equipBest: () => dispatch({ type: 'equipBest' }),
      unequip: (slot) => dispatch({ type: 'unequip', slot }),
      upgrade: (itemId, cost) => dispatch({ type: 'upgrade', itemId, cost }),
      setPet: (petId) => dispatch({ type: 'setPet', petId }),
      toggleHealth: (id) => dispatch({ type: 'toggleHealth', id }),
      toggleGame: (id) => dispatch({ type: 'toggleGame', id }),
      post: (payload) => dispatch({ type: 'post', ...payload }),
      like: (postId) => dispatch({ type: 'like', postId }),
      buyCoaching: (id, name) => dispatch({ type: 'buyCoaching', id, name }),
      onboard: (payload) => dispatch({ type: 'onboard', ...payload }),
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),
      newDay: () => dispatch({ type: 'newDay' }),
      restore: (next) => dispatch({ type: 'restore', state: next }),
      reset: () => dispatch({ type: 'reset' }),
      battle: (result) => dispatch({ type: 'battle', ...result }),
      testAccount: () => dispatch({ type: 'testAccount' }),
    }),
    [],
  )

  const value = useMemo(() => ({ state, ...api }), [state, api])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
