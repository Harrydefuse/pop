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

// Class = the game you main crossed with the training you actually do. The
// passive is deliberately small (a nudge, not a meta) so no class is mandatory.
export const CLASSES = [
  {
    id: 'duelist',
    name: 'DUELIST',
    tagline: 'Tac-shooter mains who train explosive',
    games: ['Valorant', 'CS2', 'Apex'],
    affinity: 'AGI',
    color: '#f43f5e',
    passive: { label: '+12% XP from HIIT & sprint work', type: 'xp', tags: ['hiit', 'sprint'], value: 0.12 },
  },
  {
    id: 'juggernaut',
    name: 'JUGGERNAUT',
    tagline: 'Fighting-game & tank players who move weight',
    games: ['Tekken 8', 'SF6', 'WoW'],
    affinity: 'STR',
    color: '#fb923c',
    passive: { label: '+12% XP from lifting sessions', type: 'xp', tags: ['lift'], value: 0.12 },
  },
  {
    id: 'ranger',
    name: 'RANGER',
    tagline: 'Battle-royale players who go long',
    games: ['Fortnite', 'Warzone', 'PUBG'],
    affinity: 'END',
    color: '#22d3ee',
    passive: { label: '+12% XP from distance work', type: 'xp', tags: ['run', 'ride'], value: 0.12 },
  },
  {
    id: 'arcanist',
    name: 'ARCANIST',
    tagline: 'MOBA & MMO players who prioritise recovery',
    games: ['League', 'Dota 2', 'FFXIV'],
    affinity: 'VIT',
    color: '#38bdf8',
    passive: { label: '+12% XP from mobility & recovery', type: 'xp', tags: ['mobility', 'recovery'], value: 0.12 },
  },
  {
    id: 'vanguard',
    name: 'VANGUARD',
    tagline: 'Hero-shooter generalists who train everything',
    games: ['Overwatch 2', 'Marvel Rivals', 'The Finals'],
    affinity: 'FOCUS',
    color: '#a855f7',
    passive: { label: '+6% XP from every source', type: 'xp', tags: ['*'], value: 0.06 },
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

// Three slots a day, and only three. Each one states its own minimum in plain
// words, so "did I do today's?" is answerable at a glance rather than by
// reading three near-identical progress bars.
export const DAILY_SLOTS = [
  {
    id: 'move',
    name: 'MOVE',
    lead: 'Get outside',
    rule: '20 minutes minimum. A walk counts.',
    minMinutes: 20,
    accepts: ['walk', 'run', 'ride', 'hiit', 'sport'],
    xp: 120,
    color: '#4ade80',
    icon: 'boot',
    sealsChest: true,
  },
  {
    id: 'sharpen',
    name: 'SHARPEN',
    lead: 'Work on your game',
    rule: '20 minutes minimum. Aim trainer or VOD review.',
    minMinutes: 20,
    accepts: ['aim', 'vod'],
    xp: 90,
    color: '#22d3ee',
    icon: 'crosshair',
  },
  {
    id: 'build',
    name: 'BUILD',
    lead: 'Build or recover',
    rule: 'A gym session, some mobility, or a proper sleep.',
    minMinutes: 0,
    accepts: ['lift', 'mobility', 'sleep'],
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

// Sealed chest: the delayed-gratification core loop. Every day you leave it
// sealed it gains a tier; opening early is always allowed but forfeits the rest.
export const CHEST_TIERS = [
  { day: 1, name: 'BRONZE', cores: 40, rolls: 1, floor: 'common', color: '#b07a4a' },
  { day: 2, name: 'IRON', cores: 90, rolls: 1, floor: 'common', color: '#94a3b8' },
  { day: 3, name: 'SILVER', cores: 160, rolls: 2, floor: 'uncommon', color: '#c5cdd8' },
  { day: 4, name: 'GOLD', cores: 260, rolls: 2, floor: 'uncommon', color: '#fbbf24' },
  { day: 5, name: 'PRISM', cores: 400, rolls: 3, floor: 'rare', color: '#5eead4' },
  { day: 6, name: 'VOID', cores: 600, rolls: 3, floor: 'rare', color: '#818cf8' },
  { day: 7, name: 'MYTHIC VAULT', cores: 900, rolls: 4, floor: 'epic', color: '#f59e0b' },
]

export const EQUIP_SLOTS = [
  { key: 'head', name: 'Headset', icon: 'headset' },
  { key: 'hands', name: 'Grips', icon: 'glove' },
  { key: 'feet', name: 'Runners', icon: 'shoe' },
  { key: 'wrist', name: 'Band', icon: 'band' },
  { key: 'charm', name: 'Charm', icon: 'charm' },
]

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
