// Hand-authored pixel art. Each sprite is a grid of single characters plus a
// palette mapping character -> colour ('.' is always transparent). Grids are
// rendered to SVG rects by <PixelSprite/>, so they scale to any size crisply.

const PET_PAL_BASE = {
  o: '#2b1a10', // outline
  k: '#141018', // eyes / pupils
  w: '#ffffff',
  H: '#191a2e', // headband
  N: '#f2ecff', // headband "100" marks
}

// ---------------------------------------------------------------- PUP (common)
export const PUP = {
  id: 'pup',
  w: 16,
  h: 16,
  palette: { ...PET_PAL_BASE, b: '#d9a066', l: '#f2cfa0', d: '#a86e3c' },
  grid: [
    '................',
    '...oooooooooo...',
    '..obbbbbbbbbbo..',
    'oddbbbbbbbbbbddo',
    'oddHHHHHHHHHHddo',
    'oddHNHNNHNNHHddo',
    'oddbllllllllbddo',
    'oddblkllllklbddo',
    'oddbllllllllbddo',
    '.obbllkkkkllbbo.',
    '..obbllwwllbbo..',
    '...obbbbbbbbo...',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbo....obbo..',
  ],
}

// ------------------------------------------------------------ TURBO (uncommon)
export const TURBO = {
  id: 'turbo',
  w: 16,
  h: 16,
  palette: { ...PET_PAL_BASE, s: '#2f6b34', p: '#57a04a', g: '#8fd17a', y: '#c9e88f' },
  grid: [
    '................',
    '................',
    '.....oooooo.....',
    '...oosssssoo....',
    '..ospsspsspso...',
    '.osssssssssso...',
    '.ospsspsspsso...',
    '.osssssssssso.oo',
    '.ospsspsspssooHo',
    '.osssssssssoNHo.',
    '.oggggggggggggo.',
    '..oggoyyoggggo..',
    '..ogo..ogo.ogo..',
    '...o....o...o...',
    '................',
    '................',
  ],
}

// ---------------------------------------------------------------- FROST (rare)
export const FROST = {
  id: 'frost',
  w: 16,
  h: 16,
  palette: { ...PET_PAL_BASE, b: '#1c2233', l: '#39435c', w: '#ffffff', y: '#f6a623' },
  grid: [
    '................',
    '.....oooooo.....',
    '....obbbbbbo....',
    '...obbbbbbbbo...',
    '...oHHHHHHHHo...',
    '...oHNHNNHNNo...',
    '...obwwwwwwbo...',
    '...obwkwwkwbo...',
    '...obwwyywwbo...',
    '...obwwwwwwbo...',
    '..obbwwwwwwbbo..',
    '..oblwwwwwwlbo..',
    '..oblwwwwwwlbo..',
    '..obbwwwwwwbbo..',
    '...obbwwwwbbo...',
    '....oyyo.oyyo...',
  ],
}

// ---------------------------------------------------------------- EMBER (epic)
export const EMBER = {
  id: 'ember',
  w: 16,
  h: 16,
  palette: {
    ...PET_PAL_BASE,
    b: '#7c4bc4', // body purple
    l: '#a978e8', // highlight
    d: '#4d2b80', // shadow / wing membrane
    y: '#f2cfa0', // belly
    r: '#f43f5e', // spikes
  },
  grid: [
    '................',
    '..o.........o...',
    '.oro.......oro..',
    '.orbo.ddd.obro..',
    '..obbooooobbo...',
    '..oHHHHHHHHHo.d.',
    '..oHNHNNHNNHodd.',
    '..obllllllllodd.',
    '..oblkllllklbdd.',
    '..obllyyyyllbdo.',
    '...obbllllbbo...',
    '..obbbyyyybbbo..',
    '.obbbyyyyyybbbo.',
    '.obbbyyyyyybbo..',
    '..obbbbbbbbo.o..',
    '...oo...oo..oo..',
  ],
}

// ------------------------------------------------------------- ZEUS (legendary)
export const ZEUS = {
  id: 'zeus',
  w: 16,
  h: 16,
  palette: {
    ...PET_PAL_BASE,
    m: '#b45309', // mane dark
    n: '#f59e0b', // mane light
    b: '#fcd34d', // body
    l: '#fde68a', // face highlight
  },
  grid: [
    '................',
    '....oooooooo....',
    '...omnmnmnmno...',
    '..omnmnmnmnmno..',
    '..oHHHHHHHHHHo..',
    '..oHNHNNHNNHHo..',
    '.omollllllllomo.',
    '.onolkllllklono.',
    '.omollllllllomo.',
    '.onollkkkkllono.',
    '..omollwwllomo..',
    '...ommlllmmo....',
    '...obbbbbbbo.n..',
    '..obbbbbbbbbono.',
    '..obbbbbbbbbno..',
    '..oo.oo..oo.o...',
  ],
}

export const PET_SPRITES = { pup: PUP, turbo: TURBO, frost: FROST, ember: EMBER, zeus: ZEUS }

// ------------------------------------------------------------------- EQUIPMENT
// 12x12 gear icons. 'A' is the accent colour and gets swapped per rarity at
// render time so one grid serves all five tiers of an item.
const GEAR_PAL = { o: '#0d0a16', s: '#5b6478', h: '#8f9bb3', A: '#a855f7', d: '#2a2438' }

export const GEAR_SPRITES = {
  headset: {
    w: 12,
    h: 12,
    palette: GEAR_PAL,
    grid: [
      '....oooo....',
      '..oosssoo...',
      '.ossAAAsso..',
      '.osoAAAoso..',
      'osso...osso.',
      'osAo...oAso.',
      'osAo...oAso.',
      'osAo...oAso.',
      'osso...osso.',
      '.oo.....oAo.',
      '.........oAo',
      '..........oo',
    ],
  },
  glove: {
    w: 12,
    h: 12,
    palette: GEAR_PAL,
    grid: [
      '..oo.oo.oo..',
      '.oAAoAAoAAo.',
      '.oAAoAAoAAo.',
      'ooAAAAAAAAo.',
      'oAAAAAAAAAo.',
      'oAAAAAAAAAo.',
      'oAAsssssAAo.',
      'oAAAAAAAAAo.',
      '.oAAAAAAAo..',
      '..ohhhhho...',
      '..ohhhhho...',
      '...ooooo....',
    ],
  },
  shoe: {
    w: 12,
    h: 12,
    palette: GEAR_PAL,
    grid: [
      '............',
      '...oooo.....',
      '..oAAAoo....',
      '..oAAAAoo...',
      '..oAAAAAoo..',
      '..oAAsAAAoo.',
      '.ooAAAAAAAo.',
      'oAAAAAAAAAo.',
      'ohhhhhhhhho.',
      'ossssssssso.',
      '.ooooooooo..',
      '............',
    ],
  },
  band: {
    w: 12,
    h: 12,
    palette: GEAR_PAL,
    grid: [
      '............',
      '..oooooooo..',
      '.osssssssso.',
      '.osAAAAAAso.',
      'oosAAAAAAsoo',
      'oAoAAddAAoAo',
      'oAoAAddAAoAo',
      'oosAAAAAAsoo',
      '.osAAAAAAso.',
      '.osssssssso.',
      '..oooooooo..',
      '............',
    ],
  },
  charm: {
    w: 12,
    h: 12,
    palette: GEAR_PAL,
    grid: [
      '.....oo.....',
      '....oAAo....',
      '....oAAo....',
      '...oooooo...',
      '..oAAAAAAo..',
      '.oAAAAAAAAo.',
      '.oAAAhAAAAo.',
      '.oAAAAAAAAo.',
      '..oAAAAAAo..',
      '...oAAAAo...',
      '....oAAo....',
      '.....oo.....',
    ],
  },
}

// ----------------------------------------------------------------- STONE / GEM
// One 10x10 gem, recoloured per stone via the `A` accent slot.
export const STONE_SPRITE = {
  w: 10,
  h: 10,
  palette: { o: '#0d0a16', A: '#a855f7', h: '#ffffff', d: '#3b1d63' },
  grid: [
    '...oooo...',
    '..ohhAAo..',
    '.ohAAAAAo.',
    'ohAAAAAAAo',
    'oAAAAAAAdo',
    'oAAAAAAddo',
    '.oAAAAddo.',
    '..oAAddo..',
    '...oddo...',
    '....oo....',
  ],
}

// ------------------------------------------------------------------ WORLD BOSS
// The Couch Titan — the app-wide raid target.
export const BOSS_SPRITE = {
  w: 20,
  h: 16,
  palette: {
    o: '#160b16',
    b: '#5b2340', // upholstery
    l: '#7d3358',
    d: '#3a1229',
    e: '#f43f5e', // eyes
    y: '#fbbf24',
    s: '#241026',
  },
  grid: [
    '....................',
    '..oooo........oooo..',
    '.oblllo......oblllo.',
    '.obllllooooobbllllo.',
    '.obllllbbbbbbllllbo.',
    'oobllllllllllllllboo',
    'obllleollllllloelllo',
    'obllleollllllloelllo',
    'obllllllsssslllllllo',
    'obllllsyyyysslllllbo',
    'obllllsssssslllllllo',
    'obbllllllllllllllbbo',
    'obddbbbbbbbbbbbbddbo',
    'obddoooooooooooodddo',
    'oddo..........oddo..',
    'oo................oo',
  ],
}

// --------------------------------------------------------------------- AVATARS
// Compact 12x12 heads used for friends, leaderboard rows and feed posts. Two
// silhouettes x recolourable skin/hair keeps the roster varied without art debt.
const AVATAR_A = [
  '...oooooo...',
  '..ohhhhhho..',
  '.ohhhhhhhho.',
  '.ohssssssho.',
  '.oskssskkso.',
  '.osssssssso.',
  '.ossskkssso.',
  '..osssssso..',
  '...oaaaao...',
  '..oaaaaaao..',
  '.oaaaaaaaao.',
  '.oaaaaaaaao.',
]

/** Long hair falls down both sides of the bust; short keeps the base outline. */
const AVATAR_LONG = AVATAR_A.map((row, y) =>
  y >= 3 && y <= 8 ? 'h' + row.slice(1, 11) + 'h' : row,
)

export function avatarSprite(seed = 0, skin = '#e8b48a', hair = '#2b1a10', shirt = '#a855f7', hairLength = 'short') {
  return {
    w: 12,
    h: 12,
    palette: { o: '#0d0a16', s: skin, h: hair, k: '#141018', a: shirt },
    grid: hairLength === 'long' ? AVATAR_LONG : AVATAR_A,
  }
}


// ------------------------------------------------------------------ THE HERO
// A full-body 16x24 character for the loadout screen. The 12x12 avatar is a
// head-and-shoulders bust — fine in a list row, but it crops to a face at the
// size the paper doll needs, so the hero gets its own taller sprite.
const HERO_GRID = [
  '.....oooooo.....',
  '....ohhhhhhoo...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohssssssho...',
  '...ohskssksho...',
  '...ohssssssho...',
  '...ohssoossho...',
  '....ossssso.....',
  '.....osso.......',
  '..ooaaaaaaaaoo..',
  '.osoaaaaaaaaoso.',
  '.osoaaaaaaaaoso.',
  '.osoaaaaaaaaoso.',
  '.osoaaaaaaaaoso.',
  '..ooaaaaaaaaoo..',
  '...oaaaaaaaao...',
  '...otttttttto...',
  '...otttttttto...',
  '...ottto.ottto..',
  '...ottto.ottto..',
  '...ottto.ottto..',
  '...obbbo.obbbo..',
  '...ooooo.ooooo..',
]


// ------------------------------------------------------- GEAR WORN ON THE HERO
// Same 16x24 frame as the hero, mostly transparent, so each piece lines up with
// the body when stacked on top. 'A' takes the item's rarity colour at render
// time — that is what makes a legendary visibly legendary on the character.
const EMPTY = '................'
const layer = (rows) => {
  const grid = Array.from({ length: 24 }, () => EMPTY)
  for (const [y, cells] of Object.entries(rows)) grid[y] = cells
  return { w: 16, h: 24, palette: { o: '#0d0a16', A: '#a855f7' }, grid }
}

export const GEAR_OVERLAYS = {
  head: layer({ 3: '...AAAAAAAAAA...', 4: '..AA........AA..', 5: '..AA........AA..' }),
  hands: layer({ 13: '.AAA........AAA.', 14: '.AAA........AAA.' }),
  feet: layer({ 22: '...AAAAA.AAAAA..', 23: '...AAAAA.AAAAA..' }),
  wrist: layer({ 12: '............AAA.' }),
  charm: layer({ 10: '.......AA.......', 11: '.......AA.......' }),
}

/**
 * The long-hair build is derived from the short one rather than drawn twice, so
 * the face, body and gear alignment can never drift between the two.
 */
const HERO_LONG = HERO_GRID.map((row, y) => {
  if (y >= 4 && y <= 9) return 'ohh' + row.slice(3, 13) + 'hho'
  if (y === 10) return 'oh' + row.slice(2, 14) + 'ho'
  return row
})

export function heroSprite(skin = '#e8b48a', hair = '#2b1a10', shirt = '#a855f7', hairLength = 'short') {
  return {
    w: 16,
    h: 24,
    palette: { o: '#0d0a16', s: skin, h: hair, k: '#141018', a: shirt, t: '#2b2440', b: '#171226' },
    grid: hairLength === 'long' ? HERO_LONG : HERO_GRID,
  }
}

export const AVATAR_SKINS = ['#f2cfa0', '#e8b48a', '#c68642', '#8d5524', '#5c3317', '#ffdbac']
export const AVATAR_HAIR = ['#2b1a10', '#7c3aed', '#22d3ee', '#f43f5e', '#fbbf24', '#f2ecff', '#4ade80']
