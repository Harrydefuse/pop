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
  { id: 'apple', name: 'Apple Health', note: 'Workouts, steps, sleep, HR', color: 'var(--color-ink)' },
  { id: 'google', name: 'Health Connect', note: 'Android workouts & steps', color: 'var(--tone-green)' },
  { id: 'strava', name: 'Strava', note: 'Runs & rides with GPS traces', color: '#fc4c02' },
  { id: 'garmin', name: 'Garmin', note: 'Full session + recovery data', color: 'var(--tone-sky)' },
  { id: 'whoop', name: 'WHOOP', note: 'Strain, recovery, sleep', color: 'var(--color-lime)' },
]

export const GAME_ACCOUNTS = [
  { id: 'riot', name: 'Riot Games', titles: 'Valorant, League, TFT', color: 'var(--color-danger)' },
  { id: 'steam', name: 'Steam', titles: 'CS2, Apex, everything else', color: 'var(--tone-sky)' },
  { id: 'epic', name: 'Epic Games', titles: 'Fortnite, Rocket League', color: 'var(--color-ink)' },
  { id: 'blizzard', name: 'Battle.net', titles: 'Overwatch 2, WoW, Diablo', color: 'var(--color-neon)' },
  { id: 'xbox', name: 'Xbox Live', titles: 'Game Pass library', color: 'var(--tone-green)' },
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
    // The profile picture is the character now, so the roster has to be built
    // from both bodies or every face in the leaderboard is the same man.
    avatar: {
      seed: i,
      body: i % 3 === 1 ? 'female' : 'male',
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
    color: 'var(--color-danger)',
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
    color: 'var(--color-neon)',
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
    color: 'var(--color-gold)',
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
    color: 'var(--color-cyan)',
    lessons: ['Fixing a 4am sleep schedule', 'Caffeine timing for late queues', 'Deload weeks'],
  },
]

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
    stats: { STR: 0, END: 0, AGI: 0, VIT: 0, FOCUS: 0 },
    // The clothes you stand up in. Nothing equipped, nothing in the bag but
    // the boots — a first drop should feel like a drop.
    equipped: { helm: null, chest: null, legs: null, gloves: null, boots: 'start-boots', offhand: null },
    inventory: [{ id: 'start-boots', ...gearPiece('boots', 'leather'), level: 1 }],
    pets: [],
    activePetId: null,
    stones: [],
    titles: [],
    lifetime: { volume: 0, distance: 0, sessions: 0, coop: 0, streak: 0, balance: 0, bossKm: 0 },
    week: { activeMinutes: 0, gamingHours: 0, km: 0, sessions: 0 },
  },
  campaign: { defeated: [], damage: 0 },
  // The map opens black. Every cell of it is somewhere you have not been yet.
  explored: [],
  session: null,
  log: [],
  chest: { unlocked: false, openedToday: false },
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
    avatar: { seed: 0, body: 'male', skin: SKIN_BASE, hair: HAIR_BASE, hairLength: 'short', shirt: TUNIC },
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
  // A stretch from Circular Quay down through the CBD already walked, so the
  // fog reads as a mechanic rather than a broken screen.
  session: null,
  explored: ["69,111", "69,112", "69,113", "69,114", "69,115", "69,116", "69,117", "70,109", "70,110", "70,111", "70,112", "70,113", "70,114", "70,115", "70,116", "70,117", "70,118", "70,119", "71,96", "71,97", "71,107", "71,108", "71,109", "71,110", "71,111", "71,112", "71,113", "71,114", "71,115", "71,116", "71,117", "71,118", "71,119", "71,120", "71,121", "72,94", "72,95", "72,96", "72,97", "72,98", "72,99", "72,100", "72,105", "72,106", "72,107", "72,108", "72,109", "72,110", "72,111", "72,112", "72,113", "72,114", "72,115", "72,116", "72,117", "72,118", "72,119", "72,120", "72,121", "72,122", "73,93", "73,94", "73,95", "73,96", "73,97", "73,98", "73,99", "73,100", "73,101", "73,102", "73,103", "73,104", "73,105", "73,106", "73,107", "73,108", "73,109", "73,110", "73,111", "73,112", "73,113", "73,114", "73,115", "73,116", "73,117", "73,118", "73,119", "73,120", "73,121", "73,122", "73,123", "74,93", "74,94", "74,95", "74,96", "74,97", "74,98", "74,99", "74,100", "74,101", "74,102", "74,103", "74,104", "74,105", "74,106", "74,107", "74,108", "74,109", "74,110", "74,111", "74,112", "74,113", "74,114", "74,115", "74,116", "74,117", "74,118", "74,119", "74,120", "74,121", "74,122", "74,123", "75,92", "75,93", "75,94", "75,95", "75,96", "75,97", "75,98", "75,99", "75,100", "75,101", "75,102", "75,103", "75,104", "75,105", "75,106", "75,107", "75,108", "75,109", "75,110", "75,111", "75,112", "75,113", "75,114", "75,115", "75,116", "75,117", "75,118", "75,119", "75,120", "75,121", "75,122", "75,123", "75,124", "76,92", "76,93", "76,94", "76,95", "76,96", "76,97", "76,98", "76,99", "76,100", "76,101", "76,102", "76,103", "76,104", "76,105", "76,106", "76,107", "76,108", "76,109", "76,110", "76,111", "76,112", "76,113", "76,114", "76,115", "76,116", "76,117", "76,118", "76,119", "76,120", "76,121", "76,122", "76,123", "76,124", "77,93", "77,94", "77,95", "77,96", "77,97", "77,98", "77,99", "77,100", "77,101", "77,102", "77,103", "77,104", "77,105", "77,106", "77,107", "77,108", "77,109", "77,110", "77,111", "77,112", "77,113", "77,114", "77,115", "77,116", "77,117", "77,118", "77,119", "77,120", "77,121", "77,122", "77,123", "78,93", "78,94", "78,95", "78,96", "78,97", "78,98", "78,99", "78,100", "78,101", "78,102", "78,103", "78,104", "78,105", "78,106", "78,107", "78,108", "78,109", "78,110", "78,111", "78,112", "78,113", "78,114", "78,115", "78,116", "78,117", "78,118", "78,119", "78,120", "78,121", "78,122", "78,123", "79,94", "79,95", "79,96", "79,97", "79,98", "79,99", "79,100", "79,101", "79,102", "79,103", "79,104", "79,105", "79,106", "79,107", "79,108", "79,109", "79,110", "79,111", "79,116", "79,117", "79,118", "79,119", "79,120", "79,121", "79,122", "80,95", "80,96", "80,97", "80,98", "80,99", "80,100", "80,101", "80,102", "80,103", "80,104", "80,105", "80,106", "80,107", "80,108", "80,109", "80,110", "80,118", "80,119", "80,120", "81,98", "81,99", "81,100", "81,101", "81,102", "81,103", "81,104", "81,105", "81,106", "81,107", "81,108", "82,100", "82,101", "82,102", "82,103", "82,104", "82,105", "82,106"],
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
