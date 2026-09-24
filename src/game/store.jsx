import { useEffect, useMemo, useReducer, useRef } from 'react'
import { GameContext } from './context'
import { BOSS, CATALOG, FRESH_START, INITIAL_STATE, TEST_ACCOUNT, freshDailies, gearPiece } from './data'
import { ACTIVITIES, DAILY_SLOTS, EQUIP_SLOTS, FOUNDER_GIFT, MAX_SHIELDS, OFFHAND_KINDS, RARITY, SHOP_CHESTS, STREAK_TIERS, setForRarity } from './config'
import { INTERVAL, MIN_SESSION_S, SPLIT_M, byLift, elapsedMs, modeOf, sessionAmount, setTotals, simplifyRoute } from './session'
import { coverPoints } from './ground'
import { daysTrained, keepsStreak } from './pillars'
import { MILESTONES, TREAT_PER_SESSION, bestLoadout, bossHit, campaignState, dayKeyOf, dayKeyPlus, daysBetween, feedPet, grantXp, petStage, minutesOf, resolveActivity, rollChest, rollDailyChest, rollMilestone, stoneProgress, todayKey, xpToNext } from './engine'
import { PR_DAMAGE, PR_PER_SESSION, PR_XP, e1rm, foldLastSets, foldRecords, foldWeek, newRecords, weekKey, weekStart } from './progress'
import { beatsRecord } from './coach'
import { challengeProgress } from './challenge'
import { EFFORT_SLOTS, effortsFromLog, foldEfforts } from './efforts'
import { exerciseByName } from './exercises'
import { decodeCard } from './profile'

const SAVE_KEY = 'lvl100.save.v12' // v12: explored ground is real map tiles now, not cells of a drawn Sydney

// How far back a single settlement will reckon. Somebody who comes back after
// six months has lost their streak either way, and walking six months of empty
// days one at a time is work with no answer at the end of it.
const MAX_SETTLE_DAYS = 60

let uid = 0
const nextId = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`

function baseState() {
  return {
    ...structuredClone(INITIAL_STATE),
    world: { bossKm: BOSS.startKm },
    purchased: [],
    lastReward: null,
    // What the last logged session paid, held until the player dismisses it.
    // The moment right after the effort is where "I earned this" happens, so
    // it gets a screen rather than six toasts that scroll past each other.
    sessionReward: null,
    // The highest arena this player has been shown the door to. A promotion is
    // the difference between this and where their level actually puts them, so
    // it survives a reload and cannot fire twice for the same room.
    arenaSeen: 1,
    // A milestone that happened while nobody was looking — a streak tier ticks
    // over at midnight, not at the end of a set. It waits here and pays out on
    // the next session, when there is somebody there to see it.
    pendingMilestone: null,
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
    // Cards other people sent. Not a follow — there is no server to follow
    // anyone on — but the thing a follow would be carrying.
    friends: [],
    // The calendar, in local days.
    //
    // `lastDayKey` is the last day the app settled up on: dailies, the chest
    // and the streak are all reckoned from it, and until it catches up with
    // today none of them have rolled over. `streakDay` is the last day that
    // counted towards the streak, which is a different question — you can
    // open the app every day for a week without training once.
    //
    // A new save starts on today rather than on nothing, so the first launch
    // has no history to settle and cannot cost anybody a streak. This is also
    // the merge base an old save is read onto, which is what upgrades a save
    // from before the day roll existed.
    lastDayKey: todayKey(),
    streakDay: null,
    // The week a rest day was last banked, so the faucet runs once a week
    // however many sessions land after it.
    shieldWeek: null,
  }
}

/** The form an old 1-100 pet level had reached, on the thresholds that were
 *  in force when it was earned. */
function stageForOldLevel(level) {
  if (level >= 85) return 4
  if (level >= 55) return 3
  if (level >= 25) return 2
  return 1
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
    // Somebody who has been training since before arenas existed is already
    // standing in one. Start them where they are rather than marching them
    // through six promotions they earned months ago.
    if (parsed.arenaSeen == null) merged.arenaSeen = campaignState(merged.player, merged.campaign).arena.n
    // Pets used to hold a level from 1 to 100 and ride along on your XP. They
    // hold a form from 1 to 4 now and are moved by treats. A save from before
    // keeps whatever form its old level had earned, so nobody who grew a pet
    // the old way is handed a hatchling.
    // The XP curve was flattened from 120 x level^1.22 to 90 x level^0.95,
    // which cut the road to level 100 from 1.47M XP to 363K.
    //
    // A save from before that keeps its LEVEL, not its banked XP. Re-spending
    // the old total at the new prices is the honest accounting and it is the
    // wrong thing to do: level 27 becomes 45, level 50 becomes 92, and level
    // 75 finishes the game outright. The arenas are the content here, so
    // paying somebody in skipped content is not a reward, it is deleting the
    // part they had not played yet.
    //
    // So: same level, same position inside it, and everything ahead is
    // cheaper. The XP they "lose" was only ever expensive because of prices
    // that no longer exist.
    if (!parsed.curve) {
      const lv = merged.player.level ?? 1
      const oldNeed = Math.round(120 * Math.pow(lv, 1.22))
      const through = oldNeed > 0 ? Math.min(1, (merged.player.xp ?? 0) / oldNeed) : 0
      const need = xpToNext(lv)
      merged.player = {
        ...merged.player,
        xp: Number.isFinite(need) ? Math.min(need - 1, Math.round(through * need)) : 0,
      }
      merged.curve = 2
    }

    // A save from before the day roll existed has no record of which day it
    // was last seen on — the merge above has already given it today. A streak
    // that is already running is anchored to today as well, because breaking
    // somebody's 40-day streak on an update would be a bug they would be right
    // to be furious about.
    if (merged.streakDay == null && (merged.player.streak ?? 0) > 0) merged.streakDay = merged.lastDayKey

    merged.player.treats = merged.player.treats ?? 0
    merged.player.pets = (merged.player.pets ?? []).map((pet) => {
      // TUSKLING was renamed KOOKIE along with its art. A save holding the old
      // ref would look up a drawing that no longer exists and fall back to a
      // puppy, so the ref is rewritten rather than left to fail quietly.
      const ref = pet.ref === 'tuskling' ? 'kookie' : pet.ref
      const name = pet.name === 'TUSKLING' ? 'KOOKIE' : pet.name
      const carried = { ...pet, ref, name }
      return pet.stage
        ? carried
        : { ...carried, stage: stageForOldLevel(pet.level ?? 1), fed: 0, level: undefined, xp: undefined }
    })
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
/**
 * Puts a chest's pulls into the player.
 *
 * Every chest in the game lands here — the free daily one and the ones bought
 * with cores — so a companion you already own converts to cores the same way
 * whichever chest it came out of, and there is one place to change that.
 */
function grantDrops(state, drops) {
  let next = state
  const inventory = [...next.player.inventory]
  const pets = [...next.player.pets]
  for (const d of drops) {
    if (d.kind === 'gear') {
      inventory.push({ id: nextId('i'), ...gearPiece(d.slot, d.set, d.side), level: 1 })
      continue
    }
    const base = CATALOG.pets.find((p) => p.id === d.ref)
    if (pets.some((p) => p.ref === base.id)) {
      // A duplicate companion converts to cores rather than clutter the roster.
      next = { ...next, player: { ...next.player, cores: next.player.cores + 300 } }
      d.duplicate = true
    } else {
      pets.push({ id: nextId('p_'), ref: base.id, name: base.name, rarity: base.rarity, stat: base.stat, level: 1, xp: 0 })
    }
  }
  return { ...next, player: { ...next.player, inventory, pets } }
}

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
        pets: [...player.pets, { id: nextId('p_'), ref: base.id, name: base.name, rarity: base.rarity, stat: base.stat, stage: 1, fed: 0 }],
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
  const c = campaignState(state.player, state.campaign)
  // Damage is banked per boss, because your level decides which one is in
  // front of you and that can change between one session and the next.
  const bank = typeof state.campaign.damage === 'object' && state.campaign.damage ? state.campaign.damage : {}
  // Nothing in front of you: the next bracket is still above your level, or
  // the road is clear. The session still pays everything else.
  if (!c.current) return state

  const { damage, weak } = bossHit(c.current, act, xp)
  if (damage <= 0) return state

  const total = Math.min(c.hp, c.damage + damage)
  const withDamage = { ...state, campaign: { ...state.campaign, damage: { ...bank, [c.current.id]: total } } }

  if (total < c.hp) {
    if (!weak) return withDamage
    return toast(withDamage, {
      kind: 'boss',
      title: `Weakness · ${damage} damage`,
      body: `${c.current.name} takes double from ${act.name.toLowerCase()}`,
    })
  }

  let next = {
    ...withDamage,
    campaign: { ...withDamage.campaign, defeated: [...c.defeated, c.current.id] },
  }
  next = toast(next, { kind: 'boss', title: `${c.current.name} is down`, body: c.current.title })
  return grantBossReward(next, c.current)
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
  if (mode === 'aim') {
    const score = Number(s.score) || 0
    const accuracy = Number(s.accuracy) || 0
    return score > 0 || accuracy > 0 ? { mode, score, accuracy } : null
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

/**
 * `at` is when the session HAPPENED, which is not always now. An imported file
 * is usually last Tuesday's run, and it should land on last Tuesday: in the
 * right week on the chart, in the right place in the log, and — the part that
 * matters — without touching today.
 *
 * So everything that is about today is gated on the entry actually being from
 * today: the dailies, the chest and the streak. Importing a month of old runs
 * pays their XP and fills in the history, and it cannot hand somebody a
 * thirty-day streak they did not live through. It also does not retroactively
 * repair a streak that broke back then, which is a thing Apple's rings do and
 * this does not — said plainly in the importer rather than left to be noticed.
 */
function applyLog(state, { activityId, amount, verified, source, detail, sets = [], at = Date.now() }) {
  const player = state.player
  const result = resolveActivity(player, { activityId, amount, verified, log: state.log })
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

  // A session pays a treat. Which pet it goes to is the player's call, made
  // later on the pet screen — that decision is the whole of the collection.
  const pets = player.pets

  // The streak is claimed by the first real session of the day, not by a clock
  // ticking over at midnight. The number should move while you are standing
  // there having just done the work — that is the entire reason it exists.
  // Everything the streak COSTS is settled in `dayRoll`; this only pays it.
  //
  // "Real" is twenty minutes of getting out or the gym. See `keepsStreak`:
  // sleep and aim training are logged and paid and do not hold a streak.
  const today = todayKey()
  const isToday = dayKeyOf(at) === today
  const claimedToday = state.streakDay === today
  const claimsStreak = isToday && !claimedToday && keepsStreak(act.id, minutesOf(act, amount))
  const streak = claimsStreak ? player.streak + 1 : player.streak
  const streakTier = claimsStreak ? STREAK_TIERS.find((t) => t.days === streak) : null

  const week = {
    ...player.week,
    activeMinutes: player.week.activeMinutes + (act.unit === 'min' ? amount : act.id === 'run' ? amount * 6 : 25),
    km: Math.round((player.week.km + (act.id === 'run' || act.id === 'ride' ? amount : 0)) * 10) / 10,
    sessions: player.week.sessions + 1,
  }

  // The lifetime figure is the longest streak ever held, not the current one,
  // so it only ever goes up.
  lifetime.streak = Math.max(lifetime.streak ?? 0, streak)

  let next = {
    ...state,
    // Training is also being seen, so a session that lands on a new day is
    // allowed to settle it. Without this, logging before the app happened to
    // notice the date would claim the streak on yesterday's key.
    //
    // The streak's own day only moves when the streak was actually claimed —
    // a logged nap has been seen but has not held anything.
    lastDayKey: isToday ? today : state.lastDayKey,
    streakDay: claimsStreak ? today : state.streakDay,
    player: {
      ...player,
      level,
      xp,
      stats,
      lifetime,
      pets,
      week,
      streak,
      cores: player.cores + result.cores,
      treats: (player.treats ?? 0) + TREAT_PER_SESSION,
    },
    dailies: isToday ? bumpDailies(state.dailies, act, amount) : state.dailies,
    world: { ...state.world, bossKm: state.world.bossKm + result.bossDamage },
    records: foldRecords(state.records, sets),
    lastSets: foldLastSets(state.lastSets, sets),
    bests: foldEfforts(state.bests, { activityId, detail, sets }),
    weeks: foldWeek(state.weeks, { act, amount, xp: result.xp + prXp, detail }, at),
    log: [
      {
        id: nextId('l'),
        activityId,
        amount,
        verified,
        at,
        xp: result.xp + prXp,
        source: source ?? (verified ? 'Health app' : 'Manual'),
        ...(prs.length ? { prs: prs.map((r) => r.lift) } : null),
        ...(detail ? { detail } : null),
      },
      ...state.log,
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, 40),
  }

  // Everything this session earned, gathered in one place instead of fired off
  // as six toasts that scroll past. The screen that shows it is the whole point
  // of the loop: you did the thing, here is what it paid.
  const reward = {
    activity: act.name,
    icon: act.icon,
    amount,
    unit: act.unit === 'kg volume' ? 'kg' : act.unit,
    verified,
    // Set only when the entry was bigger than one session can be paid for.
    // Saying so is the difference between a ceiling and a silent shortfall.
    capped: result.capped ? result.paid : null,
    xp: result.xp + prXp,
    coins: result.cores,
    levels: levelsGained,
    stats: result.statGains,
    prs: prs.map((r) => ({ lift: r.lift, reps: r.reps, weight: r.weight, e1rm: r.e1rm, prev: r.prev })),
    drops: [],
    milestones: [],
    treats: TREAT_PER_SESSION,
    damage: 0,
    boss: null,
    stones: [],
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
    reward.coins += weekly.challenge.cores
    reward.milestones.push({ kind: 'goal', label: weekly.challenge.name })
  }

  const activeDone = next.dailies.find((d) => d.id === 'active')?.done
  if (activeDone && !next.chest.unlocked && !next.chest.openedToday) {
    next = { ...next, chest: { ...next.chest, unlocked: true } }
    next = toast(next, { kind: 'chest', title: 'Chest unlocked', body: 'Open it whenever you like.' })
  }

  const allDone = next.dailies.every((d) => d.done)
  if (allDone && !next.perfectToday) {
    next = { ...next, perfectToday: true, player: { ...next.player, cores: next.player.cores + 250 } }
    reward.coins += 250
    reward.milestones.push({ kind: 'day', label: 'All three dailies' })
  }

  // What the session took off the boss in front of you. Read before the damage
  // lands so the number on the screen is this session's, not the running total.
  const before = campaignState(next.player, next.campaign)
  next = applyBossDamage(next, act, result.xp + prs.length * PR_DAMAGE)
  if (before.current) {
    // Read the bank rather than the new campaign state: if the session killed
    // it, the current boss has already moved on and its bar would read zero.
    const bank = next.campaign.damage ?? {}
    const now = Math.min(before.hp, bank[before.current.id] ?? 0)
    reward.boss = { name: before.current.name, hp: before.hp, damage: now }
    reward.damage = Math.max(0, Math.round(now - before.damage))
  }

  // Stones are checked last so a single session can complete one
  const earned = stoneProgress(next.player).filter((s) => s.pct >= 1 && !s.earned)
  if (earned.length) {
    next = {
      ...next,
      player: { ...next.player, stones: [...next.player.stones, ...earned.map((s) => s.key)] },
    }
    reward.stones = earned.map((s) => ({ name: s.name, reward: s.reward, color: s.color }))
  }

  // ---- loot, and only from milestones. Volume does not drop gear; moments do.
  const claims = []
  for (const pr of prs) claims.push({ kind: 'pr', label: `${pr.lift} best` })
  if (streakTier) claims.push({ kind: 'streak', label: `${streakTier.days}-day streak · ${streakTier.label}` })
  if (next.pendingMilestone) claims.push({ kind: next.pendingMilestone.kind, label: next.pendingMilestone.label })
  if (reward.milestones.some((m) => m.kind === 'goal')) claims.push({ kind: 'goal', label: "Week's goal" })

  for (const claim of claims) {
    if (!MILESTONES[claim.kind]) continue
    const drops = rollMilestone(CATALOG, claim.kind)
    next = grantDrops(next, drops)
    reward.drops.push(...drops.map((d) => ({ ...d, from: claim.label })))
  }
  if (next.pendingMilestone) {
    reward.milestones.push({ kind: next.pendingMilestone.kind, label: next.pendingMilestone.label })
    next = { ...next, pendingMilestone: null }
  }
  if (streakTier) {
    reward.milestones.push({ kind: 'streak', label: `${streakTier.days}-day streak · ${streakTier.label}` })
  }
  if (prs.length) reward.milestones.unshift({ kind: 'pr', label: prs.length === 1 ? 'Personal best' : `${prs.length} personal bests` })

  // ---- a rest day, earned by training rather than bought.
  //
  // Peloton's streak counts weeks you hit your workout target, not days,
  // because a gym app that demands seven days a week is telling people to
  // train through a rest day. LVL100's streak is daily — moving counts, not
  // just lifting — so the week is where the forgiveness is earned instead:
  // hit the number of days you set yourself and you have banked one day off.
  //
  // Once a week, and never more than MAX_SHIELDS in the bank.
  const thisWeek = weekKey(Date.now())
  if (next.shieldWeek !== thisWeek && (next.player.shields ?? 0) < MAX_SHIELDS) {
    const goal = next.player.goalDays ?? 4
    if (daysTrained(next.log, weekStart(Date.now())) >= goal) {
      next = {
        ...next,
        shieldWeek: thisWeek,
        player: { ...next.player, shields: (next.player.shields ?? 0) + 1 },
      }
      reward.milestones.push({
        kind: 'shield',
        label: `Rest day banked · ${goal} days done this week`,
      })
    }
  }

  reward.coins = next.player.cores - player.cores
  return { ...next, sessionReward: reward }
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

/**
 * Exported so the tests can drive it directly. Everything the game does to a
 * save goes through here, and a rule like "a missed day costs a shield" is
 * only worth having if something checks it every time the file changes.
 *
 * It sits beside a component, so fast refresh cannot hot-swap this file any
 * more — it reloads it. That is the right trade: a reducer that is never
 * exercised is a reducer that rots, and this one has already shipped one dead
 * branch nothing called.
 */
// oxlint-disable-next-line react/only-export-components
export function reducer(state, action) {
  switch (action.type) {
    case 'onboard': {
      const { name, handle, classId, avatar, health, games, goalDays, picks } = action
      // Making a character clears the showroom save out from under it. You
      // start at one, with nothing, on a map you have not walked.
      return toast(
        {
          ...state,
          ...FRESH_START,
          onboarded: true,
          // A new character has never trained, so it has no day to count from.
          // The showroom's does not carry over.
          lastDayKey: todayKey(),
          streakDay: null,
          shieldWeek: null,
          player: {
            ...state.player,
            ...FRESH_START.player,
            name,
            handle,
            classId,
            avatar: { ...state.player.avatar, ...avatar },
            games,
            // What they said they were here for. The class already carries the
            // XP passive; these two are the answers the rest of the app reads —
            // how many days a week counts as a good week, and what to put under
            // their thumb when they press start.
            goalDays: goalDays ?? 4,
            picks: picks ?? [],
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
      // RPE is optional and only stored when it was actually given — an
      // untouched dial should not read back as "this felt like a 7".
      const rpe = action.rpe ? Math.max(5, Math.min(10, Math.round(action.rpe * 2) / 2)) : undefined
      const set = { lift: action.lift ?? 'Other', reps, weight, at: elapsedMs(state.session) }
      if (action.warmup) set.warmup = true
      if (rpe) set.rpe = rpe
      // Marked here rather than taken from the caller: the board is the only
      // thing that can say whether this was a record, and it is the thing the
      // end-of-session tally will ask too. A flag passed in from a screen is a
      // second opinion that can disagree with the first.
      // Measured against the board AND what this session has already done, so
      // repeating a record set does not mark a second record. The end-of-
      // session tally takes the single best per lift, and these two have to
      // agree or the badges promise more than the payout delivers.
      let bar = state.records?.[set.lift]?.e1rm ?? 0
      for (const x of state.session.sets ?? []) {
        if (x.warmup || (x.lift ?? 'Other') !== set.lift) continue
        bar = Math.max(bar, e1rm(x.reps, x.weight))
      }
      if (!set.warmup && bar && beatsRecord({ [set.lift]: { e1rm: bar } }, set.lift, reps, weight)) set.pr = true
      return {
        ...state,
        session: {
          ...state.session,
          lift: action.lift ?? state.session.lift,
          sets: [...(state.session.sets ?? []), set],
        },
      }
    }

    /**
     * An exercise added to the session you are in.
     *
     * The plan is the session's running order now, not just what a routine
     * walked in with — adding one mid-session appends to it, which is what
     * makes the screen a list you build rather than a form you retype.
     */
    case 'setSplit': {
      return {
        ...state,
        player: {
          ...state.player,
          split: action.split ?? state.player.split,
          goal: action.goal ?? state.player.goal,
        },
      }
    }

    case 'sessionAddLift': {
      if (!state.session) return state
      const lift = String(action.lift ?? '').trim()
      if (!lift) return state
      const plan = state.session.plan ?? []
      const next = plan.includes(lift) ? plan : [...plan, lift]
      return { ...state, session: { ...state.session, plan: next, lift } }
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
        source: action.source ?? 'Imported',
        detail,
        sets: [],
        // The file knows when it happened. Without this every import from a
        // watch would be stamped with the moment it was read, which puts a
        // month of history on one afternoon.
        at: workout.startedAt ?? Date.now(),
      })
      if (!workout.points?.length) return next
      return { ...next, explored: [...coverPoints(new Set(next.explored), workout.points)] }
    }

    /**
     * A friend, from the card they sent you.
     *
     * Keyed on the handle: a newer card from the same person replaces the one
     * you have rather than stacking a second of them up, which is also how
     * "refresh" works — they send again, you paste again.
     */
    case 'addFriend': {
      const card = decodeCard(action.code)
      if (!card) return state
      if (card.handle && card.handle === state.player.handle) return state
      const rest = state.friends.filter((f) => (f.handle ?? f.name) !== (card.handle ?? card.name))
      const had = rest.length !== state.friends.length
      return toast(
        { ...state, friends: [{ ...card, addedAt: Date.now() }, ...rest].slice(0, 50) },
        {
          kind: 'gear',
          title: had ? `${card.name} updated` : `${card.name} added`,
          body: had ? 'Their card is now the one they just sent.' : `Level ${card.level} · ${card.rank ?? ''}`.trim(),
        },
      )
    }

    case 'removeFriend':
      return { ...state, friends: state.friends.filter((f) => (f.handle ?? f.name) !== action.handle) }

    /** The two things on a profile that are yours to write. */
    case 'editProfile': {
      const name = (action.name ?? '').trim().slice(0, 18)
      const handle = (action.handle ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18)
      if (!name || !handle) return state
      return { ...state, player: { ...state.player, name, handle } }
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
    // Typed rather than measured, because the app cannot see inside an aim
    // trainer. It is still evidence: the number only counts for a session the
    // app timed, so nobody can claim a score without spending the minutes.
    case 'sessionScore': {
      if (!state.session) return state
      return {
        ...state,
        session: {
          ...state.session,
          score: Math.max(0, Math.min(9999999, Number(action.score) || 0)),
          accuracy: Math.max(0, Math.min(100, Number(action.accuracy) || 0)),
        },
      }
    }

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
      const next = grantDrops(
        { ...state, player: { ...state.player, cores: state.player.cores + result.cores } },
        result.drops,
      )
      return { ...next, chest: { unlocked: false, openedToday: true }, lastReward: result }
    }

    case 'buyChest': {
      const spec = SHOP_CHESTS.find((c) => c.id === action.id)
      // Guarded here and not only in the button: an action that trusts the UI
      // for whether you can afford it is an action that can be replayed.
      if (!spec || state.player.cores < spec.cost) return state
      const drops = rollChest(CATALOG, spec)
      const next = grantDrops(
        { ...state, player: { ...state.player, cores: state.player.cores - spec.cost } },
        drops,
      )
      return { ...next, lastReward: { kind: 'shop', name: spec.name, art: spec.art, spent: spec.cost, drops } }
    }

    case 'dismissReward':
      return { ...state, lastReward: null }

    case 'dismissSessionReward':
      return { ...state, sessionReward: null }

    // The promotion has been read. Never again for this room.
    case 'seeArena':
      return { ...state, arenaSeen: Math.max(state.arenaSeen ?? 1, action.n) }

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

    /**
     * Spend treats on one pet. The reducer does the arithmetic rather than the
     * screen, because a button that trusts the UI for how many treats you have
     * is a button that can be pressed twice.
     */
    case 'feedPet': {
      const pet = state.player.pets.find((p) => p.id === action.petId)
      if (!pet) return state
      const have = state.player.treats ?? 0
      const want = Math.max(0, Math.min(have, Math.floor(action.treats ?? 1)))
      if (!want) return state
      const { pet: fedPet, spent, grew } = feedPet(pet, want)
      if (!spent) return state
      const next = {
        ...state,
        player: {
          ...state.player,
          treats: have - spent,
          pets: state.player.pets.map((p) => (p.id === pet.id ? fedPet : p)),
        },
      }
      if (!grew) return next
      return toast(next, {
        kind: 'level',
        title: `${pet.name} evolved`,
        body: `Now ${petStage(fedPet.stage).name.toLowerCase()}`,
      })
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
      const c = campaignState(state.player, state.campaign)
      if (!c.current) return state
      const day = todayKey()
      if (state.campaign.lastFightDay === day) return state
      const bank = typeof state.campaign.damage === 'object' && state.campaign.damage ? state.campaign.damage : {}
      const dealt = Math.max(0, Math.min(c.hp, Math.round(action.dealt ?? 0)))
      const total = c.damage + dealt
      const base = { ...state, campaign: { ...state.campaign, lastFightDay: day } }
      if (!action.won || total < c.hp) {
        return {
          ...base,
          campaign: { ...base.campaign, damage: { ...bank, [c.current.id]: Math.min(c.hp - 1, total) } },
        }
      }
      let next = {
        ...base,
        campaign: {
          ...base.campaign,
          damage: { ...bank, [c.current.id]: c.hp },
          defeated: [...c.defeated, c.current.id],
        },
      }
      next = toast(next, { kind: 'boss', title: `${c.current.name} is down`, body: c.current.title })
      return grantBossReward(next, c.current)
    }

    case 'bossTick':
      return { ...state, world: { ...state.world, bossKm: state.world.bossKm + action.km } }

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    /**
     * Midnight, settled up whenever the app next notices.
     *
     * A phone app is not running at midnight, so the day cannot roll over on a
     * timer — it rolls over the next time somebody looks, and has to cope with
     * "the next time somebody looks" being a fortnight later. So this is
     * written as a settlement rather than a tick: it looks at how far the
     * calendar has moved since `lastDayKey` and works out what that costs.
     *
     * Dailies, the chest and the perfect-day flag simply reset. The streak is
     * the part with a rule behind it, and the rule is: every day that went by
     * without a session takes a shield, and the first missed day with no
     * shield left ends the streak.
     *
     * Note what this case does NOT do: it never adds to the streak. Training
     * is what adds to it, and that happens in `applyLog` the moment the
     * session is saved. This side only ever takes away.
     */
    case 'dayRoll': {
      // Injectable so the tests can move the calendar without moving the clock.
      const today = action.today ?? todayKey()
      const last = state.lastDayKey

      // Nothing to settle: same day, or a save that has never been seen before
      // and so has no history to hold against anybody.
      if (last === today) return state
      if (!last) return { ...state, lastDayKey: today, streakDay: state.streakDay ?? today }

      // A clock that has gone backwards — a timezone flight, a device with the
      // date set wrong. Adopt the new day and settle nothing, because the
      // alternative is charging somebody for days that have not happened.
      if (daysBetween(last, today) <= 0) return { ...state, lastDayKey: today }

      const fresh = {
        ...state,
        lastDayKey: today,
        dailies: freshDailies(),
        perfectToday: false,
        chest: { unlocked: false, openedToday: false },
      }

      // Days that came and went with nothing logged. The day the streak was
      // last claimed does not count against itself, and today is not over yet
      // — which is why a streak never breaks on the day you open the app, only
      // on the days you did not.
      const anchor = state.streakDay ?? last
      const gone = Math.max(0, Math.min(daysBetween(anchor, today), MAX_SETTLE_DAYS) - 1)
      if (!state.player.streak || !gone) return fresh

      const saved = Math.min(state.player.shields ?? 0, gone)
      const broke = gone > saved
      let next = {
        ...fresh,
        player: {
          ...fresh.player,
          streak: broke ? 0 : state.player.streak,
          shields: (state.player.shields ?? 0) - saved,
        },
        // A broken streak starts again from nothing, so it has no anchor. A
        // saved one is anchored to the last day a shield covered, which keeps
        // the next settlement's arithmetic honest.
        streakDay: broke ? null : saved ? dayKeyPlus(today, -1) : state.streakDay,
      }

      if (saved) {
        next = toast(next, {
          kind: 'streak',
          title: saved === 1 ? 'Streak shield used' : `${saved} streak shields used`,
          body: `${state.player.streak} days still standing. ${next.player.shields} shield${next.player.shields === 1 ? '' : 's'} left.`,
        })
      }
      if (broke) {
        next = toast(next, {
          kind: 'streak',
          title: 'Streak reset',
          body: `${state.player.streak} days ended. The next one starts with your next session.`,
        })
      }
      return next
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
          // Dropped in at level 100, not promoted there — otherwise the first
          // thing the test account does is congratulate you on nine rooms you
          // did not walk through.
          arenaSeen: campaignState({ ...state.player, ...TEST_ACCOUNT.player }, TEST_ACCOUNT.campaign ?? state.campaign)
            .arena.n,
        },
        { kind: 'level', title: 'Test account', body: 'Level 100, every drop, and LVL100 itself still standing.' },
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
        const { toasts: _t, lastReward: _r, sessionReward: _s, ...persist } = state
        localStorage.setItem(SAVE_KEY, JSON.stringify(persist))
      } catch {
        /* storage full or blocked — the session still works, it just won't persist */
      }
    }, 400)
    return () => clearTimeout(saveRef.current)
  }, [state])

  // Catch the day up. Once on mount, and again every time the app is brought
  // back to the front — a phone app is asleep at midnight, so the only moment
  // it can notice the date has changed is the moment somebody opens it.
  useEffect(() => {
    const roll = () => dispatch({ type: 'dayRoll' })
    roll()
    const onShow = () => {
      if (document.visibilityState === 'visible') roll()
    }
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('focus', roll)
    return () => {
      document.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('focus', roll)
    }
  }, [])

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
      addFriend: (code) => dispatch({ type: 'addFriend', code }),
      removeFriend: (handle) => dispatch({ type: 'removeFriend', handle }),
      editProfile: (name, handle) => dispatch({ type: 'editProfile', name, handle }),
      importWorkout: (activityId, workout, source) => dispatch({ type: 'importWorkout', activityId, workout, source }),
      pauseSession: () => dispatch({ type: 'pauseSession' }),
      resumeSession: () => dispatch({ type: 'resumeSession' }),
      sessionFix: (point, metres, keep) => dispatch({ type: 'sessionFix', point, metres, keep }),
      sessionScore: (score, accuracy) => dispatch({ type: 'sessionScore', score, accuracy }),
      sessionSet: (lift, reps, weight, opts = {}) =>
        dispatch({ type: 'sessionSet', lift, reps, weight, warmup: opts.warmup, rpe: opts.rpe }),
      setSplit: (split, goal) => dispatch({ type: 'setSplit', split, goal }),
      sessionAddLift: (lift) => dispatch({ type: 'sessionAddLift', lift }),
      sessionUndoSet: () => dispatch({ type: 'sessionUndoSet' }),
      sessionInterval: (work, rest) => dispatch({ type: 'sessionInterval', work, rest }),
      finishSession: () => dispatch({ type: 'finishSession' }),
      discardSession: () => dispatch({ type: 'discardSession' }),
      openChest: () => dispatch({ type: 'openChest' }),
      buyChest: (id) => dispatch({ type: 'buyChest', id }),
      openGift: () => dispatch({ type: 'openGift' }),
      dismissReward: () => dispatch({ type: 'dismissReward' }),
      dismissSessionReward: () => dispatch({ type: 'dismissSessionReward' }),
      seeArena: (n) => dispatch({ type: 'seeArena', n }),
      equip: (itemId) => dispatch({ type: 'equip', itemId }),
      equipBest: () => dispatch({ type: 'equipBest' }),
      unequip: (slot) => dispatch({ type: 'unequip', slot }),
      upgrade: (itemId, cost) => dispatch({ type: 'upgrade', itemId, cost }),
      setPet: (petId) => dispatch({ type: 'setPet', petId }),
      feedPet: (petId, treats = 1) => dispatch({ type: 'feedPet', petId, treats }),
      toggleHealth: (id) => dispatch({ type: 'toggleHealth', id }),
      toggleGame: (id) => dispatch({ type: 'toggleGame', id }),
      like: (postId) => dispatch({ type: 'like', postId }),
      buyCoaching: (id, name) => dispatch({ type: 'buyCoaching', id, name }),
      onboard: (payload) => dispatch({ type: 'onboard', ...payload }),
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),
      dayRoll: () => dispatch({ type: 'dayRoll' }),
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
