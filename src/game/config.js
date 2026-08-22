// Core tuning constants for LVL100. Everything balance-related lives here so the
// numbers can be argued about in one place instead of hunted through screens.

export const MAX_LEVEL = 100

export const RARITY = {
  common: { key: 'common', label: 'COMMON', color: 'var(--color-r-common)', weight: 60, mult: 1 },
  uncommon: { key: 'uncommon', label: 'UNCOMMON', color: 'var(--color-r-uncommon)', weight: 25, mult: 1.35 },
  rare: { key: 'rare', label: 'RARE', color: 'var(--color-r-rare)', weight: 10, mult: 1.8 },
  epic: { key: 'epic', label: 'EPIC', color: 'var(--color-r-epic)', weight: 4, mult: 2.5 },
  legendary: { key: 'legendary', label: 'LEGENDARY', color: 'var(--color-r-legendary)', weight: 1, mult: 4 },
}

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

// Five trainable stats. Every logged activity maps onto one or two of them, so
// the character sheet is a direct read-out of how you actually train.
export const STATS = [
  { key: 'STR', name: 'Strength', color: '#f43f5e', blurb: 'Lifting volume, calisthenics, carries' },
  { key: 'END', name: 'Endurance', color: '#22d3ee', blurb: 'Running, cycling, rowing, swimming' },
  { key: 'AGI', name: 'Agility', color: '#a3e635', blurb: 'HIIT, sprints, sport, mobility' },
  { key: 'VIT', name: 'Vitality', color: '#fbbf24', blurb: 'Sleep, steps, recovery, hydration' },
  { key: 'FOCUS', name: 'Focus', color: '#a855f7', blurb: 'Aim training, consistency, balance days' },
]

export const STAT_KEYS = STATS.map((s) => s.key)

// Class is how you actually train, not which game you play — the games you
// enjoy are captured separately, because the two rarely line up. Passives are
// deliberately small (a nudge, not a meta) so no class is a wrong pick.
export const CLASSES = [
  {
    id: 'strider',
    name: 'STRIDER',
    tagline: 'Runners, riders, rowers',
    blurb: 'You measure a good week in kilometres.',
    affinity: 'END',
    color: '#22d3ee',
    icon: 'boot',
    passive: { label: '+12% XP from running and riding', type: 'xp', tags: ['run', 'ride'], value: 0.12 },
  },
  {
    id: 'juggernaut',
    name: 'JUGGERNAUT',
    tagline: 'Barbells, dumbbells, the squat rack',
    blurb: 'If it is heavy, you want to pick it up.',
    affinity: 'STR',
    color: '#f43f5e',
    icon: 'dumbbell',
    passive: { label: '+12% XP from gym sessions', type: 'xp', tags: ['lift'], value: 0.12 },
  },
  {
    id: 'ironstride',
    name: 'IRONSTRIDE',
    tagline: 'Lifts heavy and still runs',
    blurb: 'Leg day and a 10k in the same week.',
    affinity: 'AGI',
    color: '#c084fc', // brighter than the base neon so 7px labels clear 4.5:1 on a tint
    icon: 'bolt',
    // Smaller bonus across two disciplines rather than a big one on a single
    // lane: the hybrid trades depth for breadth, exactly like the training does.
    passive: { label: '+8% XP from lifting and distance', type: 'xp', tags: ['lift', 'run', 'ride'], value: 0.08 },
  },
  {
    id: 'adept',
    name: 'ADEPT',
    tagline: 'Calisthenics, yoga, pilates, walking',
    blurb: 'Your body is the only equipment you need.',
    affinity: 'VIT',
    color: '#4ade80',
    icon: 'lotus',
    passive: { label: '+12% XP from bodyweight and mobility', type: 'xp', tags: ['mobility'], value: 0.12 },
  },
]

// Competitive ranks, driven by weekly Power rather than lifetime level so a
// returning player can climb back without regrinding a hundred levels.
export const RANKS = [
  { key: 'bronze', name: 'BRONZE', min: 0, color: '#b07a4a' },
  { key: 'silver', name: 'SILVER', min: 400, color: '#c5cdd8' },
  { key: 'gold', name: 'GOLD', min: 900, color: '#fbbf24' },
  { key: 'platinum', name: 'PLATINUM', min: 1600, color: '#5eead4' },
  { key: 'diamond', name: 'DIAMOND', min: 2600, color: '#60a5fa' },
  { key: 'ascendant', name: 'ASCENDANT', min: 4000, color: '#4ade80' },
  { key: 'immortal', name: 'IMMORTAL', min: 6000, color: '#f43f5e' },
  { key: 'lvl100', name: 'LVL100', min: 9000, color: '#a855f7' },
]

// Activity catalogue. `unit` drives the logging UI, `per` is how much of that
// unit equals one "block" of reward, and `stats` splits the block across stats.
// `minPerUnit` converts an amount into minutes so a daily slot can hold one
// honest minimum ("20 minutes") no matter which activity fills it.
export const ACTIVITIES = [
  {
    id: 'walk',
    name: 'Walk',
    tag: 'run',
    unit: 'min',
    per: 10,
    minPerUnit: 1,
    xp: 30,
    stats: { VIT: 3, END: 2 },
    step: 5,
    default: 20,
    icon: 'boot',
    boss: 0.08,
  },
  {
    id: 'run',
    name: 'Run',
    tag: 'run',
    unit: 'km',
    per: 1,
    minPerUnit: 6,
    xp: 55,
    stats: { END: 5, AGI: 1 },
    step: 0.5,
    default: 5,
    icon: 'boot',
    boss: 1, // 1 km = 1 damage against the world boss
  },
  {
    id: 'ride',
    name: 'Ride',
    tag: 'ride',
    unit: 'km',
    per: 3,
    minPerUnit: 2.5,
    xp: 50,
    stats: { END: 4, AGI: 1 },
    step: 1,
    default: 15,
    icon: 'wheel',
    boss: 0.34,
  },
  {
    id: 'hiit',
    name: 'HIIT / Sprints',
    tag: 'hiit',
    unit: 'min',
    per: 10,
    minPerUnit: 1,
    xp: 70,
    stats: { AGI: 5, END: 2, STR: 1 },
    step: 5,
    default: 20,
    icon: 'bolt',
    boss: 0.4,
  },
  {
    id: 'sport',
    name: 'Sport / Climb',
    tag: 'sprint',
    unit: 'min',
    per: 15,
    minPerUnit: 1,
    xp: 60,
    stats: { AGI: 4, STR: 2, END: 2 },
    step: 15,
    default: 60,
    icon: 'hold',
    boss: 0.3,
  },
  {
    id: 'lift',
    name: 'Gym session',
    tag: 'lift',
    unit: 'kg volume',
    per: 1000,
    minPerUnit: 1 / 90,
    xp: 90,
    stats: { STR: 6, VIT: 1 },
    step: 500,
    default: 4000,
    icon: 'dumbbell',
  },
  {
    id: 'mobility',
    name: 'Mobility / Yoga',
    tag: 'mobility',
    unit: 'min',
    per: 15,
    minPerUnit: 1,
    xp: 45,
    stats: { VIT: 4, AGI: 2 },
    step: 5,
    default: 20,
    icon: 'lotus',
  },
  {
    id: 'bodyweight',
    name: 'Calisthenics / Pilates',
    tag: 'mobility',
    unit: 'min',
    per: 15,
    minPerUnit: 1,
    xp: 55,
    stats: { STR: 3, AGI: 3, VIT: 1 },
    step: 5,
    default: 30,
    icon: 'hold',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    tag: 'recovery',
    unit: 'hours',
    per: 1,
    minPerUnit: 60,
    xp: 18,
    stats: { VIT: 3, FOCUS: 2 },
    step: 0.5,
    default: 8,
    icon: 'moon',
  },
  {
    id: 'aim',
    name: 'Aim training',
    tag: 'aim',
    unit: 'min',
    per: 15,
    minPerUnit: 1,
    xp: 30,
    stats: { FOCUS: 5 },
    step: 5,
    default: 20,
    icon: 'crosshair',
    gaming: true,
  },
  {
    id: 'vod',
    name: 'VOD review',
    tag: 'aim',
    unit: 'min',
    per: 15,
    minPerUnit: 1,
    xp: 28,
    stats: { FOCUS: 4 },
    step: 5,
    default: 20,
    icon: 'play',
    gaming: true,
  },
]

// Three slots a day, and only three. Names are one word so a card can stay
// small; the detail (what counts, the minimum) lives behind a tap rather than
// on the surface.
export const DAILY_SLOTS = [
  {
    id: 'active',
    name: 'ACTIVE',
    rule: '20 minutes of anything active',
    detail: 'A walk counts. So does a run, a ride, a class or a kickabout.',
    examples: 'Walk · Run · Ride · HIIT · Sport',
    minMinutes: 20,
    accepts: ['walk', 'run', 'ride', 'hiit', 'sport'],
    xp: 120,
    color: '#4ade80',
    icon: 'boot',
    unlocksChest: true,
  },
  {
    id: 'aim',
    name: 'AIM',
    rule: '20 minutes on your game',
    detail: 'Aim trainer or reviewing a VOD. Both build the same thing.',
    examples: 'Aim trainer · VOD review',
    minMinutes: 20,
    accepts: ['aim', 'vod'],
    xp: 90,
    color: '#22d3ee',
    icon: 'crosshair',
  },
  {
    id: 'recover',
    name: 'RECOVER',
    rule: 'Gym, mobility or sleep',
    detail: 'Anything that builds you back up. Sleep counts as training here.',
    examples: 'Gym · Calisthenics · Mobility · Sleep',
    minMinutes: 0,
    accepts: ['lift', 'bodyweight', 'mobility', 'sleep'],
    xp: 100,
    color: '#fbbf24',
    icon: 'dumbbell',
  },
]

// Anti-cheat: only activities that arrive through a connected health provider
// count at full value and are eligible for ranked leaderboards.
export const UNVERIFIED_XP_MULT = 0.5

export const STREAK_TIERS = [
  { days: 3, mult: 1.05, label: 'Warm' },
  { days: 7, mult: 1.1, label: 'Locked in' },
  { days: 14, mult: 1.15, label: 'Dialled' },
  { days: 30, mult: 1.25, label: 'Relentless' },
  { days: 60, mult: 1.35, label: 'Machine' },
  { days: 100, mult: 1.5, label: 'Ascended' },
]

// One chest a day, unlocked by moving. Every open can roll anything — the pull
// is the reward, not a ladder you have to keep climbing.
export const DAILY_CHEST = {
  name: 'DAILY CHEST',
  cores: 220,
  rolls: 2,
  note: 'Any rarity, every single day.',
}

// Six armour slots — a full set, the way an RPG does it. The old five were gym
// accessories (headset, grips, runners) which never looked like loot.
export const EQUIP_SLOTS = [
  { key: 'helm', name: 'Helm', icon: 'helm' },
  { key: 'chest', name: 'Chest', icon: 'chest' },
  { key: 'legs', name: 'Legs', icon: 'legs' },
  { key: 'gloves', name: 'Gauntlets', icon: 'gloves' },
  { key: 'boots', name: 'Boots', icon: 'boots' },
  { key: 'offhand', name: 'Offhand', icon: 'shield' },
]

/** What each slot is good for. Rarity and level scale these in gearBonuses. */
export const SLOT_STATS = {
  helm: { FOCUS: 3, VIT: 1 },
  chest: { VIT: 4, STR: 1 },
  legs: { END: 3, STR: 2 },
  gloves: { STR: 4, AGI: 1 },
  boots: { AGI: 3, END: 2 },
  offhand: { VIT: 3, FOCUS: 2 },
}

/**
 * The offhand takes either, and the two pull in opposite directions — hold the
 * line or push the pace. It is the one slot where the choice is yours rather
 * than just "whichever number is bigger".
 */
export const OFFHAND_KINDS = [
  { id: 'shield', name: 'Shield', stats: { VIT: 3, FOCUS: 2 }, blurb: 'Take the hit. Steadier, harder to knock off a streak.' },
  { id: 'sword', name: 'Sword', stats: { STR: 3, AGI: 2 }, blurb: 'Take the shot. Hits harder, leaves you open.' },
]

export function offhandKind(id) {
  return OFFHAND_KINDS.find((k) => k.id === id) ?? OFFHAND_KINDS[0]
}

/**
 * Rarity and set are the same thing, deliberately. A legendary drop is always a
 * Gilded piece, so the colour of the frame and the look of the item agree — and
 * chasing legendaries means chasing a set you can actually picture.
 */
export const ARMOUR_SETS = [
  { id: 'leather', name: "Traveller's Leathers", short: 'Leather', rarity: 'common',
    blurb: 'What everyone starts in. Soft, quiet, does the job.' },
  { id: 'iron', name: 'Ironguard', short: 'Iron', rarity: 'uncommon',
    blurb: 'Heavy, honest plate. Dents rather than breaks.' },
  { id: 'bone', name: 'Bonewrought', short: 'Bone', rarity: 'rare',
    blurb: 'Pale and light. Cut from something that used to walk.' },
  { id: 'verdant', name: 'Verdant Mail', short: 'Verdant', rarity: 'epic',
    blurb: 'Still growing. Warm to the touch after a long day.' },
  { id: 'gilded', name: 'Gilded Regalia', short: 'Gilded', rarity: 'legendary',
    blurb: 'Absurd, impractical, and worth every kilometre.' },
]

export function setForRarity(rarity) {
  return ARMOUR_SETS.find((s) => s.rarity === rarity) ?? ARMOUR_SETS[0]
}

export function armourSet(id) {
  return ARMOUR_SETS.find((s) => s.id === id) ?? ARMOUR_SETS[0]
}

// Six long-horizon milestones. Deliberately measured in months, not days —
// these are the things you cannot buy, rush or fake.
export const STONES = [
  {
    key: 'power',
    name: 'POWER',
    color: '#a855f7',
    metric: 'volume',
    goal: 100000,
    unit: 'kg lifted',
    reward: '+5% STR gains, forever',
  },
  {
    key: 'space',
    name: 'SPACE',
    color: '#38bdf8',
    metric: 'distance',
    goal: 1000,
    unit: 'km covered',
    reward: '+5% END gains, forever',
  },
  {
    key: 'reality',
    name: 'REALITY',
    color: '#f43f5e',
    metric: 'sessions',
    goal: 300,
    unit: 'verified sessions',
    reward: 'Unlocks Reality skins',
  },
  {
    key: 'soul',
    name: 'SOUL',
    color: '#fb923c',
    metric: 'coop',
    goal: 100,
    unit: 'friend challenges',
    reward: 'Squad XP aura +3%',
  },
  {
    key: 'time',
    name: 'TIME',
    color: '#4ade80',
    metric: 'streak',
    goal: 365,
    unit: 'day streak',
    reward: 'Second streak shield slot',
  },
  {
    key: 'mind',
    name: 'MIND',
    color: '#fbbf24',
    metric: 'balance',
    goal: 200,
    unit: 'balanced days',
    reward: 'Focus gains doubled',
  },
]

export const CURRENCY = { cores: 'CORES', shards: 'SHARDS' }

// Upgrading equipment costs cores and scales with both level and rarity, so a
// legendary is a long project rather than an instant power spike.
export function upgradeCost(item) {
  const r = RARITY[item.rarity]
  return Math.round(60 * Math.pow(item.level, 1.35) * r.mult)
}


// The games someone actually plays, captured at sign-up. This is social data,
// not an account link: it drives friend suggestions and game-specific
// challenges later, so it needs a genre rather than a login.
export const GAME_CATALOG = [
  { id: 'valorant', name: 'Valorant', genre: 'Tac shooter' },
  { id: 'cs2', name: 'CS2', genre: 'Tac shooter' },
  { id: 'r6', name: 'Rainbow Six', genre: 'Tac shooter' },
  { id: 'overwatch', name: 'Overwatch 2', genre: 'Hero shooter' },
  { id: 'rivals', name: 'Marvel Rivals', genre: 'Hero shooter' },
  { id: 'thefinals', name: 'The Finals', genre: 'Hero shooter' },
  { id: 'fortnite', name: 'Fortnite', genre: 'Battle royale' },
  { id: 'warzone', name: 'Warzone', genre: 'Battle royale' },
  { id: 'apex', name: 'Apex Legends', genre: 'Battle royale' },
  { id: 'pubg', name: 'PUBG', genre: 'Battle royale' },
  { id: 'lol', name: 'League of Legends', genre: 'MOBA' },
  { id: 'dota', name: 'Dota 2', genre: 'MOBA' },
  { id: 'deadlock', name: 'Deadlock', genre: 'MOBA' },
  { id: 'wow', name: 'World of Warcraft', genre: 'MMO' },
  { id: 'ffxiv', name: 'Final Fantasy XIV', genre: 'MMO' },
  { id: 'osrs', name: 'Old School RuneScape', genre: 'MMO' },
  { id: 'rocketleague', name: 'Rocket League', genre: 'Sports' },
  { id: 'eafc', name: 'EA FC', genre: 'Sports' },
  { id: 'nba2k', name: 'NBA 2K', genre: 'Sports' },
  { id: 'tekken', name: 'Tekken 8', genre: 'Fighting' },
  { id: 'sf6', name: 'Street Fighter 6', genre: 'Fighting' },
  { id: 'smash', name: 'Smash Bros', genre: 'Fighting' },
  { id: 'minecraft', name: 'Minecraft', genre: 'Sandbox' },
  { id: 'gta', name: 'GTA', genre: 'Sandbox' },
  { id: 'roblox', name: 'Roblox', genre: 'Sandbox' },
  { id: 'eldenring', name: 'Elden Ring', genre: 'Single player' },
  { id: 'destiny', name: 'Destiny 2', genre: 'Looter shooter' },
  { id: 'poe', name: 'Path of Exile', genre: 'Looter shooter' },
]

export const GAME_GENRES = [...new Set(GAME_CATALOG.map((g) => g.genre))]
