// The map, drawn as art rather than as a chart.
//
// Every terrain cell is 100 metres of Sydney and gets an 8x8 tile: a tree has a
// trunk and a canopy, a house has a roof and windows, a road has a junction
// mark. That is the whole difference between a map that reads as a diagram and
// one that reads as a place you walk through.
//
// Tiles are written as character grids against TILE_PALETTE, the same way the
// sprites are, so they stay editable by hand.

export const TILE = 8

/** Ink. Every drawn map has a dark line where land meets water — it is the
 *  single thing that separates an illustrated map from a coloured chart. */
export const COAST_INK = '#4a3a24'

export const TILE_PALETTE = {
  // land
  '.': '#cbb98c', // open ground, dry
  ':': '#dbcb9f', // ground, caught by the light
  ',': '#b3a075', // ground, in shade
  p: '#7fa04a', // parkland
  P: '#94b45c', // parkland highlight
  // canopy
  c: '#3f6f2c',
  C: '#568a36',
  v: '#2b4f1e',
  n: '#5a3b22', // trunk
  // built
  w: '#cfc3ad',
  W: '#a2957f',
  f: '#a85a44', // terracotta, lit
  F: '#7c3f31', // terracotta, shaded
  g: '#5d6f8a', // slate roof, lit
  G: '#42506a', // slate roof, shaded
  i: '#f2d98a', // a lit window
  I: '#38455c', // a dark one
  // ground
  r: '#efe3c2',
  R: '#d6c69f',
  Y: '#e2913f', // the big roads, the way a road atlas draws them
  y: '#f2b969',
  s: '#f0dfae',
  S: '#ddc994',
  k: '#a3927a',
  K: '#82735d',
  // water
  d: '#215a92',
  D: '#1a4c7e',
  l: '#2d6ea9',
  a: '#4aa0d8',
  A: '#63b3e6',
  o: '#bfe4f5',
  // landmarks
  x: '#c9d2da',
  X: '#8e99a3',
  m: '#f7f5ea',
  M: '#cdc9b6',
}

/** Two or three cuts of each ground type, so a hillside is not a repeated stamp. */
const GRASS = [
  ['........', '..::....', '.:::....', '........', '........', '.....,..', '....,,,.', '........'],
  ['....::..', '...:::..', '........', '.,,.....', '.,,,....', '........', '.....::.', '......:.'],
  ['........', '.....:..', '....:::.', '........', '..,,....', '.,,,....', '........', '...:....'],
  ['..,,....', '.,,,,...', '........', '......::', '.....:::', '........', '..:.....', '........'],
]

const GRASS_DARK = [
  ['..,,....', '.,,,,...', '........', '.....,,.', '....,,,.', '........', '.,,.....', '........'],
  ['........', '...,,...', '..,,,,..', '........', '......,,', '.....,,,', '........', '..,,....'],
]

const PARK = [
  ['pppppppp', 'ppPppppp', 'pppppppp', 'ppppppPp', 'pppppppp', 'pPpppppp', 'pppppppp', 'ppppPppp'],
  ['pppppppp', 'ppppPppp', 'pPpppppp', 'pppppppp', 'ppppppPp', 'pppppppp', 'pppPpppp', 'pppppppp'],
]

/** A tree is a trunk and a canopy with the light on one side. Nothing else in
 *  the whole map does as much to make it look drawn. */
const TREE = [
  ['..CCC...', '.CCCcc..', '.CCcccv.', '..cccv..', '...nn...', '...nn...', '..,..,..', '........'],
  ['...CCC..', '..CCCcc.', '.CCccccv', '..cccvv.', '...nn...', '...nn...', '..,...,.', '........'],
  ['..CCc...', '.CCcccv.', '..ccvv..', '...nn...', '...nn...', '..,.....', '.....CC.', '....Ccc.'],
]

const TREE_DEEP = [
  ['.CCc....', 'CCccv...', '.ccvv...', '..nn....', '..nn.CCc', '....CCcc', '.....nn.', '..,..nn.'],
  ['....CCc.', '...CCccv', '...cccv.', '....nn..', '.CCc.nn.', 'CCccv...', '..nn....', '..nn..,.'],
  ['..vccv..', '.vcCCcv.', '.cCCCcv.', '.vcCccv.', '..vccv..', '...nn...', '...nn...', '..,..,..'],
]

/** Houses read as houses because of the roof pitch — flat blocks read as boxes. */
const HOUSE = [
  ['........', '...ff...', '..ffFF..', '.ffffFF.', '.wwwwww.', '.wiwwIw.', '.wwwwww.', '.WWWWWW.'],
  ['........', '...gg...', '..ggGG..', '.ggggGG.', '.wwwwww.', '.wIwwiw.', '.wwwwww.', '.WWWWWW.'],
  ['..ff....', '.ffFF...', 'ffffFF..', 'wwwww...', 'wiwIw.gg', 'wwwww.gG', 'WWWWWwww', '......WW'],
]

/** And a tower is a tower: no pitch, a lot of windows, a long shadow. */
const TOWER = [
  ['..gggg..', '.wwwwww.', '.wiwIww.', '.wwwwww.', '.wIwiww.', '.wwwwww.', '.wiwIiw.', '.WWWWWW.'],
  ['.gggggg.', 'wwwwwwww', 'wIwiwIww', 'wwwwwwww', 'wiwIwiww', 'wwwwwwww', 'wIwiwIww', 'WWWWWWWW'],
  ['...gg...', '..wwww..', '..wiIw..', '..wwww..', '.wwwwww.', '.wIwiIw.', '.wwwwww.', '.WWWWWW.'],
]

const ROAD = [
  ['rrrrrrrr', 'rrrRrrrr', 'rrrrrrrr', 'rrrrrRrr', 'rrrrrrrr', 'rRrrrrrr', 'rrrrrrrr', 'rrrRrrrr'],
]

/** The stripe is a cross so it reads the same whichever way the road runs. */
const MAJOR = [['YYYYYYYY', 'YYYyyYYY', 'YYYyyYYY', 'YyyyyyyY', 'YyyyyyyY', 'YYYyyYYY', 'YYYyyYYY', 'YYYYYYYY']]

const SAND = [
  ['ssssssss', 'sssSssss', 'ssssssss', 'sSssssSs', 'ssssssss', 'sssssSss', 'ssssssss', 'sSssssss'],
  ['ssssssss', 'sSssssss', 'ssssSsss', 'ssssssss', 'sssSssSs', 'ssssssss', 'sSssssss', 'sssssSss'],
]

const ROCK = [
  ['kkkKkkkk', 'kkKKkkKk', 'kKkkkKKk', 'kkkkkkkk', 'kkKkkkkk', 'kKKkkKkk', 'kkkkKKkk', 'kkkkkkkk'],
  ['kkkkKKkk', 'kkKkkKkk', 'kKKkkkkk', 'kkkkkKKk', 'kkKkkkKk', 'kkkkkkkk', 'kKKkkKkk', 'kkkKkkkk'],
]

const DEEP = [
  ['dddddddd', 'ddddDddd', 'dddddddd', 'dDdddddd', 'dddddddd', 'ddddddld', 'dddddddd', 'ddDddddd'],
  ['dddddddd', 'ddlddddd', 'dddddddd', 'dddddDDd', 'dddddddd', 'dDdddddd', 'dddddddd', 'dddddldd'],
]

const SHALLOW = [
  ['aaaaaaaa', 'aaAAaaaa', 'aaaaaaaa', 'aaaaaAAa', 'aaaaaaaa', 'aAAaaaaa', 'aaaaaaaa', 'aaaaAAaa'],
  ['aaaaaaaa', 'aaaaAAaa', 'aAAaaaaa', 'aaaaaaaa', 'aaAAaaaa', 'aaaaaaaa', 'aaaaaAAa', 'aaaaaaaa'],
]

/** Water that touches land gets a foam edge. Sydney is all edges. */
const FOAM = [
  ['aaoaaaaa', 'aaaaaooa', 'aaaaaaaa', 'aooaaaaa', 'aaaaaaoa', 'aaaaaaaa', 'aaoaaaaa', 'aaaaoaaa'],
]

const BRIDGE = [['xxxxxxxx', 'xXxXxXxX', 'xxxxxxxx', 'XxXxXxXx', 'xxxxxxxx', 'xXxXxXxX', 'xxxxxxxx', 'XxXxXxXx']]

/** Bennelong Point. Three sails and a shadow. */
const SAILS = [['...mm...', '..mmmm..', '.mmmmmm.', 'mmmmmmmm', 'mmmmmmmm', '.MMMMMM.', '..MMMM..', '...MM...']]

/** Each terrain character, its base colour (what fills the cell before the tile
 *  is stamped) and the cuts of art that can sit on it. */
export const TERRAIN = {
  '~': { base: '#215a92', tiles: DEEP, water: true },
  '-': { base: '#4aa0d8', tiles: SHALLOW, water: true, foam: FOAM },
  s: { base: '#f0dfae', tiles: SAND },
  '.': { base: '#cbb98c', tiles: GRASS },
  ',': { base: '#b3a075', tiles: GRASS_DARK },
  t: { base: '#cbb98c', tiles: TREE },
  T: { base: '#b3a075', tiles: TREE_DEEP },
  p: { base: '#7fa04a', tiles: PARK },
  b: { base: '#cbb98c', tiles: HOUSE },
  B: { base: '#b3a075', tiles: TOWER },
  r: { base: '#efe3c2', tiles: ROAD },
  R: { base: '#e2913f', tiles: MAJOR },
  k: { base: '#a3927a', tiles: ROCK },
  X: { base: '#c9d2da', tiles: BRIDGE },
  O: { base: '#cbb98c', tiles: SAILS },
}

/** Same cell, same tile, every build — no flicker when the map redraws. */
export function pick(list, x, y) {
  const h = (x * 73856093) ^ (y * 19349663)
  return list[(h >>> 0) % list.length]
}
