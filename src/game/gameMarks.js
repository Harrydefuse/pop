/**
 * A mark for every game somebody can say they play.
 *
 * These are ORIGINAL pixel marks, not the games' logos. Three reasons, in the
 * order they matter:
 *
 *   1. The logos belong to Epic, Riot, Valve, Activision and the rest. Shipping
 *      them inside a product — or hotlinking them from it — is their trademark
 *      on someone else's app, and the person shipping it carries that, not the
 *      person who drew it.
 *   2. The whole app is one self-contained bundle that makes zero network
 *      requests. Pulling twenty images off the internet breaks that, and breaks
 *      it in the worst way: the profile looks fine until somebody opens it on
 *      the tube.
 *   3. Twenty logos in twenty house styles — flat vectors, chrome bevels,
 *      photographic gradients — next to hand-drawn pixel armour would look like
 *      a sponsor board, not a character sheet.
 *
 * So each game gets a genre mark in its own signature colours. Colour is doing
 * most of the recognition work and colour is not ownable; the shape says what
 * kind of game it is. A Valorant player sees a red reticle, a Rocket League
 * player sees a blue-and-orange ball, and both read instantly at 16 pixels
 * without borrowing anything.
 *
 * Shapes are shared across games of the same kind on purpose. Two tactical
 * shooters SHOULD look like siblings — that is what the mark is saying.
 */

/* Letters are the same everywhere: `a` is the line, `b` a secondary, `c` the
   fill. Every game supplies its own three, so one drawing serves many. */

const reticle = [
  '....aaaa....',
  '..aa....aa..',
  '.a........a.',
  'a..........a',
  'a..........a',
  'a....cc....a',
  'a....cc....a',
  'a..........a',
  'a..........a',
  '.a........a.',
  '..aa....aa..',
  '....aaaa....',
]

const diamond = [
  '.....aa.....',
  '....aaaa....',
  '...aa..aa...',
  '..aa....aa..',
  '.aa......aa.',
  'aa...cc...aa',
  'aa...cc...aa',
  '.aa......aa.',
  '..aa....aa..',
  '...aa..aa...',
  '....aaaa....',
  '.....aa.....',
]

const triangle = [
  '.....aa.....',
  '....aaaa....',
  '....a..a....',
  '...aa..aa...',
  '...a....a...',
  '..aa....aa..',
  '..a..cc..a..',
  '.aa..cc..aa.',
  '.a........a.',
  'aaaaaaaaaaaa',
  'aaaaaaaaaaaa',
  '............',
]

const bolt = [
  '.......aaa..',
  '......aaa...',
  '.....aaa....',
  '....aaa.....',
  '...aaaaaa...',
  '..aaaaaaa...',
  '.......aaa..',
  '......aaa...',
  '.....aaa....',
  '....aaa.....',
  '...aaa......',
  '..aa........',
]

const chevrons = [
  '............',
  '..a......a..',
  '..aa....aa..',
  '...aa..aa...',
  '....aaaa....',
  '.....aa.....',
  '..a......a..',
  '..aa....aa..',
  '...aa..aa...',
  '....aaaa....',
  '.....aa.....',
  '............',
]

const visor = [
  '............',
  '............',
  '...aaaaaa...',
  '..aaaaaaaa..',
  '.aaaaaaaaaa.',
  'aaccccccccaa',
  'aaccccccccaa',
  '.aaaaaaaaaa.',
  '..aaaaaaaa..',
  '...aaaaaa...',
  '............',
  '............',
]

const hexshield = [
  '....aaaa....',
  '...aaaaaa...',
  '..aaaaaaaa..',
  '.aaaaaaaaaa.',
  'aaaaccccaaaa',
  'aaaaccccaaaa',
  'aaaaccccaaaa',
  '.aaaaaaaaaa.',
  '..aaaaaaaa..',
  '...aaaaaa...',
  '....aaaa....',
  '............',
]

const burst = [
  '.....aa.....',
  '.a...aa...a.',
  '..a..aa..a..',
  '...a.aa.a...',
  '....aaaa....',
  'aaaaacccaaaa',
  'aaaaacccaaaa',
  '....aaaa....',
  '...a.aa.a...',
  '..a..aa..a..',
  '.a...aa...a.',
  '.....aa.....',
]

const spire = [
  '.....aa.....',
  '....acca....',
  '...acccca...',
  '..acccccca..',
  '...acccca...',
  '....acca....',
  '.....aa.....',
  '....aaaa....',
  '....aaaa....',
  '...aaaaaa...',
  '..aaaaaaaa..',
  '............',
]

const ball = [
  '....aaaa....',
  '..aaaaaaaa..',
  '.aaacaacaaa.',
  'aaaacaacaaaa',
  'aaaacaacaaaa',
  'acccccccccca',
  'aaaacaacaaaa',
  'aaaacaacaaaa',
  'aaaacaacaaaa',
  '.aaacaacaaa.',
  '..aaaaaaaa..',
  '....aaaa....',
]

const fist = [
  '............',
  '..aaaaaa....',
  '.acccccca...',
  'acccccccca..',
  'accacacacca.',
  'acccccccccca',
  'acccccccccca',
  'acccccccccca',
  '.accccccccca',
  '..aaaaaaaaa.',
  '............',
  '............',
]

const cube = [
  '............',
  '..aaaaaaaa..',
  '.abbbbbbbba.',
  'abbbbbbbbbba',
  'acccccccccca',
  'acccccccccca',
  'acccccccccca',
  'acccccccccca',
  'acccccccccca',
  '.acccccccca.',
  '..aaaaaaaa..',
  '............',
]

const star = [
  '.....aa.....',
  '.....aa.....',
  '....acca....',
  '....acca....',
  'aaaaccccaaaa',
  '.acccccccca.',
  '..cccccccc..',
  '...cccccc...',
  '...ccaacc...',
  '..ccc..ccc..',
  '..aa....aa..',
  '............',
]

const sword = [
  '.....cc.....',
  '.....cc.....',
  '.....cc.....',
  '.....cc.....',
  '.....cc.....',
  '..aaaaaaaa..',
  '..aaaaaaaa..',
  '.....aa.....',
  '.....aa.....',
  '.....aa.....',
  '....aaaa....',
  '............',
]

const pad = [
  '............',
  '............',
  '..aaaaaaaa..',
  '.acccccccca.',
  'acccccccccca',
  'acbcccccbcca',
  'abbbcccbbbca',
  'acbcccccbcca',
  'acccccccccca',
  '.aacccccaa..',
  '..a.....a...',
  '............',
]

const stud = [
  '.....aa.....',
  '....abba....',
  '...aaaaaa...',
  '..abbbbbba..',
  '.abbbbbbbba.',
  'acccccccccca',
  'acccccccccca',
  'acccccccccca',
  'acccccccccca',
  '.acccccccca.',
  '..aaaaaaaa..',
  '............',
]

const SHAPES = {
  reticle, diamond, triangle, bolt, chevrons, visor, hexshield,
  burst, spire, ball, fist, cube, stud, star, sword, pad,
}

/**
 * Shape and colours per game.
 *
 * `a` carries the silhouette and is the colour the eye actually catches at
 * chip size, so it is the one that has to be the game's own. `c` is the fill
 * behind it and `b` only exists on the two marks that need a third.
 */
export const GAME_MARKS = {
  // Shooters — all reticles and tactical marks, siblings by design.
  valorant: { shape: 'reticle', a: '#ff4655', c: '#fffbf5' },
  cs: { shape: 'diamond', a: '#f0a136', c: '#4b69ff' },
  apex: { shape: 'triangle', a: '#da292a', c: '#f5f5f5' },
  fortnite: { shape: 'bolt', a: '#9d4dff', c: '#20c4f4' },
  cod: { shape: 'chevrons', a: '#7c8b3f', c: '#1d1f14' },
  overwatch: { shape: 'visor', a: '#f79e1b', c: '#f5fbff' },
  rainbow: { shape: 'hexshield', a: '#1f7fd4', c: '#0d1b2a' },
  marvelrivals: { shape: 'burst', a: '#e0202a', c: '#ffcf3f' },
  shooter: { shape: 'reticle', a: '#7b8494', c: '#d6dbe4' },

  // Strategy — a nexus, in each game's colours.
  lol: { shape: 'spire', a: '#0a5a78', c: '#c8aa6e' },
  dota: { shape: 'spire', a: '#a52218', c: '#2b2018' },

  // Reflex — balls and fists.
  rocket: { shape: 'ball', a: '#1b64c8', c: '#f7a821' },
  fifa: { shape: 'ball', a: '#16181d', c: '#f7f7f7' },
  nba2k: { shape: 'ball', a: '#c8531e', c: '#2a1a12' },
  fighting: { shape: 'fist', a: '#8e1420', c: '#e8633f' },

  // Chill — blocks, stars and swords.
  minecraft: { shape: 'cube', a: '#2f2416', b: '#5fa83c', c: '#8a5a33' },
  roblox: { shape: 'stud', a: '#25272b', b: '#ff8f92', c: '#cf2f36' },
  gta: { shape: 'star', a: '#1d1d1f', c: '#f2c14b' },
  mmo: { shape: 'sword', a: '#6b4ea8', c: '#c9d2de' },
  other: { shape: 'pad', a: '#4d5560', b: '#98a1ae', c: '#d6dbe4' },
}

/** The sprite for one game, in the shape `PixelSprite` wants. */
export function gameMark(id) {
  const m = GAME_MARKS[id] ?? GAME_MARKS.other
  const grid = SHAPES[m.shape]
  return {
    w: grid[0].length,
    h: grid.length,
    palette: { a: m.a, b: m.b ?? m.a, c: m.c },
    grid,
  }
}

/** The colour a chip should tint itself, which is the silhouette colour. */
export function markTone(id) {
  return (GAME_MARKS[id] ?? GAME_MARKS.other).a
}
