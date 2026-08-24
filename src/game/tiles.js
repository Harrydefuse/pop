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

export const TILE_PALETTE = {
  // land
  '.': '#5d9a44', // grass
  ':': '#7cbe5b', // grass, caught by the light
  ',': '#40702c', // grass, in shade
  p: '#57a340', // parkland
  P: '#74c855', // parkland highlight
  // canopy
  c: '#3f7a30',
  C: '#4f9139',
  v: '#2e5c22',
  n: '#5a3b22', // trunk
  // built
  w: '#bcb1a0',
  W: '#95897a',
  f: '#a85a44', // terracotta, lit
  F: '#7c3f31', // terracotta, shaded
  g: '#5d6f8a', // slate roof, lit
  G: '#42506a', // slate roof, shaded
  i: '#f2d98a', // a lit window
  I: '#38455c', // a dark one
  // ground
  r: '#cbc1a4',
  R: '#b3a888',
  Y: '#e3d5ac', // the big roads
  y: '#f0e6c4',
  s: '#e8d8a6',
  S: '#d3c08b',
  k: '#8a7d68',
  K: '#6d624f',
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
  s: { base: '#e8d8a6', tiles: SAND },
  '.': { base: '#5d9a44', tiles: GRASS },
  ',': { base: '#4c8038', tiles: GRASS_DARK },
  t: { base: '#5d9a44', tiles: TREE },
  T: { base: '#4c8038', tiles: TREE_DEEP },
  p: { base: '#57a340', tiles: PARK },
  b: { base: '#5d9a44', tiles: HOUSE },
  B: { base: '#4c8038', tiles: TOWER },
  r: { base: '#cbc1a4', tiles: ROAD },
  R: { base: '#e3d5ac', tiles: MAJOR },
  k: { base: '#8a7d68', tiles: ROCK },
  X: { base: '#c9d2da', tiles: BRIDGE },
  O: { base: '#5d9a44', tiles: SAILS },
}

/** Same cell, same tile, every build — no flicker when the map redraws. */
export function pick(list, x, y) {
  const h = (x * 73856093) ^ (y * 19349663)
  return list[(h >>> 0) % list.length]
}
