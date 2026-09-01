// Pure game logic. No React, no storage, no side effects — every function here
// takes state in and hands numbers back, which keeps the balance testable.

import {
  ACTIVITIES,
  DAILY_SLOTS,
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

export function statProgress(statXp) {
  const lv = statLevel(statXp)
  const floorXp = Math.round(55 * Math.pow(lv - 1, 1 / 0.62))
  const ceilXp = Math.round(55 * Math.pow(lv, 1 / 0.62))
  const span = Math.max(1, ceilXp - floorXp)
  return { level: lv, pct: Math.min(1, Math.max(0, (statXp - floorXp) / span)), into: statXp - floorXp, span }
}

// ---------------------------------------------------------------------- streaks

export function streakTier(days) {
  let tier = { days: 0, mult: 1, label: 'Cold' }
  for (const t of STREAK_TIERS) if (days >= t.days) tier = t
  return tier
}

export function nextStreakTier(days) {
  return STREAK_TIERS.find((t) => days < t.days) ?? null
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
    if (!item) continue
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
 * Rolls the daily chest. The floor is always common and the ceiling always
 * legendary, so every single day carries a real chance of something great.
 */
export function rollDailyChest(catalog, rng = Math.random) {
  const drops = []
  for (let i = 0; i < DAILY_CHEST.rolls; i++) {
    const rarity = weightedRarity(rng, 'common')
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
  return { cores: DAILY_CHEST.cores, drops }
}

// ------------------------------------------------------------------- campaign
// The story ladder. There is no separate campaign currency and no second kind
// of session: the XP a workout is already worth is the damage it deals, so the
// player never has to choose between levelling and progressing the story.

/**
 * Where the player is standing. `current` is the boss in front of them — the
 * first one they have not beaten and do have the level for.
 */
export function campaignState(player, campaign) {
  const defeated = campaign?.defeated ?? []
  const damage = campaign?.damage ?? 0
  const remaining = CAMPAIGN.filter((b) => !defeated.includes(b.id))
  const current = remaining.find((b) => player.level >= b.level) ?? null
  const locked = remaining.find((b) => player.level < b.level) ?? null
  return {
    defeated,
    damage,
    current,
    locked,
    cleared: CAMPAIGN.length - remaining.length,
    total: CAMPAIGN.length,
    pct: current ? Math.min(1, damage / current.hp) : 0,
    finished: remaining.length === 0,
    // A boss you have the level for but have not reached yet is "ahead", not
    // "locked" — the difference is what makes the path feel walkable.
    gatedBy: !current && locked ? locked.level - player.level : 0,
  }
}

/** What one logged session does to a boss. Its XP, doubled on the weakness. */
export function bossHit(boss, act, xp) {
  if (!boss) return { damage: 0, weak: false }
  const weak = Boolean(boss.weak && act.tag === boss.weak)
  return { damage: Math.round(xp * (weak ? WEAK_MULT : 1)), weak }
}

/** Per-boss state for the path list: cleared / fighting / ahead / locked. */
export function bossStatus(boss, player, campaign) {
  if ((campaign?.defeated ?? []).includes(boss.id)) return 'cleared'
  if (player.level < boss.level) return 'locked'
  const { current } = campaignState(player, campaign)
  return current && current.id === boss.id ? 'fighting' : 'ahead'
}

/** Rough days left at the player's recent pace — the "how far in am I" number. */
export function bossEta(boss, damage, xpPerDay) {
  if (!boss || xpPerDay <= 0) return null
  return Math.max(1, Math.ceil((boss.hp - damage) / xpPerDay))
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
export function resolveActivity(player, { activityId, amount, verified }) {
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
    cores: Math.round(8 * blocks * (verified ? 1 : 0.5)),
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

export function slotById(id) {
  return DAILY_SLOTS.find((s) => s.id === id) ?? DAILY_SLOTS[0]
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
 * Six rounds, or until somebody drops. Damage sticks either way — a fight you
 * lost still took a bite out of the boss, so a bad week costs you the kill
 * rather than the progress.
 */
export function resolveFight(player, log, boss, damageSoFar = 0, rng = Math.random) {
  const me = fightPower(player, log)
  // Scaled off the boss's level rather than its health pool. Health runs from
  // 900 to 60,000 across the ladder while a player's does not, so sizing the
  // punch off it meant the last boss took a fully geared character down in two
  // rounds. Level is the number that tracks what the player brings.
  const bossAttack = Math.round(34 + boss.level * 2.8)
  const startHp = Math.max(1, boss.hp - damageSoFar)
  let bossHp = startHp
  let myHp = me.hp
  const rounds = []
  for (let i = 0; i < FIGHT_ROUNDS && bossHp > 0 && myHp > 0; i++) {
    const mine = Math.round(me.attack * (0.6 + rng() * 0.8))
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
export function fightOdds(player, log, boss, damageSoFar = 0) {
  const me = fightPower(player, log)
  const need = Math.max(1, boss.hp - damageSoFar)
  const canDeal = me.attack * FIGHT_ROUNDS
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

/**
 * The "healthy balance" read-out the whole product is pitched on: active minutes
 * against gaming hours for the week. Above 1.0 is not the goal — 0.5 to 1.5 is
 * the band we call balanced, because giving up games is not the ask.
 */
export function balanceRatio(activeMinutes, gamingHours) {
  if (!gamingHours) return activeMinutes > 0 ? 2 : 0
  return activeMinutes / 60 / gamingHours
}

export function balanceVerdict(ratio) {
  if (ratio === 0) return { label: 'NO DATA', color: 'var(--color-ink-faint)', note: 'Link a health app to start' }
  if (ratio < 0.15)
    return { label: 'GRIND HEAVY', color: 'var(--color-danger)', note: 'A lot of screen, not much movement' }
  if (ratio < 0.35) return { label: 'TILTING', color: '#fb923c', note: 'One session away from balanced' }
  if (ratio <= 1.2) return { label: 'BALANCED', color: 'var(--color-lime)', note: 'This is the zone. Hold it.' }
  return { label: 'TOUCH GRASS PRO', color: 'var(--color-cyan)', note: 'Plenty of training — go enjoy a game' }
}

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

export function relTime(ts, now = Date.now()) {
  const s = Math.max(1, Math.round((now - ts) / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  return `${Math.round(s / 86400)}d`
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}
