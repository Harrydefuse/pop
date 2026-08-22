import { shade } from './color'

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

// ---------------------------------------------- TUSKLING (legendary, seasonal)
// Grimtusk's cub. Only players who put damage on the Season 2 world raid ever
// see one, so it wears the same greens and amber eyes as the boss it came from.
export const TUSKLING = {
  id: 'tuskling',
  w: 16,
  h: 16,
  palette: {
    ...PET_PAL_BASE,
    g: '#5f8a3a', // skin
    l: '#7fae4e', // lit
    d: '#3d5c26', // shadow / ears
    t: '#f0e9cf', // tusks
    e: '#fbbf24', // amber eyes
  },
  grid: [
    '................',
    '...oooooooooo...',
    '..oggggggggggo..',
    'oddggggggggggddo',
    'oddHHHHHHHHHHddo',
    'oddHNHNNHNNHHddo',
    'oddgllllllllgddo',
    'oddgleklleklgddo',
    'oddgllllllllgddo',
    '.oggltkkkktlggo.',
    '..oggllwwllggo..',
    '...oggggggggo...',
    '..ogllllllllgo..',
    '..ogllllllllgo..',
    '..oggggggggggo..',
    '..oggo....oggo..',
  ],
}

// Legendary companion. Front-facing like the rest of the roster so it sits in the
// collection grid as a set, and it wears the LVL100 band the same as every pet.
export const DRAKE = {
  w: 16,
  h: 16,
  palette: {
    o: '#1b2a1c',
    g: '#4f7a3c',
    l: '#79a85c',
    d: '#3f5f34',
    y: '#efe3b8',
    k: '#141018',
    w: '#9dc776',
    H: '#191a2e',
    N: '#f2ecff',
  },
  grid: [
    '................',
    '..o.........o...',
    '.oyo.......oyo..',
    '.oygo.....ogyo..',
    '..oggooooooggo..',
    '..oHHHHHHHHHHo..',
    '..oHNHNNHNNHHo..',
    'doggllllllllggod',
    'dwoglkllllklgowd',
    'dwogllllllllgowd',
    '.doggllwwllggod.',
    '...oggllllggo...',
    '..oggyyyyyyggo..',
    '.oggyyyyyyyyggo.',
    '..oggyyyyyyggo..',
    '...oggo..oggo...',
  ],
}

export const PET_SPRITES = { pup: PUP, turbo: TURBO, frost: FROST, ember: EMBER, zeus: ZEUS, tuskling: TUSKLING, drake: DRAKE }

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

// --------------------------------------------------------------- OGRE BOSS --
// Season 2's world boss. Bigger canvas than the pets because it carries a whole
// screen: heavy brow, sunken amber eyes, tusks over the top lip, and a club
// gripped in the right fist. Shaded with three greens rather than one so the
// mass reads at the size the raid card shows it.
export const OGRE_SPRITE = {
  w: 36,
  h: 39,
  palette: {
    o: '#101a0c', // outline
    g: '#5f8a3a', // skin
    l: '#7fae4e', // lit
    d: '#3d5c26', // shadow
    n: '#4c7230', // nose
    e: '#fbbf24', // eye
    k: '#0d1408', // socket
    t: '#f0e9cf', // tusks and teeth
    r: '#5e1c2b', // mouth
    b: '#6b4326', // loincloth
    w: '#7a5230', // club
    W: '#96683e',
    s: '#b9c0cc', // iron bands
  },
  grid: [
    '....................................',
    '...........................ooooooo..',
    '..............ooooooo.....owwwwwwwo.',
    '............oogggggggoo...owWWWWWwo.',
    '..........oogglllllllggoo.owssssswo.',
    '.........ogglllllllllllggoowWWWWWwo.',
    '........oglllllllllllllllgowssssswo.',
    '........oglllllllllllllllgowWWWWWwo.',
    '......oogglllllllllllllllggwwwwwwwo.',
    '.....ogggdddddddddddddddddgggwwwoo..',
    '....oggggdddddddddddddddddggggwwo...',
    '....oggggggkeekgggggkeekggggggwwo...',
    '.....ogggggkkkkgnnngkkkkgggggwwwo...',
    '......ooogttggggnnnggggttgooowwwo...',
    '........ogttggggnnnggggttgo.owwwo...',
    '.........ottrtrrtrrtrtrtto..owwwo...',
    '....oooooottgggggggggggttoooowwwo...',
    '...oggggggggggggggggggggggggowWwo...',
    '..oggggggglllllllllllllllgggowWwogo.',
    '..ogggggggggggggggggggggggggowWwogo.',
    '.oggggggdgggggggggggggggggdgowWwogo.',
    '.oggggggdgggggggggggggggggdgowWwogo.',
    '.oggggggdggggglllllllgggggdgowWwogo.',
    '.oggggggdgglllllllllllllggdgowWwogo.',
    '.oggggggdllllllllllllllllldgowWwogo.',
    '.oggggggdllllllllllllllllldgowWwogo.',
    '.oggggggdllllllllllllllllldgowWwogo.',
    '.oggggggdgglllllllllllllggdgodddddgo',
    'oggggggggggggglllllllggggggggldddlgo',
    'ogggggggggddddddddddddddddggdddddggo',
    'ogggggggggbbbbbbbbbbbbbbbbogggggggo.',
    '.ogggggggogggggggoogggggggoogggggo..',
    '..ogggggoogggggggoogggggggo.ooooo...',
    '...ooooo.ogdddddgoogdddddgo.........',
    '.........ogdddddgoogdddddgo.........',
    '........oogdddddgoogdddddgoo........',
    '.......oggggggggggggggggggggo.......',
    '.......oddddddddddddddddddddo.......',
    '........oooooooooooooooooooo........',
  ],
}

// ------------------------------------------------------------ CAMPAIGN BOSSES
// The story-mode ladder. Each one is an obstacle you actually meet — never a
// verdict on the player — so they are excuses, plateaus and sleep debt given a
// body, ending with the only thing left to beat: yourself, finished.

// The one that gets you before you have started. Hooded, half asleep, in no hurry.
export const WRAITH_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#1a1630',
    c: '#4c4a7a',
    d: '#35335c',
    l: '#6b6899',
    k: '#0e0c1c',
    e: '#67e8f9',
  },
  grid: [
    '..........ooooooo...........',
    '........oollllllloo.........',
    '.......olllllllllllo........',
    '......olllllllllllllo.......',
    '.....olllllllllllllllo......',
    '....oclllllllllllllllco.....',
    '....oclllllllllllllllco.....',
    '...occcllllkkkkkllllccco....',
    '...occcclkkkkkkkkklcccco....',
    '...occcckkkkkkkkkkkcccco....',
    '...occckkkkkkkkkkkkkccco....',
    '...occckeeekkkkkeeekccco....',
    '....occkkkkkkkkkkkkkcco.....',
    '....occckkkkkkkkkkkccco.....',
    '....ooccckkkkkkkkkcccoo.....',
    '...occccccckkkkkccccccco....',
    '...occccccccccccccccccco....',
    '...occdcccdcccccdcccdcco....',
    '...occdcccdcccccdcccdcco....',
    '..occcdcccdcccccdcccdccco...',
    '..occcdcccdcccccdcccdccco...',
    '..occcdcccdcccccdcccdccco...',
    '..occcdcccdcccccdcccdccco...',
    '.occccdcccdcccccdcccdcccco..',
    '.occccdcccdcccccdcccdcccco..',
    '.occccdcccdcccccdcccdcccco..',
    '.occccdcccdcccccdcccdcccco..',
    '..ocoocoocoocoocoocoocooco..',
    '.o.ocoooco.oco.ocoooco.oco..',
    'odo.oodoo.odo..odo..odo.o...',
  ],
}

// Lit from below by a screen at 1am. Everything above the jaw is in shadow.
export const DOOMSCROLL_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#140f22',
    b: '#2a2440',
    d: '#1c1830',
    s: '#5b4d42',
    g: '#f5e7c2',
    G: '#6d7c99',
    p: '#e0f2fe',
    P: '#0b0715',
    e: '#0b0715',
    h: '#171226',
  },
  grid: [
    '............................',
    '..........ooooooo...........',
    '........oohhhhhhhoo.........',
    '.......ohhhhhhhhhhho........',
    '......ohhhhhhhhhhhhho.......',
    '.....ohhhhhhhhhhhhhhho......',
    '.....ohhhhhhhhhhhhhhho......',
    '.....ohhhhhhhhhhhhhhho......',
    '......ohhhhhhhhhhhhho.......',
    '......oshheehhheehhso.......',
    '......ossseehhheessso.......',
    '.......ossssssssssso........',
    '.......ossgggggggsso........',
    '........ossgggggsso.........',
    '......ooobbsssssbbooo.......',
    '....oobGGGGGGGGGGGGGboo.....',
    '...obbbbGGGGGGGGGGGbbbbo....',
    '..obbbbbbGGGGGGGGGbbbbbbo...',
    '.obbbbbbbbGGGGGGGbbbbbbbbo..',
    'obbbbbbbbbbGGGGGbbbbbbbbbbo.',
    'obbbbbbbPPPPPPPPPPPbbbbbbbo.',
    'obbbbbbbPpppppppppPbbbbbbbo.',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPpppppppppPddddbbo..',
    '.obbddddPPPPPPPPPPPddddbbo..',
    '.obbddddbbbbbbbbbbbddddbbo..',
    '.obbbbbbbbbbbbbbbbbbbbbbbo..',
    '.obbbbbbbbbbbbbbbbbbbbbbbo..',
  ],
}

// A power rack that grew a skull and bit down on the bar.
export const IRONJAW_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#0d0f14',
    m: '#6b7280',
    h: '#a8aeb9',
    d: '#3f4550',
    e: '#f43f5e',
    r: '#fda4af',
    p: '#33333a',
    b: '#8b909b',
  },
  grid: [
    'dddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddd',
    'ddddoooooooooooooooooooodddd',
    'ddddo.....ooooooo......odddd',
    'dppdoooooommmmmmmooooooodppd',
    'ddddmhhhhhhhhhhhhhhhhhmodddd',
    'ddddmmmmmmmmmmmmmmmmmmmodddd',
    'ddddmdddddddddddddddddmodddd',
    'dppdmdddddddddddddddddmodppd',
    'ddddmmeeeeemmmmmeeeeemmodddd',
    'dddmmmerrremmmmmerrremmmdddd',
    'dddmmmerrremmmmmerrremmmdddd',
    'dppmmmeeeeemmmmmeeeeemmmdppd',
    'dddmmmmmmmmmmmmmmmmmmmmmdddd',
    'ddpppmmmmdddddddddmmmmmpppdd',
    'dpppppmmmdddddddddmmmmpppppd',
    'dpppppmhhmhhmhhmhhmhhmpppppd',
    'ppdddpphhdhhdhhdhhdhhppdddpp',
    'ppdddpphhmhhmhhmhhmhhppdddpp',
    'pdddddphhhhhhhhhhhhhhpdddddp',
    'pdddddpbbbbbbbbbbbbbbpdddddp',
    'pdddddpbbbbbbbbbbbbbbpdddddp',
    'ppdddppmmmmmmmmmmmmmmppdddpp',
    'ppdddppmmmmmmmmmmmmmmppdddpp',
    'dpppppoooooooooooooooopppppd',
    'dpppppo..............opppppd',
    'ddpppo................opppdd',
    'ddddo..................odddd',
    'ddddo..................odddd',
  ],
}

// Not a monster. A wall. That is the whole point of it.
export const WALL_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#1a0f0c',
    r: '#7f3d2e',
    R: '#96503c',
    m: '#463f3a',
    e: '#fbbf24',
    k: '#150e0a',
  },
  grid: [
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'RRRmRRRRRRmRRRRRRmRRRRRRmRRR',
    'rrrmrrrrrrmrrrrrrmrrrrrrmrrr',
    'rrrmrrrrrrmrrrrrrmrrrrrrmrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmkkkkkmmmmmmmmkkkkkmmmmm',
    'RRRmRkeeekmRRRRRRmkeeekRmRRR',
    'rrrmrkeeekmrrrrrrmkeeekrmrrr',
    'rrrmrkkkkkmrrrrrrmkkkkkrmrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmmmkmmmmmmmmmmmkmmmmmmmm',
    'RRRmRRRkkkmRRRRRRkkkRRRRmRRR',
    'rrrmrrrrkkkkrkkrkkkrrrrrmrrr',
    'rrrmrrrrrrkkkkkkkmrrrrrrmrrr',
    'mmmmmmmmmmmmkmmkmmmmmmmmmmmm',
    'mRRRRRRmRRRRRRmRRRRRRmRRRRRR',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mrrrrrrmrrrrrrmrrrrrrmrrrrrr',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'RRRmRRRRRRmRRRRRRmRRRRRRmRRR',
    'rrrmrrrrrrmrrrrrrmrrrrrrmrrr',
  ],
}

// Sleep debt with a crescent for a head and a night sky for a body.
export const NOX_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#0a0a18',
    i: '#1e1b4b',
    d: '#141232',
    v: '#3730a3',
    m: '#f5f3ea',
    w: '#ffffff',
    e: '#312e81',
    k: '#090818',
  },
  grid: [
    '...............oooo.........',
    '.............oommmmo........',
    '............ommmmmo.........',
    '...........ommmmmo..........',
    '..........ommmmmo...........',
    '.........ommmmmmo...........',
    '.........ommmmmo............',
    '........ommmmmmo............',
    '........ommmmmmo............',
    '........ommmmmmo............',
    '........ommeeemo............',
    '........ommeeemmo...........',
    '.........ommmmmmo...........',
    '.........ommmmmmmo..........',
    '..........ommmmmmmo.........',
    '.......oooiiiiiiimmoo.......',
    '.....ooiivvvvvvvvviimo......',
    '....oiiivvvvvvvvvvviiio.....',
    '....oiiiiiiiiiiiiiiiiio.....',
    '....oiiiiiiiiiiiiiiiiio.....',
    '.....oiiiiddddddwiiiio......',
    '....oiiiwidddddddiiiiio.....',
    '....oiiiidddddwdddiiiio.....',
    '...oiiiiiddddddddwiiiwio....',
    '...oiiiiddddwddddddiiiio....',
    '..oiiiwidddddddddddiiiiio...',
    '.oiiiiiddwddddddddddiiiiio..',
    '.oiiwiidddddddddddddwiiiio..',
    'oiiiiidddddddddwdddddiiiiio.',
    'iiiiiidddddddddddddddiwiiiio',
  ],
}

// Wears your build and swings your numbers back at you.
export const MIRROR_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#0d0b1a',
    s: '#8b8fa3',
    h: '#d6d9e8',
    d: '#494c5e',
    e: '#c084fc',
    g: '#a855f7',
    k: '#1b1a2b',
  },
  grid: [
    '...........ogggo............',
    '...........ogggo............',
    '..........ossssso...........',
    '.........ossssssso......ooo.',
    '........ohhhhhhhhho....ohsho',
    '.......ossssssssssso...ohsho',
    '......ossssssssssssso..ohsho',
    '......ossssssssssssso..ohsho',
    '......ossssssssssssso..ohsho',
    '......okkkkkkkkkkkkko..ohsho',
    '......okeeeeeeeeeeeko..ohsho',
    '......okkgggggggggkko..ohsho',
    '......okkkkkkkkkkkkko..ohsho',
    '...oooosssssssssssssoooohsho',
    '.oossssssssssssssssssssshsho',
    'ossssssssssssssssssssssshsho',
    'ssssssshddhhddhhddhhsssshsho',
    'ssssssshddhhddhhddhhsssshsho',
    'ssssssshddhhddhhddhhsssshsho',
    'osssssshddhhddhhddhhssssssss',
    '.oosssshddhhddhhddhhssssssss',
    '...oooohddhhddhhddhhoooohsho',
    '......ohddhhddhhddhho..ohsho',
    '......ohddhhddhhddhho..ohsho',
    '......ohddhhddhhddhho..ohsho',
    '......ohddhhddhhddhho..ohsho',
    '.......odddddoodddddo...ooo.',
    '.......odddddoodddddo.......',
    '.......odddddoodddddo.......',
    '.......odddddoodddddo.......',
  ],
}

// The coil that takes back every week you skip.
export const BACKSLIDE_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#100a1a',
    v: '#3b1f5c',
    g: '#5f3390',
    d: '#241239',
    l: '#a855f7',
    e: '#f43f5e',
    t: '#f0e9cf',
    r: '#fb7185',
    k: '#0b0612',
  },
  grid: [
    '............................',
    '..........ooooooo...........',
    '........oovvvvvvvoo.........',
    '......oovvgggggggvvoo.......',
    '.....odvvvvvvvvvvvvvdo......',
    '...oodvvveeevvveeevvvdoo....',
    '..odddvvveeevvveeevvvdddo...',
    '..odddvvvvvvvvvvvvvvvdddo...',
    '.odddddvvvvvvvvvvvvvdddddo..',
    '.oddddddvvvvvvvvvvvddddddo..',
    '.oddddddddttvvvttvvddddddo..',
    '..odddddddttvrvttvvvddddo...',
    '..oddddddddvvrvvvvvvddddo...',
    '...ooddddddvvrvvvvvvddoo....',
    '.....odddddvrvrvvvvvdo......',
    '......oooolvvvvvvvvvvooo....',
    '.........olvvvvvvvvvvvvvoo..',
    '........olvvvvvvvvvvvvvvvvo.',
    '.......ovlvvvvvvvvvvvgvvvvvo',
    '......ovlvvvvvvvvvvvvggggvvv',
    '......ovvgvvvvvvvvvvvgggggvv',
    '....ooovvvgggggggggggggggvvv',
    '..oovvvvvvvvvgggggggggvvvvvo',
    '.ovvvvdddddddddddddddddddvo.',
    'ovvvvdddddddddddddddddddoo..',
    'vvvgggggggggggggggggvvvo....',
    'vvgggggggggggggggggggvvo....',
    'vvvgggggggggggggggggvvvo....',
    'ovvvvvgggggggggggvvvvvo.....',
    '.ovvvvvvvvvvvvvvvvvvvo......',
  ],
}

// You, finished. The last thing in the game is the thing on the box.
export const LVL100_SPRITE = {
  w: 28,
  h: 30,
  palette: {
    o: '#1a1206',
    a: '#fbbf24',
    A: '#fde68a',
    g: '#d4a017',
    h: '#f7d774',
    d: '#8a6510',
    w: '#ffffff',
    c: '#7c2d12',
  },
  grid: [
    '...........ooooo......a.....',
    '....A.....ogggggo...........',
    '.........ogaaaaago.......A..',
    '.a......ogggggggggo.........',
    '.......ogggggggggggo........',
    '.......ogggggggggggo.......a',
    'a......oggwwgggwwggo........',
    '.......ogggggggggggo........',
    '....ooooggdddddddggoooo.....',
    '...occcccgdddddddgccccco..A.',
    '.A.ogggggcgggggggcgggggo....',
    '..ogggggggggggggggggggggo...',
    '.oggggggggghhhhhgggggggggo..',
    '.ogggggggghhhhhhhggggggggo.a',
    'aoggggggghhhhhhhhhgggggggo..',
    '..ogggggghhhhhhhhhggggggo...',
    '.ocgggggghhhhhhhhhggggggco..',
    '.ocggggcgghhhhhhhggcggggcoA.',
    '.Acggggcggghhhhhgggcggggco..',
    '.ocggggcgggggggggggcggggco..',
    '.ocggggcgggggggggggcggggco..',
    'occggggcdddddddddddcggggccoa',
    'accggggcdddddddddddcggggcco.',
    'occcccccgggggdgggggccccccco.',
    'occcccccgggggdgggggccccccco.',
    'ccccccccgggggdgggggccccccaco',
    'ccacccccgggggdgggggcccccccco',
    'ccccccccgggggdgggggcccccccco',
    'ccccccccgggggdgggggcccccacco',
    'ccccAcccgggggdgggggcccccccco',
  ],
}

// Act I opens on a slab of moving rock: crested skull, sunk red eyes, a grin of
// broken teeth, bronze cuffs and a sash. Every limb is cut from the torso by a
// hard dark channel, because at one grey it would read as a single boulder.
export const GOLEM_SPRITE = {
  w: 34,
  h: 42,
  palette: {
    o: '#12151c',
    s: '#5a6472',
    S: '#79838f',
    d: '#3d4550',
    k: '#242a33',
    e: '#e01b3c',
    E: '#ff5f76',
    t: '#e8eaf0',
    g: '#a97f34',
    G: '#d6a852',
    b: '#8a6a42',
    n: '#22332a',
  },
  grid: [
    '...........ooooooooooo............',
    '..........oSSSSSSSSSSSo...........',
    '........ooSSSSSSSSSSSSSoo.........',
    '.......oSSSSSSSSSSSSSSSSSo........',
    '.......oSSSSSSSSSSSSSSSSSo........',
    '.......oSSSSSSSSSSSSSSSSSo........',
    '......odddddddddddddddddddo.......',
    '......odddddddddddddddddddo.......',
    '......osskkkkkkssskkkkkksso.......',
    '......osskeEEekssskeEEeksso.......',
    '......osseeeekkssskkeeeesso.......',
    '.......oskkkkkkdddkkkkkkso........',
    '.......osssssssdddssssssso........',
    '...ooooosktktktktktktktksoooooo...',
    '..oSSSSSstttttttttttttttsoSSSSSo..',
    '.oSSSSSSstktktktktktktktsSSSSSSSo.',
    'oSSSSSSSsssssssssssssssssSSSSSSSSo',
    'sSSSSSSSSksSSSSSsSSSSSsskSSSSSSSSs',
    'sdddSSSSSkSSSSSSdSSSSSSskSSSSSddds',
    'sdddSSSSSkSSSSSSdSSSSSSSkSSSSSddds',
    'sdddSSSSskSSSSSSdSSSSSSSksSSSSddds',
    'sdssssssskSSSSSSdSSSSSSSksssssssds',
    'odddssssskSSSSSSdSSSSSSsksssssdddo',
    '.oddsssssksSddddddddddssksssssddo.',
    '.oddssssskssddssssssddssksssssddo.',
    '.oddssssskssddssssssddssksssssddo.',
    '.oddssssskssddsGGGssddssksssssddo.',
    '.oGGGGGGGkssddGGgGGsddsskGGGGGGGo.',
    '.ogsssssgkbbbbGgggGbbbbbkgsssssgo.',
    '.ossssssskbbbbGGgGGbbbbbkssssssso.',
    'ossdddddskonnnnGGGbnnnnoksdddddsso',
    'osssssssskonnnnbbbbnnnnoksssssssso',
    'ossssssssksssssskkssssssksssssssso',
    '.ossssssskSSSsddkkddsSSSkssssssso.',
    '..osssssokSSSsddkkddsSSSkossssso..',
    '...ooooookSSSsddkkddsSSSkoooooo...',
    '........okssssddkkddssssko........',
    '.......osksssssskksssssskso.......',
    '.......osssssssskksssssssso.......',
    '.......osksksksskksskskskso.......',
    '.......oddddddddkkddddddddo.......',
    '........oooooooooooooooooo........',
  ],
}

export const CAMPAIGN_SPRITES = { golem: GOLEM_SPRITE, wraith: WRAITH_SPRITE, doomscroll: DOOMSCROLL_SPRITE, ironjaw: IRONJAW_SPRITE, wall: WALL_SPRITE, nox: NOX_SPRITE, mirror: MIRROR_SPRITE, backslide: BACKSLIDE_SPRITE, lvl100: LVL100_SPRITE }

export const BOSS_SPRITES = { 'couch-titan': BOSS_SPRITE, ogre: OGRE_SPRITE }

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

export function avatarSprite(seed = 0, skin = '#e8b48a', hair = '#2b1a10', shirt = TUNIC, hairLength = 'short') {
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
  '....o..o..o.....',
  '...ohoohoohho...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhssssssho...',
  '..ohsssssssho...',
  '..ohskssssksho..',
  '..ohssssssssho..',
  '...ossssssso....',
  '.....ossso......',
  '..ooaaaaaaaaoo..',
  '.oaoaaaaaaaaoao.',
  '.osoaaaaaaaaoso.',
  '.osoaaaaaaaaoso.',
  '.osoaaaaaaaaoso.',
  '..ooaaaaaaaaoo..',
  '...obbbbbbbbo...',
  '...otttttttto...',
  '...ottto.ottto..',
  '...ottto.ottto..',
  '...ottto.ottto..',
  '...ossso.ossso..',
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

/**
 * The hero's palette is generated, not written down.
 *
 * Shaded character art uses a ramp per material — a few tones of hair, of skin,
 * of cloth — but the player only ever picks one colour for each. RAMPS maps
 * every palette slot to the material it belongs to and how far off the base it
 * sits, so one picked colour fills the whole ramp and drop-in art can be
 * annotated instead of recoloured by hand.
 *
 * Offsets are percentages toward white (positive) or black (negative).
 */
const HERO_RAMPS = {
  skin: { s: 0 },
  hair: { h: 0 },
  tunic: { a: 0 },
}

/** Slots that never change with the player's choices. */
const HERO_FIXED = { o: '#0d0a16', k: '#141018', t: '#4a331f', b: '#5c4326' }

export function heroPalette(skin = '#e8b48a', hair = '#2b1a10', shirt = TUNIC) {
  const palette = { ...HERO_FIXED }
  for (const [key, off] of Object.entries(HERO_RAMPS.skin)) palette[key] = shade(skin, off)
  for (const [key, off] of Object.entries(HERO_RAMPS.hair)) palette[key] = shade(hair, off)
  for (const [key, off] of Object.entries(HERO_RAMPS.tunic)) palette[key] = shade(shirt, off)
  return palette
}

export function heroSprite(skin = '#e8b48a', hair = '#2b1a10', shirt = TUNIC, hairLength = 'short') {
  const grid = hairLength === 'long' ? HERO_LONG : HERO_GRID
  return { w: grid[0].length, h: grid.length, palette: heroPalette(skin, hair, shirt), grid }
}

/** The base character's tunic. Onboarding does not offer a shirt colour, so
 *  this is what every hero wears until gear covers it. */
export const TUNIC = '#8a8055'

export const AVATAR_SKINS = ['#f2cfa0', '#e8b48a', '#c68642', '#8d5524', '#5c3317', '#ffdbac']
export const AVATAR_HAIR = ['#6b4226', '#2b1a10', '#7c3aed', '#22d3ee', '#f43f5e', '#fbbf24', '#f2ecff', '#4ade80']
