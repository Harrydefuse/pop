// Seed content + the starting save. The app ships "lived in" on purpose: an
// empty RPG demo tells you nothing about whether the systems feel good.

import { AVATAR_HAIR, AVATAR_SKINS, HAIR_BASE, SKIN_BASE, TUNIC } from './sprites'
import { ARMOUR_SETS, DAILY_SLOTS, EQUIP_SLOTS, OFFHAND_KINDS, SLOT_STATS, armourSet, offhandKind } from './config'

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
    id: 'tuskling',
    name: 'TUSKLING',
    rarity: 'legendary',
    stat: 'END',
    species: 'Ogre cub',
    blurb: 'Grimtusk\u2019s cub. Only walks with people who kept walking.',
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

// ------------------------------------------------------------ health & game links

export const HEALTH_PROVIDERS = [
  { id: 'apple', name: 'Apple Health', note: 'Workouts, steps, sleep, HR', color: '#f2ecff' },
  { id: 'google', name: 'Health Connect', note: 'Android workouts & steps', color: '#4ade80' },
  { id: 'strava', name: 'Strava', note: 'Runs & rides with GPS traces', color: '#fc4c02' },
  { id: 'garmin', name: 'Garmin', note: 'Full session + recovery data', color: '#38bdf8' },
  { id: 'whoop', name: 'WHOOP', note: 'Strain, recovery, sleep', color: '#a3e635' },
]

export const GAME_ACCOUNTS = [
  { id: 'riot', name: 'Riot Games', titles: 'Valorant, League, TFT', color: '#f43f5e' },
  { id: 'steam', name: 'Steam', titles: 'CS2, Apex, everything else', color: '#38bdf8' },
  { id: 'epic', name: 'Epic Games', titles: 'Fortnite, Rocket League', color: '#f2ecff' },
  { id: 'blizzard', name: 'Battle.net', titles: 'Overwatch 2, WoW, Diablo', color: '#a855f7' },
  { id: 'xbox', name: 'Xbox Live', titles: 'Game Pass library', color: '#4ade80' },
]

// ---------------------------------------------------------------------- roster

const NAMES = [
  ['Kestrel', 'kestrel_ow'],
  ['Vex', 'vexbench'],
  ['Nyx', 'nyx.aim'],
  ['Boulder', 'boulderdash'],
  ['Sable', 'sable5k'],
  ['Riko', 'rikorides'],
  ['Juno', 'junolifts'],
  ['Ash', 'ashtilt'],
  ['Marrow', 'marrow_gg'],
  ['Pip', 'pipsqueak'],
  ['Halcyon', 'halcyon.hp'],
  ['Drift', 'driftk'],
  ['Onyx', 'onyxpb'],
  ['Wren', 'wren.runs'],
]

const CLASS_IDS = ['strider', 'juggernaut', 'ironstride', 'adept']
const PET_IDS = ['pup', 'pup', 'turbo', 'turbo', 'frost', 'ember', 'zeus']

function makeFriend(i, power, extra = {}) {
  const [name, handle] = NAMES[i % NAMES.length]
  return {
    id: `f${i}`,
    name,
    handle,
    level: Math.max(4, Math.round(power / 92)),
    power,
    classId: CLASS_IDS[i % CLASS_IDS.length],
    petId: PET_IDS[i % PET_IDS.length],
    streak: [3, 12, 41, 7, 88, 19, 2, 130, 26, 5, 61, 14, 33, 9][i % 14],
    weeklyKm: [12, 41, 8, 26, 63, 19, 4, 88, 31, 15, 52, 22, 37, 11][i % 14],
    bossKm: [22.4, 61.8, 9.2, 38.5, 84.1, 27.3, 4.6, 112.7, 44.9, 16.2, 70.5, 30.1, 51.8, 12.9][i % 14],
    avatar: {
      seed: i,
      skin: AVATAR_SKINS[i % AVATAR_SKINS.length],
      hair: AVATAR_HAIR[i % AVATAR_HAIR.length],
      hairLength: i % 2 ? 'long' : 'short',
    },
    status: ['training', 'in-game', 'offline', 'in-game', 'training'][i % 5],
    game: ['Valorant', 'CS2', 'Fortnite', 'League', 'Overwatch 2'][i % 5],
    ...extra,
  }
}

export const FRIENDS = [
  makeFriend(0, 4820),
  makeFriend(1, 4210),
  makeFriend(2, 3640),
  makeFriend(3, 3180),
  makeFriend(4, 2960),
  makeFriend(5, 2410),
  makeFriend(6, 1980),
  makeFriend(7, 1620),
  makeFriend(8, 1240),
  makeFriend(9, 880),
]


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
      { at: 1, name: 'TUSKLING pet', kind: 'pet', ref: 'tuskling' },
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
export const PAST_SEASONS = SEASONS.filter((b) => !b.active)

// ----------------------------------------------------------------- achievements

export const ACHIEVEMENTS = [
  { id: 'a1', name: 'FIRST BLOOD', desc: 'Log your first verified session', rarity: 'common', earned: true, at: 'Jan 4' },
  { id: 'a2', name: 'WEEK ONE', desc: 'Hold a 7-day streak', rarity: 'common', earned: true, at: 'Jan 11' },
  { id: 'a3', name: 'SUB-25', desc: 'Run 5 km under 25:00', rarity: 'uncommon', earned: true, at: 'Feb 2' },
  { id: 'a4', name: 'BODYWEIGHT BENCH', desc: 'Bench your own bodyweight', rarity: 'rare', earned: true, at: 'Mar 18' },
  { id: 'a5', name: 'CENTURION', desc: 'Complete 100 verified sessions', rarity: 'rare', earned: true, at: 'May 30' },
  { id: 'a6', name: 'RACE DAY', desc: 'Finish a registered event', rarity: 'epic', earned: true, at: 'Jun 9' },
  { id: 'a7', name: 'HALF MARATHON', desc: 'Cover 21.1 km in one session', rarity: 'epic', earned: false },
  { id: 'a8', name: 'THE HUNDRED', desc: 'Reach a 100-day streak', rarity: 'legendary', earned: false },
  { id: 'a9', name: 'GAUNTLET', desc: 'Collect all six stones', rarity: 'legendary', earned: false },
]

// ------------------------------------------------------------------- community

export const CHANNELS = [
  { id: 'general', name: '#general', desc: 'Everything and nothing' },
  { id: 'gym-help', name: '#gym-help', desc: 'Form checks, programmes, questions' },
  { id: 'aim-lab', name: '#aim-lab', desc: 'Routines, sens, crosshairs' },
  { id: 'pb-flex', name: '#pb-flex', desc: 'Post your personal bests' },
  { id: 'lfg', name: '#lfg', desc: 'Find a duo, in game or at the gym' },
]

const H = 1000 * 60 * 60

export const FEED = [
  {
    id: 'p1',
    channel: 'aim-lab',
    author: FRIENDS[2],
    at: Date.now() - 0.4 * H,
    body: '15-min pre-queue routine that actually transfers:\n\n1. Gridshot Ultra ×2\n2. 1w6ts reload ×3\n3. Tile Frenzy small ×2\n4. 5 min DM, no scoreboard\n\nDo it AFTER you warm up your wrists, not instead of.',
    tags: ['valorant', 'routine'],
    likes: 412,
    replies: 38,
    pinned: true,
  },
  {
    id: 'p2',
    channel: 'pb-flex',
    author: FRIENDS[4],
    at: Date.now() - 2.1 * H,
    body: '5k in 22:41. Six months ago I could not finish 2k without walking. Verified on Garmin, no funny business.',
    tags: ['running', 'pb'],
    likes: 1284,
    replies: 96,
    attachment: { kind: 'pb', label: '5K · 22:41', delta: '-1:12 PB' },
  },
  {
    id: 'p3',
    channel: 'gym-help',
    author: FRIENDS[6],
    at: Date.now() - 5 * H,
    body: 'Beginner push/pull/legs that fits around ranked. 45 min sessions, 3 days a week, no cardio machines required. Full sheet in the replies — steal it.',
    tags: ['programme', 'beginner'],
    likes: 903,
    replies: 141,
  },
  {
    id: 'p4',
    channel: 'lfg',
    author: FRIENDS[1],
    at: Date.now() - 7.5 * H,
    body: 'Anyone in Manchester want a gym duo? I lift Tue/Thu evenings and I am Ascendant 2 if you want to queue after.',
    tags: ['uk', 'duo'],
    likes: 77,
    replies: 22,
  },
  {
    id: 'p5',
    channel: 'general',
    author: FRIENDS[7],
    at: Date.now() - 11 * H,
    body: '130 days. I have not missed since February. The streak is doing more for me than any programme ever did.',
    tags: ['streak'],
    likes: 2210,
    replies: 187,
  },
]

// -------------------------------------------------------------------- coaching

export const COACHES = [
  {
    id: 'c1',
    name: 'Mara "REP" Ellis',
    role: 'Strength coach · CSCS',
    price: 5,
    rating: 4.9,
    students: 3120,
    tag: 'FITNESS',
    color: '#f43f5e',
    lessons: ['Squat setup that stops knee pain', 'Progressive overload without a spreadsheet', '45-min gamer PPL'],
  },
  {
    id: 'c2',
    name: 'Sen',
    role: 'Radiant · ex-VCT analyst',
    price: 5,
    rating: 4.8,
    students: 8940,
    tag: 'VALORANT',
    color: '#a855f7',
    lessons: ['Crosshair placement drills', 'Reading the retake', 'Warm-up that beats 40 min of DM'],
  },
  {
    id: 'c3',
    name: 'Kova',
    role: 'Top 500 OW2 support',
    price: 5,
    rating: 4.7,
    students: 2410,
    tag: 'OVERWATCH',
    color: '#fbbf24',
    lessons: ['Positioning as Ana', 'Cooldown tracking habits', 'Wrist care for 8-hour days'],
  },
  {
    id: 'c4',
    name: 'Dr. Yun',
    role: 'Sleep & performance',
    price: 5,
    rating: 5.0,
    students: 6180,
    tag: 'RECOVERY',
    color: '#22d3ee',
    lessons: ['Fixing a 4am sleep schedule', 'Caffeine timing for late queues', 'Deload weeks'],
  },
]

// -------------------------------------------------------------------- dailies

/** One entry per slot, every day. Presentation lives in DAILY_SLOTS. */
export function freshDailies() {
  return DAILY_SLOTS.map((s) => ({ id: s.id, minutes: 0, done: false, loggedAs: null }))
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
    avatar: { seed: 0, skin: SKIN_BASE, hair: HAIR_BASE, hairLength: 'short', shirt: TUNIC },
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
      { id: 'p_pup', ref: 'pup', name: 'PUP', rarity: 'common', stat: 'VIT', level: 27, xp: 0 },
      { id: 'p_turbo', ref: 'turbo', name: 'TURBO', rarity: 'uncommon', stat: 'END', level: 14, xp: 0 },
      { id: 'p_frost', ref: 'frost', name: 'FROST', rarity: 'rare', stat: 'FOCUS', level: 8, xp: 0 },
    ],
    activePetId: 'p_pup',
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
  // The demo opens where a new player does: in front of the first boss on the
  // road, part-way in, with the rest of the path visible behind it.
  campaign: { defeated: [], damage: 240 },
  // Every beta player has one waiting the first time they open the app.
  gift: { pending: true, opened: false },
  chest: { unlocked: true, openedToday: false },
  dailies: freshDailies(),
  links: { health: [], games: [] },
  feed: FEED,
  log: [
    { id: 'l1', activityId: 'run', amount: 6.2, verified: true, at: Date.now() - 20 * H, xp: 341, source: 'Garmin' },
    { id: 'l2', activityId: 'lift', amount: 5400, verified: true, at: Date.now() - 30 * H, xp: 486, source: 'Apple' },
    { id: 'l3', activityId: 'aim', amount: 25, verified: true, at: Date.now() - 32 * H, xp: 50, source: 'Aimlabs' },
    { id: 'l4', activityId: 'sleep', amount: 7.5, verified: true, at: Date.now() - 40 * H, xp: 135, source: 'WHOOP' },
  ],
  toasts: [],
}
