// Seed content + the starting save. The app ships "lived in" on purpose: an
// empty RPG demo tells you nothing about whether the systems feel good.

import { HAIR_BASE, SKIN_BASE, TUNIC } from './sprites'
import { ACTIVITIES, ARMOUR_SETS, DAILY_SLOTS, EQUIP_SLOTS, OFFHAND_KINDS, SLOT_STATS, armourSet, offhandKind } from './config'
import { foldWeek, weekStart } from './progress'

// ------------------------------------------------------------------- catalogues

export const PET_CATALOG = [
  {
    id: 'pup',
    name: 'PUP',
    rarity: 'common',
    stat: 'VIT',
    species: 'Loyal hound',
    blurb: 'Shows up every single day. Never asks why.',
  },
  {
    id: 'turbo',
    name: 'TURBO',
    rarity: 'uncommon',
    stat: 'END',
    species: 'Shell runner',
    blurb: 'Slow is smooth. Smooth is a 10k.',
  },
  {
    id: 'frost',
    name: 'FROST',
    rarity: 'rare',
    stat: 'FOCUS',
    species: 'Ice sentinel',
    blurb: 'Ice in the veins on match point.',
  },
  {
    id: 'ember',
    name: 'EMBER',
    rarity: 'epic',
    stat: 'AGI',
    species: 'Ash wyrmling',
    blurb: 'Burns the last 200m like it owes them money.',
  },
  {
    id: 'zeus',
    name: 'ZEUS',
    rarity: 'legendary',
    stat: 'STR',
    species: 'Storm lion',
    blurb: 'One in a hundred. Roars when you PB.',
  },
  {
    id: 'drake',
    name: 'DRAKE',
    rarity: 'legendary',
    stat: 'AGI',
    species: 'Hearth drake',
    blurb: 'Hatched by a fire and never left. Fits in a rucksack, thinks it does not.',
  },
  {
    // Was TUSKLING. Same pet, same slot in the world raid, renamed with the
    // art — so it keeps its rarity, its stat and its seasonal flag rather than
    // arriving as a second creature beside the one it replaced.
    id: 'kookie',
    name: 'KOOKIE',
    rarity: 'legendary',
    stat: 'END',
    species: 'Grimtusk\u2019s cub',
    blurb: 'Started small and angry. Still angry. No longer small.',
    seasonal: 'ogre',
  },
]

/**
 * Gear is generated, not listed: every slot exists in every set, so the catalog
 * is the cross product rather than thirty hand-written rows.
 */
export function gearPiece(slot, setId, kind) {
  const set = armourSet(setId)
  const meta = EQUIP_SLOTS.find((s) => s.key === slot) ?? EQUIP_SLOTS[0]
  // Only the offhand has a choice of kind; every other slot is its own kind.
  const k = slot === 'offhand' ? offhandKind(kind ?? 'shield') : null
  return {
    slot,
    kind: k ? k.id : slot,
    set: set.id,
    rarity: set.rarity,
    name: `${set.short} ${k ? k.name : meta.name}`,
    stats: k ? k.stats : (SLOT_STATS[slot] ?? SLOT_STATS.chest),
  }
}

export const GEAR_CATALOG = ARMOUR_SETS.flatMap((set) =>
  EQUIP_SLOTS.flatMap((s) =>
    s.key === 'offhand'
      ? OFFHAND_KINDS.map((k) => gearPiece(s.key, set.id, k.id))
      : [gearPiece(s.key, set.id)],
  ),
)

export const CATALOG = { pets: PET_CATALOG, gear: GEAR_CATALOG }

// ------------------------------------------------------------------- world boss

const SEASONS = [
  {
    id: 'couch-titan',
    sprite: 'couch-titan',
    name: 'THE COUCH TITAN',
    subtitle: 'Season 1 · World Raid',
    lore: 'It fed on abandoned New Year resolutions. Beaten by the community in nine days.',
    goalKm: 1000000,
    startKm: 1000000,
    endsAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    active: false,
    rewards: [],
    personalTiers: [],
  },
  {
    id: 'ogre',
    sprite: 'ogre',
    name: 'GRIMTUSK',
    subtitle: 'Season 2 · World Raid',
    // Named for the thing every training plan runs into. It is an obstacle, not
    // a verdict on the player — the app never uses shame as a motivator.
    lore: 'The plateau made flesh. It squats on the road at the exact point most people stop, and it only moves when enough of us walk straight at it.',
    goalKm: 1200000,
    startKm: 214860,
    endsAt: Date.now() + 1000 * 60 * 60 * 24 * 23,
    active: true,
    rewards: [
      { at: 0.25, name: 'Grimtusk banner', kind: 'banner' },
      { at: 0.5, name: 'Plateau-Breaker title + 1,500 cores', kind: 'title' },
      { at: 0.75, name: 'Epic gear cache', kind: 'gear' },
      { at: 1, name: 'KOOKIE pet', kind: 'pet', ref: 'kookie' },
    ],
    personalTiers: [
      { km: 10, reward: '200 cores' },
      { km: 25, reward: 'Ogre-hide weapon skin' },
      { km: 50, reward: 'Epic chest' },
      { km: 100, reward: 'Grimtusk title' },
    ],
  },
]

/** The raid everything points at. Past seasons stay for the archive. */
export const BOSS = SEASONS.find((b) => b.active)

/** One hour, for the timestamps the demo save is built out of. */
const H = 1000 * 60 * 60

// -------------------------------------------------------------------- dailies

/** One entry per slot, every day. Presentation lives in DAILY_SLOTS. */
export function freshDailies() {
  return DAILY_SLOTS.map((s) => ({ id: s.id, minutes: 0, done: false, loggedAs: null }))
}

// ------------------------------------------------------------ a real start

/**
 * What a player who has just made a character actually owns.
 *
 * INITIAL_STATE below is a showroom: level 27, a full kit, a 23-day streak and
 * a stretch of the map already walked, so every screen has something on it
 * before anyone has signed up. Handing that to someone who wants to play is
 * nonsense — their first workout would land on a character they did not earn.
 * Signing up wipes it back to this.
 */
export const FRESH_START = {
  player: {
    level: 1,
    xp: 0,
    streak: 0,
    shields: 0,
    cores: 0,
    // Which best efforts are pinned to the profile. Empty means nothing shows,
    // which is the point — they are chosen, not collected.
    efforts: [],
    // Answered at character creation: how many days a week they are aiming for,
    // and which activities they said they would actually do.
    goalDays: 4,
    picks: [],
    stats: { STR: 0, END: 0, AGI: 0, VIT: 0, FOCUS: 0 },
    // The clothes you stand up in. Nothing equipped, nothing in the bag but
    // the boots — a first drop should feel like a drop.
    equipped: { helm: null, chest: null, legs: null, gloves: null, boots: 'start-boots', offhand: null },
    inventory: [{ id: 'start-boots', ...gearPiece('boots', 'leather'), level: 1 }],
    pets: [],
    activePetId: null,
    // One per logged session, spent on whichever pet you choose to grow.
    treats: 0,
    stones: [],
    titles: [],
    lifetime: { volume: 0, distance: 0, sessions: 0, coop: 0, streak: 0, balance: 0, bossKm: 0 },
    week: { activeMinutes: 0, gamingHours: 0, km: 0, sessions: 0 },
  },
  campaign: { defeated: [], damage: {} },
  // The map opens black. Every cell of it is somewhere you have not been yet.
  explored: [],
  session: null,
  log: [],
  chest: { unlocked: false, openedToday: false },
}



// --------------------------------------------------- a trained history, seeded

/**
 * Thirteen weeks of training and a board of bests, for the test account.
 *
 * The progress view is the one part of the app that cannot be judged on an
 * empty state — a chart of nothing and a board with no lifts on it look
 * identical whether they work or not. This is a plausible three months: four
 * sessions a week, a fortnight off in the middle, and lifts that mostly go up.
 */
const WEEK_MS = 7 * 24 * 3600 * 1000

/**
 * The quarter behind the demo character, as sessions rather than as totals.
 *
 * These weeks used to be thirteen hand-written totals with an invented
 * gym/run/swim split stamped on every one of them, which meant the profile's
 * activity filter offered three disciplines whether or not anything had been
 * done in them — the demo asserting a swim a week that never happened, and
 * asserting it to a player whose own filter should only ever list what they
 * did. So the weeks are folded out of sessions now, the same way a real
 * week is, and a filtered chart shows exactly the weeks there are sessions
 * for because there is nothing else for it to show.
 *
 * The dip at weeks five and six is deliberate. A chart where every bar is
 * taller than the last is a chart nobody believes.
 */
const WEEKLY_SESSIONS = [4, 4, 4, 5, 1, 0, 3, 4, 5, 5, 5, 4, 5]

/** What a week is made of, cycled through so no two weeks are identical and
 *  none of them is a tidy alternation either. */
const ROTATION = [
  { id: 'gym', amount: 52 },
  { id: 'run', amount: 6.4 },
  { id: 'gym', amount: 46 },
  { id: 'walk', amount: 38 },
  { id: 'swim', amount: 30 },
  { id: 'run', amount: 4.8 },
]

/**
 * Fills each week of the quarter up to the number of sessions it should have.
 *
 * A top-up rather than a back-catalogue: the last few weeks already carry
 * hand-written sessions with real splits, routes and lifts, and generating on
 * top of those would count the same training twice. So each week is counted
 * first and only the shortfall is made up — which also means the current week
 * is populated whatever day it is read on, instead of the demo looking like
 * nobody has trained since Sunday.
 */
function seededHistory(recent) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const monday = start.getTime()

  const already = new Map()
  for (const l of recent) {
    const w = Math.round((monday - weekStart(l.at)) / WEEK_MS)
    if (w >= 0 && w < WEEKLY_SESSIONS.length) already.set(w, (already.get(w) ?? 0) + 1)
  }

  const out = []
  let turn = 0
  for (let w = 0; w < WEEKLY_SESSIONS.length; w++) {
    const from = monday - w * WEEK_MS
    // How much of the week has actually happened. The current one is only
    // partly over, and a demo claiming five sessions on a Monday morning is
    // the same lie as a chart with no dip in it — so this week fills up as
    // the week does.
    const span = Math.max(0, Math.min(WEEK_MS, Date.now() - from))
    const target = w === 0 ? Math.round(WEEKLY_SESSIONS[0] * (span / WEEK_MS)) : WEEKLY_SESSIONS[w]
    const need = target - (already.get(w) ?? 0)
    for (let i = 0; i < need; i++) {
      const pick = ROTATION[turn++ % ROTATION.length]
      const act = ACTIVITIES.find((a) => a.id === pick.id)
      // Spread across the elapsed part of the week, so the sessions list
      // reads like a diary rather than a loop counter.
      const at = from + Math.round(((i + 0.5) / need) * span)
      out.push({
        id: `seed-h${w}-${i}`,
        activityId: act.id,
        amount: pick.amount,
        verified: true,
        at,
        xp: Math.round(act.xp * (pick.amount / act.per)),
        source: 'tracked',
      })
    }
  }
  return out
}

/**
 * The weeks, folded out of the sessions — the same call the app makes when you
 * finish a real one, so the totals, the breakdown and the log cannot disagree
 * with each other.
 */
function weeksFrom(log) {
  let weeks = []
  for (const l of [...log].sort((a, b) => a.at - b.at)) {
    const act = ACTIVITIES.find((a) => a.id === l.activityId)
    if (!act) continue
    weeks = foldWeek(weeks, { act, amount: l.amount, xp: l.xp ?? 0, detail: l.detail }, l.at)
  }
  return weeks
}

const SEEDED_LAST_SETS = {
  'Bench press': {
    at: Date.now() - 3 * 24 * 3600 * 1000,
    sets: [{ reps: 8, weight: 72.5 }, { reps: 8, weight: 77.5 }, { reps: 6, weight: 80 }, { reps: 5, weight: 80 }],
  },
  Squat: {
    at: Date.now() - 3 * 24 * 3600 * 1000,
    sets: [{ reps: 8, weight: 100 }, { reps: 5, weight: 115 }, { reps: 5, weight: 120 }],
  },
  Deadlift: {
    at: Date.now() - 7 * 24 * 3600 * 1000,
    sets: [{ reps: 5, weight: 130 }, { reps: 3, weight: 150 }, { reps: 3, weight: 155 }],
  },
  'Overhead press': {
    at: Date.now() - 11 * 24 * 3600 * 1000,
    sets: [{ reps: 8, weight: 42.5 }, { reps: 8, weight: 48 }, { reps: 6, weight: 48 }],
  },
  'Barbell row': {
    at: Date.now() - 31 * 24 * 3600 * 1000,
    sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 68 }, { reps: 8, weight: 68 }],
  },
  'Pull-up': {
    at: Date.now() - 9 * 24 * 3600 * 1000,
    sets: [{ reps: 12, weight: 0 }, { reps: 10, weight: 0 }, { reps: 8, weight: 0 }],
  },
}

const SEEDED_RECORDS = {
  'Bench press': { e1rm: 96.7, reps: 6, weight: 80, at: Date.now() - 9 * 24 * 3600 * 1000 },
  Squat: { e1rm: 141.7, reps: 5, weight: 120, at: Date.now() - 4 * 24 * 3600 * 1000 },
  Deadlift: { e1rm: 170.5, reps: 3, weight: 155, at: Date.now() - 7 * 24 * 3600 * 1000 },
  'Overhead press': { e1rm: 62.0, reps: 8, weight: 48, at: Date.now() - 11 * 24 * 3600 * 1000 },
  'Barbell row': { e1rm: 88.0, reps: 8, weight: 68, at: Date.now() - 31 * 24 * 3600 * 1000 },
}

/** Gym sessions far enough apart to draw a line through. */
function seededGymLog() {
  const D = 24 * 3600 * 1000
  // Days ago, so the list runs newest first and the weights have to get
  // LIGHTER as you read down it — a seed where the old session is the heavy one
  // draws every trend line pointing at the floor.
  const plan = [
    [3, { 'Bench press': 80, Squat: 120 }],
    [7, { 'Bench press': 77.5, Deadlift: 155 }],
    [10, { 'Bench press': 77.5, Squat: 115 }],
    [14, { 'Bench press': 75, 'Overhead press': 48 }],
    [18, { 'Bench press': 75, Squat: 112.5 }],
    [24, { 'Bench press': 72.5, Deadlift: 147.5 }],
    [31, { 'Bench press': 70, 'Barbell row': 68, Squat: 105 }],
  ]
  return plan.map(([days, lifts], i) => {
    const groups = Object.entries(lifts).map(([lift, top]) => ({
      lift,
      sets: 4,
      reps: 24,
      volume: Math.round(top * 24 * 0.86),
      top,
    }))
    const volume = groups.reduce((a, g) => a + g.volume, 0)
    return {
      id: `seed-gym-${i}`,
      activityId: 'gym',
      amount: 52,
      verified: true,
      at: Date.now() - days * D,
      xp: 295,
      source: 'tracked',
      detail: { mode: 'strength', sets: groups.length * 4, reps: groups.length * 24, volume, lifts: groups },
    }
  })
}

/**
 * Distance sessions with their splits intact, so the best-efforts board has
 * something in it. A run has to be long enough to contain a 5k for there to be
 * a 5k best inside it — that is the whole mechanic, and a seed that skipped it
 * would leave the feature looking broken rather than empty.
 */
function seededRuns() {
  const D = 24 * 3600 * 1000
  // Kilometre splits in milliseconds. The middle of the 10k is the quick part,
  // which is what makes its best 5k faster than the standalone 5k below it.
  const tenK = [298, 292, 286, 281, 279, 277, 280, 288, 296, 305].map((s) => s * 1000)
  const fiveK = [274, 271, 269, 272, 266].map((s) => s * 1000)
  const swim = [1580, 1622].map((s) => s * 1000)
  const leg = (lat, lon, n, dLat, dLon) =>
    Array.from({ length: n }, (_, i) => [+(lat + dLat * i).toFixed(5), +(lon + dLon * i).toFixed(5)])
  const total = (splits) => splits.reduce((a, b) => a + b, 0)
  return [
    {
      id: 'seed-run-10k',
      activityId: 'run',
      amount: 10,
      verified: true,
      at: Date.now() - 5 * D,
      xp: 550,
      source: 'tracked',
      detail: { mode: 'distance', metres: 10040, splits: tenK, route: leg(-33.8915, 151.2745, 30, 0.0006, -0.0004) },
    },
    {
      id: 'seed-run-5k',
      activityId: 'run',
      amount: 5,
      verified: true,
      at: Date.now() - 12 * D,
      xp: 275,
      source: 'tracked',
      detail: { mode: 'distance', metres: 5060, splits: fiveK, route: leg(-33.8688, 151.2093, 24, -0.0005, 0.0007) },
    },
    {
      id: 'seed-swim',
      activityId: 'swim',
      amount: 28,
      verified: true,
      at: Date.now() - 9 * D,
      xp: 182,
      source: 'tracked',
      detail: { mode: 'distance', metres: 2000, splits: swim },
    },
  ].map((l) => ({ ...l, detail: { ...l.detail, ms: total(l.detail.splits) } }))
}

// ------------------------------------------------------------- test account

/**
 * Everything unlocked, for testing.
 *
 * There is no other way to see the top of the game without playing to it — a
 * full legendary set, a maxed pet, the whole campaign beaten and the map walked
 * are all real states the app can be in, and all of them are weeks away. This
 * is a switch that puts you there, and it is meant to be deleted the day the
 * game is in front of players rather than in front of us.
 */
/** Every seeded session, newest first — the one list the demo's log, its
 *  weekly breakdown and its best-effort board are all built from. */
/** A walk from this morning. A 214-day streak means this character trained
 *  today, and without it the demo reads as unbroken-but-idle — and "this
 *  week" is empty every Monday, which is a worse first look than it deserves. */
const SEEDED_TODAY = {
  id: 'seed-today',
  activityId: 'walk',
  amount: 42,
  verified: true,
  // Five hours ago, unless the week is younger than that — on a Monday
  // morning "five hours ago" is last week, which is the one case this exists
  // to avoid.
  at: Math.max(weekStart(Date.now()) + 3600 * 1000, Date.now() - 5 * 3600 * 1000),
  xp: 126,
  source: 'tracked',
}

const SEEDED_RECENT = [SEEDED_TODAY, ...seededGymLog(), ...seededRuns()]
const SEEDED_LOG = [
  ...SEEDED_RECENT,
  ...seededHistory(SEEDED_RECENT),
].sort((a, b) => b.at - a.at)

export const TEST_ACCOUNT = {
  onboarded: true,
  player: {
    name: 'MAXED',
    handle: 'testaccount',
    classId: 'ironstride',
    level: 100,
    xp: 0,
    streak: 214,
    shields: 3,
    cores: 250000,
    stats: { STR: 96000, END: 104000, AGI: 88000, VIT: 92000, FOCUS: 81000 },
    // The full gilded regalia, plus one of every other set in the bag so the
    // armoury, the weapons page and the upgrade path all have something in
    // them to look at.
    equipped: { helm: 'g1', chest: 'g2', legs: 'g3', gloves: 'g4', boots: 'g5', offhand: 'g6' },
    inventory: [
      { id: 'g1', ...gearPiece('helm', 'gilded'), level: 10 },
      { id: 'g2', ...gearPiece('chest', 'gilded'), level: 10 },
      { id: 'g3', ...gearPiece('legs', 'gilded'), level: 10 },
      { id: 'g4', ...gearPiece('gloves', 'gilded'), level: 10 },
      { id: 'g5', ...gearPiece('boots', 'gilded'), level: 10 },
      { id: 'g6', ...gearPiece('offhand', 'gilded', 'sword'), level: 10 },
      { id: 'g7', ...gearPiece('offhand', 'gilded', 'axe'), level: 8 },
      { id: 'g8', ...gearPiece('offhand', 'gilded', 'bow'), level: 8 },
      { id: 'g9', ...gearPiece('offhand', 'gilded', 'staff'), level: 7 },
      { id: 'g10', ...gearPiece('offhand', 'verdant', 'spear'), level: 6 },
      { id: 'g11', ...gearPiece('offhand', 'verdant', 'dagger'), level: 6 },
      { id: 'g12', ...gearPiece('chest', 'verdant'), level: 8 },
      { id: 'g13', ...gearPiece('helm', 'verdant'), level: 8 },
      { id: 'g14', ...gearPiece('legs', 'bone'), level: 6 },
      { id: 'g15', ...gearPiece('gloves', 'bone'), level: 6 },
      { id: 'g16', ...gearPiece('boots', 'iron'), level: 5 },
      { id: 'g17', ...gearPiece('chest', 'leather'), level: 4 },
    ],
    pets: PET_CATALOG.map((pet) => ({
      id: `t_${pet.id}`,
      ref: pet.id,
      name: pet.name,
      rarity: pet.rarity,
      stat: pet.stat,
      // Every one fully grown. This account exists to look at the game, and
      // half of the pet art is the half you only see at the top. Written as a
      // literal rather than imported from the engine: this runs at module
      // scope, and a seed that reaches into another module to build itself is
      // a seed that depends on import order.
      stage: 4,
      fed: 0,
    })),
    activePetId: 't_zeus',
    treats: 64,
    stones: ['power', 'space', 'reality', 'soul', 'time', 'mind'],
    titles: [],
    lifetime: { volume: 1840000, distance: 6120, sessions: 2140, coop: 410, streak: 214, balance: 812, bossKm: 964 },
    week: { activeMinutes: 640, gamingHours: 18, km: 74.5, sessions: 11 },
  },
  // A maxed character stands in front of the last boss, because the boss is
  // the level bracket: everything below level 88 is already down, and LVL100
  // is part-way through with a fight left in it to test.
  campaign: {
    defeated: ['golem', 'wraith', 'couch', 'doomscroll', 'ironjaw', 'wall', 'nox', 'mirror', 'backslide'],
    damage: { lvl100: 215000 },
  },
  gift: { pending: false, opened: true },
  chest: { unlocked: true, openedToday: false },
  session: null,
  records: SEEDED_RECORDS,
  lastSets: SEEDED_LAST_SETS,
  routines: [
    { id: 'r_push', name: 'Push day', lifts: ['Bench press', 'Overhead press'], at: Date.now() - 3 * 24 * 3600 * 1000 },
    { id: 'r_lower', name: 'Lower body', lifts: ['Squat', 'Deadlift'], at: Date.now() - 7 * 24 * 3600 * 1000 },
  ],
  weeks: weeksFrom(SEEDED_LOG),
  log: SEEDED_LOG,
}

// ----------------------------------------------------------------- initial save

export const INITIAL_STATE = {
  version: 1,
  onboarded: false,
  player: {
    name: 'ROOKIE',
    handle: 'newchallenger',
    classId: 'ironstride',
    level: 27,
    xp: 640,
    streak: 23,
    shields: 1,
    cores: 1840,
    stats: { STR: 9200, END: 12400, AGI: 7600, VIT: 10100, FOCUS: 5400 },
    avatar: { seed: 0, body: 'male', skin: SKIN_BASE, hair: HAIR_BASE, shirt: TUNIC },
    games: [],
    equipped: { helm: 'i1', chest: 'i2', legs: 'i3', gloves: 'i4', boots: 'i5', offhand: 'i6' },
    // A mixed kit, the way a real run looks part-way through: mostly iron, one
    // lucky bone piece, and the leathers you started in still on your feet.
    inventory: [
      { id: 'i1', ...gearPiece('helm', 'iron'), level: 3 },
      { id: 'i2', ...gearPiece('chest', 'iron'), level: 4 },
      { id: 'i3', ...gearPiece('legs', 'iron'), level: 2 },
      { id: 'i4', ...gearPiece('gloves', 'bone'), level: 3 },
      { id: 'i5', ...gearPiece('boots', 'leather'), level: 6 },
      { id: 'i6', ...gearPiece('offhand', 'iron', 'shield'), level: 1 },
      { id: 'i7', ...gearPiece('chest', 'leather'), level: 5 },
      { id: 'i8', ...gearPiece('helm', 'leather'), level: 2 },
      { id: 'i9', ...gearPiece('offhand', 'bone', 'sword'), level: 2 },
    ],
    pets: [
      { id: 'p_pup', ref: 'pup', name: 'PUP', rarity: 'common', stat: 'VIT', stage: 2, fed: 6 },
      { id: 'p_turbo', ref: 'turbo', name: 'TURBO', rarity: 'uncommon', stat: 'END', stage: 1, fed: 3 },
      { id: 'p_frost', ref: 'frost', name: 'FROST', rarity: 'rare', stat: 'FOCUS', stage: 1, fed: 1 },
    ],
    activePetId: 'p_pup',
    treats: 9,
    stones: ['reality'],
    // Titles are the visible receipt for a boss kill — the one reward that is
    // not a number and cannot be rolled for.
    titles: [],
    lifetime: {
      volume: 61400, // kg lifted
      distance: 412, // km
      sessions: 318,
      coop: 34,
      streak: 23,
      balance: 96,
      bossKm: 18.6,
    },
    week: { activeMinutes: 214, gamingHours: 11.5, km: 13.4, sessions: 4 },
  },
  // The showroom is level 27, so it is four bosses in and part-way through the
  // one its bracket puts it in front of.
  campaign: {
    defeated: ['golem', 'wraith', 'couch', 'doomscroll'],
    damage: { ironjaw: 23800 },
  },
  // Every beta player has one waiting the first time they open the app.
  // A stretch from Circular Quay down through the CBD already walked, so the
  // fog reads as a mechanic rather than a broken screen.
  session: null,
  explored: ['60294,39322', '60294,39323', '60294,39324', '60294,39325', '60294,39326', '60294,39327', '60294,39328', '60295,39322', '60295,39323', '60295,39324', '60295,39325', '60295,39326', '60295,39327', '60295,39328', '60296,39322', '60296,39323', '60296,39324', '60296,39325', '60296,39326', '60296,39327'],
  gift: { pending: true, opened: false },
  chest: { unlocked: true, openedToday: false },
  dailies: freshDailies(),
  links: { health: [], games: [] },
  log: [
    { id: 'l1', activityId: 'run', amount: 6.2, verified: true, at: Date.now() - 20 * H, xp: 341, source: 'Garmin' },
    { id: 'l2', activityId: 'lift', amount: 5400, verified: true, at: Date.now() - 30 * H, xp: 486, source: 'Apple' },
    { id: 'l3', activityId: 'aim', amount: 25, verified: true, at: Date.now() - 32 * H, xp: 50, source: 'Aimlabs' },
    { id: 'l4', activityId: 'sleep', amount: 7.5, verified: true, at: Date.now() - 40 * H, xp: 135, source: 'WHOOP' },
  ],
  toasts: [],
}
