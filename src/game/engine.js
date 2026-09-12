// Pure game logic. No React, no storage, no side effects — every function here
// takes state in and hands numbers back, which keeps the balance testable.

import {
  ACTIVITIES,
  DAILY_CHEST,
  CLASSES,
  MAX_LEVEL,
  RANKS,
  RARITY,
  RARITY_ORDER,
  STAT_KEYS,
  STONES,
  STREAK_TIERS,
  UNVERIFIED_XP_MULT,
  EQUIP_SLOTS,
  OFFHAND_KINDS,
  setForRarity,
} from './config'
import { CAMPAIGN, WEAK_MULT } from './campaign'

// ------------------------------------------------------------------ progression

/** XP required to go from `level` to `level + 1`. */
export function xpToNext(level) {
  if (level >= MAX_LEVEL) return Infinity
  return Math.round(120 * Math.pow(level, 1.22))
}

/** Applies XP to a level/xp pair, cascading through as many levels as it earns. */
export function grantXp(level, xp, amount) {
  let lv = level
  let cur = xp + amount
  const levelsGained = []
  while (lv < MAX_LEVEL && cur >= xpToNext(lv)) {
    cur -= xpToNext(lv)
    lv += 1
    levelsGained.push(lv)
  }
  if (lv >= MAX_LEVEL) cur = 0
  return { level: lv, xp: cur, levelsGained }
}

/** Individual stat levels use a flatter curve so stats visibly move each week. */
export function statLevel(statXp) {
  return Math.max(1, Math.floor(Math.pow(statXp / 55, 0.62)) + 1)
}
// ---------------------------------------------------------------------- streaks

export function streakTier(days) {
  let tier = { days: 0, mult: 1, label: 'Cold' }
  for (const t of STREAK_TIERS) if (days >= t.days) tier = t
  return tier
}

// -------------------------------------------------------------------- character

export function classById(id) {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0]
}

/** Flat stat bonuses contributed by equipped gear. */
export function gearBonuses(player) {
  const out = Object.fromEntries(STAT_KEYS.map((k) => [k, 0]))
  for (const id of Object.values(player.equipped)) {
    const item = player.inventory.find((i) => i.id === id)
    // A piece with no stats on it can only come from a restored save written by
    // another version. It contributes nothing rather than taking the app down.
    if (!item?.stats || !RARITY[item.rarity]) continue
    const mult = RARITY[item.rarity].mult
    for (const [stat, base] of Object.entries(item.stats)) {
      out[stat] += Math.round(base * mult * (1 + (item.level - 1) * 0.35))
    }
  }
  return out
}

export function activePet(player) {
  return player.pets.find((p) => p.id === player.activePetId) ?? null
}

/** Pets give a percentage buff to one stat, scaling with pet level and rarity. */
export function petBonus(player) {
  const pet = activePet(player)
  if (!pet) return null
  const r = RARITY[pet.rarity]
  return { stat: pet.stat, pct: Math.round((3 + pet.level * 0.12) * r.mult) }
}

/**
 * Power is the single headline number: stat levels + gear + pet + streak.
 * Everything competitive (rank, leaderboards) reads from this.
 */
export function powerScore(player) {
  const gear = gearBonuses(player)
  let base = 0
  for (const k of STAT_KEYS) base += statLevel(player.stats[k]) * 12 + gear[k] * 4
  const pet = petBonus(player)
  if (pet) base *= 1 + pet.pct / 100
  base *= streakTier(player.streak).mult
  base += player.level * 8
  base += player.stones.length * 120
  return Math.round(base)
}

export function rankFor(power) {
  let rank = RANKS[0]
  for (const r of RANKS) if (power >= r.min) rank = r
  const idx = RANKS.indexOf(rank)
  const next = RANKS[idx + 1] ?? null
  const pct = next ? (power - rank.min) / (next.min - rank.min) : 1
  return { rank, next, pct: Math.min(1, Math.max(0, pct)) }
}

// ------------------------------------------------------------------------- loot

function weightedRarity(rng, floorKey = 'common') {
  const floorIdx = RARITY_ORDER.indexOf(floorKey)
  const pool = RARITY_ORDER.slice(floorIdx)
  const total = pool.reduce((sum, k) => sum + RARITY[k].weight, 0)
  let roll = rng() * total
  for (const k of pool) {
    roll -= RARITY[k].weight
    if (roll <= 0) return k
  }
  return pool[0]
}

/**
 * Rolls a chest: `rolls` pulls with `floor` as the worst rarity that can come
 * out. The ceiling is always legendary, so every chest in the game carries a
 * real chance of something great — what you pay for is the floor.
 */
export function rollChest(catalog, { rolls, floor = 'common' }, rng = Math.random) {
  const drops = []
  for (let i = 0; i < rolls; i++) {
    const rarity = weightedRarity(rng, floor)
    // Seasonal pets are the world-raid reward. If the chest could roll one the
    // reward would stop meaning anything, so they never enter the pool.
    const petEligible = catalog.pets.filter((p) => p.rarity === rarity && !p.seasonal)
    if (petEligible.length && rng() < 0.16) {
      const pet = petEligible[Math.floor(rng() * petEligible.length)]
      drops.push({ kind: 'pet', rarity, ref: pet.id, name: pet.name })
      continue
    }
    // Rarity picks the set, so the frame colour and the armour always agree.
    const slot = EQUIP_SLOTS[Math.floor(rng() * EQUIP_SLOTS.length)].key
    const set = setForRarity(rarity)
    // The offhand rolls a side as well as a set, so it can drop either.
    const side = slot === 'offhand' ? OFFHAND_KINDS[Math.floor(rng() * OFFHAND_KINDS.length)] : null
    const label = side ? side.name : EQUIP_SLOTS.find((s) => s.key === slot).name
    drops.push({ kind: 'gear', rarity, slot, set: set.id, side: side?.id, name: `${set.short} ${label}` })
  }
  return drops
}

/**
 * Loot from a milestone, not from volume.
 *
 * Coins come from showing up; the good drops come from moments. A personal
 * best, a streak tier, a week's goal met, a boss down. This is what stops the
 * app nudging anyone to grind more volume every day to feel rewarded — the rare
 * stuff is gated behind occasional effort, which is the healthy shape, and it
 * pays a runner and a lifter the same way.
 */
export const MILESTONES = {
  pr: { floor: 'uncommon', label: 'Personal best' },
  streak: { floor: 'rare', label: 'Streak tier' },
  goal: { floor: 'rare', label: "Week's goal" },
}

export function rollMilestone(catalog, kind, rng = Math.random) {
  const spec = MILESTONES[kind]
  if (!spec) return []
  return rollChest(catalog, { rolls: 1, floor: spec.floor }, rng)
}

/** The free one. It pays cores as well as dropping, which no bought chest does. */
export function rollDailyChest(catalog, rng = Math.random) {
  return { cores: DAILY_CHEST.cores, drops: rollChest(catalog, DAILY_CHEST, rng) }
}

// ------------------------------------------------------------------- campaign
// The story ladder. There is no separate campaign currency and no second kind
// of session: the XP a workout is already worth is the damage it deals, so the
// player never has to choose between levelling and progressing the story.

/**
 * Which boss you are on, and how much of it is left.
 *
 * This used to be an unlock ladder: beat one, unlock the next, and if your
 * level was too low for whatever came after, stand in a "4 more levels" dead
 * end with nothing to hit. Now the boss IS your level bracket. Whatever level
 * you are decides who is in front of you, so there is never a gap and never a
 * gate — the first session of the game already lands on something.
 *
 * The important part is that its HP is not authored, it is DERIVED: a boss has
 * exactly as much health as the XP it takes to cross its bracket. That makes
 * the health bar and the level bar the same bar wearing different clothes —
 * you are not grinding a rank beside a boss, you are beating the boss, and
 * levelling up is what beating it looks like from the other side.
 *
 * Authored HP could not do this. It ran at 8-19% of a bracket's XP, so every
 * boss died a fifth of the way through its own level range and left the rest
 * of it empty.
 *
 * Weakness damage is what remains of the old ceiling: hitting a boss with what
 * it is weak to counts double, so training the right thing puts it down early
 * and the rest of the bracket is a victory lap.
 */
export function bracketXp(from, to) {
  let xp = 0
  // Stops at MAX_LEVEL: xpToNext(MAX_LEVEL) is Infinity, and one Infinity in
  // the sum makes the last boss's health bar unreadable and unbeatable.
  const end = Math.min(to, MAX_LEVEL)
  for (let lv = from; lv < end; lv++) xp += xpToNext(lv)
  return xp
}

export function campaignState(player, campaign) {
  const defeated = campaign?.defeated ?? []
  // Older saves kept one running total for whichever boss was current. Damage
  // is per-boss now, because the boss changes as you climb.
  const dealt = typeof campaign?.damage === 'object' && campaign.damage ? campaign.damage : {}

  // Always the first one still standing, so nothing can be skipped by
  // out-levelling it. Your level decides whether you have reached it yet.
  const at = CAMPAIGN.findIndex((b) => !defeated.includes(b.id))
  const finished = at === -1
  const idx = finished ? CAMPAIGN.length - 1 : at
  const boss = finished ? null : CAMPAIGN[idx]
  const reached = Boolean(boss) && player.level >= boss.level
  const next = CAMPAIGN[idx + 1] ?? null

  // The bracket this boss owns: from its own level up to the next one's.
  const from = boss ? boss.level : MAX_LEVEL
  const to = next ? next.level : MAX_LEVEL + 1
  const hp = boss ? Math.max(1, bracketXp(from, to)) : 0
  const damage = boss ? Math.min(hp, dealt[boss.id] ?? 0) : 0

  return {
    defeated,
    // The boss you are actually swinging at, or null while a bracket is out
    // of reach or the road is clear.
    current: reached ? boss : null,
    locked: reached ? null : boss,
    gatedBy: reached || !boss ? 0 : boss.level - player.level,
    next,
    hp,
    damage,
    // Where this boss sits on the ladder, and what levels it covers.
    index: idx,
    from,
    to,
    band: `LEVEL ${from}-${Math.min(to - 1, MAX_LEVEL)}`,
    cleared: defeated.length,
    total: CAMPAIGN.length,
    pct: hp ? Math.min(1, damage / hp) : 0,
    finished,
  }
}

/** What one logged session does to a boss. Its XP, doubled on the weakness. */
export function bossHit(boss, act, xp) {
  if (!boss) return { damage: 0, weak: false }
  const weak = Boolean(boss.weak && act.tag === boss.weak)
  return { damage: Math.round(xp * (weak ? WEAK_MULT : 1)), weak }
}

// -------------------------------------------------------------------- activities

export function activityById(id) {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[0]
}

/**
 * Turns a logged activity into rewards. Verified entries (synced from a health
 * provider) pay full; manual entries are halved and flagged, which is what stops
 * the leaderboards from being a typing contest.
 */
/**
 * What a session is worth in coins, measured against your own normal.
 *
 * A flat rate per block punished exactly the person this app is trying to win.
 * A five-kilometre run paid forty and a twenty-minute walk paid sixteen, so the
 * sedentary convert taking their first walk earned a third of what a runner
 * earned for an easy Tuesday — and the walk was the harder thing to do.
 *
 * So most of the payout is for showing up, and the rest is scaled to YOUR
 * median session rather than to an absolute. Turning up pays. Going longer than
 * you usually do pays more. Somebody else's longer is not part of the sum.
 */
const SESSION_COINS = 60
const BASELINE_FLOOR_MIN = 15

export function baselineMinutes(log = []) {
  const mins = log
    .slice(0, 20)
    .map((l) => {
      const act = activityById(l.activityId)
      return act ? minutesOf(act, l.amount) : 0
    })
    .filter((m) => m > 0)
    .sort((a, b) => a - b)
  if (!mins.length) return BASELINE_FLOOR_MIN
  return Math.max(BASELINE_FLOOR_MIN, mins[Math.floor(mins.length / 2)])
}

export function coinsFor(player, log, act, amount, verified) {
  const mins = minutesOf(act, amount)
  const mine = baselineMinutes(log)
  const ratio = Math.min(1.75, Math.max(0.25, mins / mine))
  // 0.8x for a short one, 2x for a long one. Showing up is most of it.
  const effort = 0.6 + 0.8 * ratio
  // ...but showing up has to mean a session. Without this taper the minimum
  // loggable sixty seconds paid the same as a ten-minute walk, and the fastest
  // way to earn was to start and stop the timer.
  const real = Math.min(1, mins / 10)
  const streak = streakTier(player.streak).mult
  return Math.max(5, Math.round(SESSION_COINS * effort * real * streak * (verified ? 1 : 0.5)))
}

export function resolveActivity(player, { activityId, amount, verified, log = [] }) {
  const act = activityById(activityId)
  const blocks = amount / act.per
  const cls = classById(player.classId)

  let xpMult = 1
  const passive = cls.passive
  if (passive.type === 'xp' && (passive.tags.includes('*') || passive.tags.includes(act.tag))) {
    xpMult += passive.value
  }
  xpMult *= streakTier(player.streak).mult
  if (!verified) xpMult *= UNVERIFIED_XP_MULT

  const pet = petBonus(player)
  const statGains = {}
  for (const [stat, per] of Object.entries(act.stats)) {
    let gain = per * blocks
    if (pet && pet.stat === stat) gain *= 1 + pet.pct / 100
    if (player.stones.includes('power') && stat === 'STR') gain *= 1.05
    if (player.stones.includes('space') && stat === 'END') gain *= 1.05
    if (player.stones.includes('mind') && stat === 'FOCUS') gain *= 2
    statGains[stat] = Math.round(gain)
  }

  return {
    xp: Math.round(act.xp * blocks * xpMult),
    statGains,
    cores: coinsFor(player, log, act, amount, verified),
    bossDamage: act.boss ? Math.round(act.boss * amount * 10) / 10 : 0,
    verified,
    activity: act,
    amount,
  }
}

/** Pets level from your sessions but can never out-level you — they ride along. */
export function petXpToNext(level) {
  return Math.round(180 * Math.pow(level, 1.1))
}

export function grantPetXp(pet, playerLevel, amount) {
  let { level, xp } = pet
  xp += amount
  let leveled = false
  while (level < Math.min(playerLevel, MAX_LEVEL) && xp >= petXpToNext(level)) {
    xp -= petXpToNext(level)
    level += 1
    leveled = true
  }
  if (level >= Math.min(playerLevel, MAX_LEVEL)) xp = Math.min(xp, petXpToNext(level) - 1)
  return { ...pet, level, xp, leveled }
}

/** Evolution stages mirror the collection art: 1 / 25 / 50 / 75 / 100. */
export function petStage(level) {
  if (level >= 100) return { idx: 4, name: 'ASCENDED', scale: 1.32, aura: true }
  if (level >= 75) return { idx: 3, name: 'PRIME', scale: 1.2, aura: false }
  if (level >= 50) return { idx: 2, name: 'ADULT', scale: 1.1, aura: false }
  if (level >= 25) return { idx: 1, name: 'JUVENILE', scale: 1.02, aura: false }
  return { idx: 0, name: 'HATCHLING', scale: 0.9, aura: false }
}

/** How many minutes of effort an amount of an activity represents. */
export function minutesOf(act, amount) {
  return (act.minPerUnit ?? 0) * amount
}

/**
 * Picks the strongest item per slot. Rarity multiplies everything, so a
 * legendary at level 1 can still beat a common at level 5 — this compares the
 * same score the character sheet displays rather than raw level.
 */
export function itemScore(item) {
  const base = Object.values(item.stats).reduce((a, b) => a + b, 0)
  return base * RARITY[item.rarity].mult * (1 + (item.level - 1) * 0.35)
}

/**
 * What the player is actually wearing, as items rather than as ids.
 *
 * `player.equipped` is a map of slot to inventory id, which is the right thing
 * to store and the wrong thing to draw: everything that paints a character
 * needs the item — its set for the palette, its rarity for the aura. Each
 * caller was doing this lookup for itself, and the one that forgot handed the
 * arena a map of bare strings, so the hero walked into every fight in his
 * underclothes with a maxed set of legendary plate in the bag.
 */
export function wornGear(player) {
  const out = {}
  for (const [slot, id] of Object.entries(player.equipped ?? {})) {
    const item = player.inventory?.find((i) => i.id === id)
    if (item) out[slot] = item
  }
  return out
}

export function bestLoadout(inventory) {
  const best = {}
  for (const item of inventory) {
    const cur = best[item.slot]
    if (!cur || itemScore(item) > itemScore(cur)) best[item.slot] = item
  }
  return Object.fromEntries(Object.entries(best).map(([slot, item]) => [slot, item.id]))
}

// ------------------------------------------------------------------ the arena
// Sessions wear a boss down between visits. The arena is where you go and
// finish it — and where you can fail, which is the point of it. Two things
// decide a fight, and both are things the player controls: the week they have
// just had, and the kit they chose to walk in wearing.

const FIGHT_ROUNDS = 6
const FORM_WINDOW_MS = 7 * 24 * 3600 * 1000

/** Four sessions in seven days is par. Below it you swing tired. */
export function formOf(log, now = Date.now()) {
  const recent = (log ?? []).filter((l) => l.at >= now - FORM_WINDOW_MS)
  const sessions = recent.length
  const xp = recent.reduce((n, l) => n + (l.xp ?? 0), 0)
  const mult = Math.min(1.7, Math.max(0.5, 0.5 + sessions * 0.13 + Math.min(0.35, xp / 5000)))
  const band =
    mult >= 1.35
      ? { label: 'PEAKING', color: 'var(--color-lime)' }
      : mult >= 1.05
        ? { label: 'SHARP', color: 'var(--color-cyan)' }
        : mult >= 0.8
          ? { label: 'RUSTY', color: 'var(--color-gold)' }
          : { label: 'COLD', color: 'var(--color-danger)' }
  return { sessions, xp, mult, ...band }
}

/** What you bring: the kit on your back, sharpened or blunted by the week. */
export function fightPower(player, log, now) {
  const gear = Object.values(player.equipped).reduce((n, id) => {
    const item = player.inventory.find((i) => i.id === id)
    return n + (item ? itemScore(item) : 0)
  }, 0)
  const form = formOf(log, now)
  const bonus = gearBonuses(player)
  return {
    gear: Math.round(gear),
    form,
    attack: Math.max(12, Math.round((gear * 2.4 + player.level * 5) * form.mult)),
    // The week decides how long you last as well as how hard you hit. Without
    // that, a fully geared character who had not trained in a fortnight still
    // walked out of every fight standing, and the mechanic had no teeth.
    hp: Math.round((140 + gear * 1.6 + bonus.VIT * 3 + player.level * 7) * (0.65 + form.mult * 0.35)),
  }
}

/**
 * What a character who has kept up is expected to swing for at a given level.
 *
 * Shares the XP curve's exponent on purpose: a boss's health is the XP of its
 * level bracket, so the yardstick for hitting it has to grow the same shape.
 */
function parAttack(level) {
  return Math.round(60 + Math.pow(level, 1.22) * 6.5)
}

/** One swing, in the boss's own units. Six of these is a whole visit. */
export function swingFor(player, log, boss, hp) {
  const me = fightPower(player, log)
  const ratio = Math.min(2.2, Math.max(0.3, me.attack / parAttack(boss.level)))
  return Math.max(1, Math.round(hp * 0.075 * ratio))
}

/**
 * Six rounds, or until somebody drops. Damage sticks either way — a fight you
 * lost still took a bite out of the boss, so a bad week costs you the kill
 * rather than the progress.
 *
 * `hp` is passed in rather than read off the boss: health is derived from the
 * level bracket now, not authored on the boss.
 */
export function resolveFight(player, log, boss, hp, damageSoFar = 0, rng = Math.random) {
  const me = fightPower(player, log)
  // Scaled off the boss's level rather than its health pool. Health runs from
  // six thousand to four hundred thousand across the ladder while a player's
  // does not, so sizing the punch off it meant the last boss took a fully
  // geared character down in two rounds.
  const bossAttack = Math.round(34 + boss.level * 2.8)
  const startHp = Math.max(1, hp - damageSoFar)
  let bossHp = startHp
  let myHp = me.hp
  const rounds = []
  // A swing is a share of the whole pool rather than a flat number, because
  // the pool is a level bracket's XP and a flat hit measured in hundreds would
  // never scratch the late ones. The share is how your kit and your week
  // compare with what the bracket expects: six average rounds take about 45%
  // of a full pool at par, so the arena finishes a boss you have already worn
  // past halfway and can never put down a fresh one.
  const bite = swingFor(player, log, boss, hp)
  for (let i = 0; i < FIGHT_ROUNDS && bossHp > 0 && myHp > 0; i++) {
    const mine = Math.max(1, Math.round(bite * (0.6 + rng() * 0.8)))
    bossHp -= mine
    const theirs = bossHp > 0 ? Math.round(bossAttack * (0.6 + rng() * 0.8)) : 0
    myHp -= theirs
    rounds.push({ mine, theirs, bossHp: Math.max(0, bossHp), myHp: Math.max(0, myHp) })
  }
  return {
    rounds,
    won: bossHp <= 0,
    dealt: startHp - Math.max(0, bossHp),
    attack: me.attack,
    hp: me.hp,
    gear: me.gear,
    form: me.form,
    bossAttack,
  }
}

/**
 * Roughly how it should go, for the card you read before walking in. Not the
 * roll — the roll is the whole reason to press the button.
 */
export function fightOdds(player, log, boss, hp, damageSoFar = 0) {
  const need = Math.max(1, hp - damageSoFar)
  const canDeal = swingFor(player, log, boss, hp) * FIGHT_ROUNDS
  return Math.min(0.97, Math.max(0.03, (canDeal / need) * 0.62))
}

// ----------------------------------------------------------------------- quests

// ----------------------------------------------------------------------- stones

export function stoneProgress(player) {
  return STONES.map((s) => {
    const value = player.lifetime[s.metric] ?? 0
    return {
      ...s,
      value,
      pct: Math.min(1, value / s.goal),
      earned: player.stones.includes(s.key),
    }
  })
}

// -------------------------------------------------------------------- balancing

// -------------------------------------------------------------------- utilities

export function fmt(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 10000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}

export function fmtFull(n) {
  return Math.round(n).toLocaleString('en-US')
}
export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}
