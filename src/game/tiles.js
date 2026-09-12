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
  // ground — warm paper, bright enough that green reads as a feature on it
  '.': '#6ea63f', // grassland
  ':': '#82bd4d', // caught by the light
  ',': '#5a8c33', // in shade
  p: '#7cb545', // parkland
  P: '#95cf58', // parkland highlight
  // canopy — saturated, because a forest is the most alive thing on a map
  c: '#2f6b24',
  C: '#3f8a30',
  v: '#1d4715',
  n: '#6b4423', // trunk
  // built — plaster walls, terracotta and slate roofs
  w: '#efe4cc',
  W: '#c9baa0',
  f: '#cf5b41', // terracotta, lit
  F: '#94382a', // terracotta, shaded
  g: '#5f86b0', // slate roof, lit
  G: '#3d5c80', // slate roof, shaded
  i: '#fbe490', // a lit window
  I: '#2f4260', // a dark one
  // ground you walk on
  r: '#f4e9cb',
  R: '#ded1aa',
  Y: '#e0a24c', // the arterials
  y: '#f2c37e',
  s: '#f2e2b4',
  U0: '#d9c79a', // trodden ground, under a suburb
  S: '#e5d2a2',
  k: '#a89e90',
  K: '#7d7468',
  // water
  d: '#2874b3',
  D: '#1f5e95',
  l: '#3a8bc9',
  a: '#5cb6e2',
  A: '#7fcdf0',
  o: '#dcf2fc',
  // landmarks
  x: '#d5dde4',
  X: '#93a0ab',
  m: '#fbfaf2',
  M: '#d5d0bd',
}

/** Two or three cuts of each ground type, so a hillside is not a repeated stamp. */
const GRASS = [
  ['.:..:..:', '........', ':..:..:.', '........', '..:..:..', '........', ':..:..:.', '........'],
  ['..::....', '.:::....', '.:......', '.....,..', '....,,,.', '.....,..', '..:..:..', '........'],
  ['.:..:..:', '........', '....:::.', '...:::..', '........', '..,,....', '.,,,....', ':..:..:.'],
  ['..,,....', '.,,,,...', '..,,....', '......::', '.....:::', '......::', '..:.....', '.:..:..:'],
]

const GRASS_DARK = [
  [',..,..,.', '..,,....', '.,,,,...', '..,,....', ',..,..,.', '.....,,.', '....,,,.', '.....,,.'],
  ['..,..,..', '...,,...', '..,,,,..', '...,,...', '..,..,..', '......,,', '.....,,,', '......,,'],
]

const PARK = [
  ['pppppppp', 'ppPppppp', 'pppppppp', 'ppppppPp', 'pppppppp', 'pPpppppp', 'pppppppp', 'ppppPppp'],
  ['pppppppp', 'ppppPppp', 'pPpppppp', 'pppppppp', 'ppppppPp', 'pppppppp', 'pppPpppp', 'pppppppp'],
]

/** A tree is a trunk and a canopy with the light on one side. Nothing else in
 *  the whole map does as much to make it look drawn. */
const TREE = [
  ['..CCCC..', '.CCCCcc.', 'CCCCcccv', 'CCcccccv', '.cccccv.', '..cnnv..', '...nn...', '..,..,..'],
  ['...CCC..', '..CCCCc.', '.CCCcccv', 'CCcccccv', '..ccccv.', '...nn...', '...nn...', '..,...,.'],
  ['..CCCc..', '.CCCcccv', '.CCcccvv', '..cccv..', '...nn...', '...nn...', '.....CC.', '....Cccv'],
]

const TREE_DEEP = [
  ['.CCCc...', 'CCCcccv.', 'CCcccvv.', '..nn....', '..nn.CCC', '....CCcc', '.....nn.', '..,..nn.'],
  ['...CCCc.', '..CCCccv', '..Ccccv.', '....nn..', 'CCCc.nn.', 'Ccccv...', '..nn....', '..nn..,.'],
  ['..vCCv..', '.vCCCCv.', 'vcCCCCcv', 'vcCCCccv', '..vccv..', '...nn...', '...nn...', '..,..,..'],
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

/** Solid, so adjacent cells run together into one ribbon. The stripe used to be
 *  a cross to read the same whichever way the road went, which at full zoom
 *  turned every hundred metres of motorway into a plus sign. */
const MAJOR = [
  ['YYYYYYYY', 'YYyYYYYY', 'YYYYYYYY', 'YYYYYyYY', 'YYYYYYYY', 'YyYYYYYY', 'YYYYYYYY', 'YYYYyYYY'],
  ['YYYYYYYY', 'YYYYyYYY', 'YYYYYYYY', 'YyYYYYYY', 'YYYYYYYY', 'YYYYYyYY', 'YYYYYYYY', 'YYyYYYYY'],
]

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
  '~': { base: '#2874b3', tiles: DEEP, water: true },
  '-': { base: '#5cb6e2', tiles: SHALLOW, water: true, foam: FOAM },
  s: { base: '#f2e2b4', tiles: SAND },
  '.': { base: '#6ea63f', tiles: GRASS },
  ',': { base: '#5a8c33', tiles: GRASS_DARK },
  t: { base: '#6ea63f', tiles: TREE },
  T: { base: '#5a8c33', tiles: TREE_DEEP },
  p: { base: '#7cb545', tiles: PARK },
  b: { base: '#d9c79a', tiles: HOUSE },
  B: { base: '#cbb98c', tiles: TOWER },
  r: { base: '#f4e9cb', tiles: ROAD },
  R: { base: '#e0a24c', tiles: MAJOR },
  k: { base: '#a89e90', tiles: ROCK },
  X: { base: '#c9d2da', tiles: BRIDGE },
  O: { base: '#6ea63f', tiles: SAILS },
}

/** Same cell, same tile, every build — no flicker when the map redraws. */
export function pick(list, x, y) {
  const h = (x * 73856093) ^ (y * 19349663)
  return list[(h >>> 0) % list.length]
}
