// The spine of the game. LVL100 is played like a story mode: you work down a
// fixed ladder of bosses, each one gated behind a level, and every session you
// log is damage on whichever one you are standing in front of. World raids are
// the side content — this is the part with an ending.

/** Three acts, each with its own colour so the path reads at a glance. */
export const ACTS = [
  {
    id: 'act1',
    numeral: 'I',
    name: 'THE STARTING LINE',
    blurb: 'The ones that get you before you have started.',
    color: 'var(--tone-green)',
  },
  {
    id: 'act2',
    numeral: 'II',
    name: 'THE GRIND',
    blurb: 'Nothing here is dramatic. That is what makes it hard.',
    color: 'var(--color-gold)',
  },
  {
    id: 'act3',
    numeral: 'III',
    name: 'THE HUNDRED',
    blurb: 'Past this point the only thing left in your way is you.',
    color: 'var(--color-neon-bright)',
  },
]

/**
 * `weak` is an activity tag that deals double damage. It is the only per-boss
 * mechanic, which keeps every fight readable — you never have to learn a new
 * system, you just look at what it is weak to and go and do that.
 */
export const CAMPAIGN = [
  {
    id: 'golem',
    act: 'act1',
    name: 'THE WARDEN',
    title: 'First Stone on the Road',
    sprite: 'golem',
    level: 5,
    hp: 900,
    weak: null,
    weakLabel: 'Anything at all',
    lore: 'It has stood at the trailhead so long that people just walk around it. It does not chase anyone. It waits, and most of the time waiting is enough.',
    beat: 'Nothing clever. Show up, log something, come back tomorrow.',
    reward: { cores: 500, gear: 'rare', title: 'Stonebreaker' },
  },
  {
    id: 'wraith',
    act: 'act1',
    name: 'THE SNOOZE WRAITH',
    title: 'Keeper of the Second Alarm',
    sprite: 'wraith',
    level: 9,
    hp: 1500,
    weak: 'recovery',
    weakLabel: 'Sleep',
    lore: 'It is not trying to stop you. It just wants you to start tomorrow instead.',
    beat: 'You beat the second alarm the night before, not the morning of.',
    reward: { cores: 400, gear: 'uncommon', title: 'Early Riser' },
  },
  {
    id: 'couch',
    act: 'act1',
    name: 'THE COUCH TITAN',
    title: 'Lord of the Second Season',
    sprite: 'couch-titan',
    level: 14,
    hp: 2600,
    weak: 'run',
    weakLabel: 'Walking and running',
    lore: 'Beaten once by the whole community. It reforms in every living room.',
    beat: 'Get outside and put one foot in front of the other.',
    reward: { cores: 600, pet: 'turbo', title: 'Off The Couch' },
  },
  {
    id: 'doomscroll',
    act: 'act1',
    name: 'THE DOOMSCROLLER',
    title: 'The One Who Watches Instead',
    sprite: 'doomscroll',
    level: 19,
    hp: 4200,
    weak: 'aim',
    weakLabel: 'Aim training and VOD review',
    lore: 'Four hours of feed and nothing to show for it. It feeds on the difference.',
    beat: 'Practise on purpose. Deliberate reps hurt it more than anything else.',
    reward: { cores: 900, gear: 'rare', title: 'Deliberate' },
  },
  {
    id: 'ironjaw',
    act: 'act2',
    name: 'IRONJAW',
    title: 'The Rack That Bit Back',
    sprite: 'ironjaw',
    level: 24,
    hp: 6000,
    weak: 'lift',
    weakLabel: 'Gym sessions',
    lore: 'It has been sitting in the corner of the gym since the day you joined.',
    beat: 'Load the bar. It only respects volume.',
    reward: { cores: 1200, gear: 'rare', title: 'Ironbound' },
  },
  {
    id: 'wall',
    act: 'act2',
    name: 'THE WALL',
    title: 'The Point Most People Stop',
    sprite: 'wall',
    level: 30,
    hp: 9500,
    weak: 'run',
    weakLabel: 'Walking and running',
    lore: 'Not a monster. A wall. It does nothing at all, and that is enough.',
    beat: 'Distance, and more of it than felt reasonable.',
    reward: { cores: 1800, pet: 'ember', title: 'Wallbreaker' },
  },
  {
    id: 'nox',
    act: 'act2',
    name: 'NOX',
    title: 'The Long Night',
    sprite: 'nox',
    level: 42,
    hp: 14000,
    weak: 'recovery',
    weakLabel: 'Sleep',
    lore: 'Every hour you did not sleep is still on the books, and it is counting.',
    beat: 'Go to bed. This is the one boss you beat lying down.',
    reward: { cores: 2400, gear: 'epic', title: 'Well Rested' },
  },
  {
    id: 'mirror',
    act: 'act3',
    name: 'THE MIRROR KNIGHT',
    title: 'Wearer of Your Build',
    sprite: 'mirror',
    level: 55,
    hp: 22000,
    weak: 'mobility',
    weakLabel: 'Mobility, yoga and calisthenics',
    lore: 'It has your stats, your gear and your habits. It also has your gaps.',
    beat: 'Train the thing you have been skipping. It cannot copy what you never built.',
    reward: { cores: 3500, gear: 'epic', title: 'Unmirrored' },
  },
  {
    id: 'backslide',
    act: 'act3',
    name: 'THE BACKSLIDE',
    title: 'The Coil',
    sprite: 'backslide',
    level: 70,
    hp: 34000,
    weak: 'hiit',
    weakLabel: 'HIIT and sprints',
    lore: 'It does not fight you. It waits for the week you skip, and takes it back.',
    beat: 'Short, hard, and often. Intensity is the only thing it flinches at.',
    reward: { cores: 5000, gear: 'legendary', title: 'Unbroken' },
  },
  {
    id: 'lvl100',
    act: 'act3',
    name: 'LVL100',
    title: 'You, Finished',
    sprite: 'lvl100',
    level: 88,
    hp: 60000,
    weak: null,
    weakLabel: 'Everything you have',
    lore: 'The last thing in the game is the thing on the box. It has been ahead of you the whole way.',
    beat: 'No weakness, no trick. Every single thing you log lands.',
    reward: { cores: 10000, pet: 'zeus', title: 'LVL100' },
  },
]

export const WEAK_MULT = 2

export function bossById(id) {
  return CAMPAIGN.find((b) => b.id === id) ?? null
}

export function actById(id) {
  return ACTS.find((a) => a.id === id) ?? ACTS[0]
}

export function bossesInAct(actId) {
  return CAMPAIGN.filter((b) => b.act === actId)
}
