/**
 * The interface icons, drawn as line art.
 *
 * These used to be 8×8 pixel grids. Eight pixels is enough for an arrow and a
 * tick and nothing else — a bicycle, a swimmer and a set of dumbbells all came
 * out as the same four-blob smudge, and the activity list was a row of shapes
 * you had to read the label to identify. Which is the opposite of an icon.
 *
 * The app's rule is that the pixel art is the CHARACTER art: the hero, the
 * pets, the gear, the chest. Everything structural is a clean interface, and
 * these belong to the interface. So they are strokes on a 24-unit grid, one
 * weight, round caps and joins, and they stay sharp at any size instead of
 * turning to porridge below 20px.
 *
 * Each entry is `{ d, fill }` — `d` a path (or list of paths), `fill` for the
 * handful that read better solid than outlined.
 */

const stroke = (...d) => ({ d })
const solid = (...d) => ({ d, fill: true })

export const GLYPHS = {
  /* ------------------------------------------------------------ activities */
  // A figure mid-stride, leaning slightly. The lean is what separates it from
  // the runner below at a glance.
  walk: stroke(
    'M13.5 4.5a1.6 1.6 0 1 0 0-.1',
    'M12.2 21l1.4-5.4-2.6-2.3.9-4.6',
    'M11.9 8.7 8.6 10l-1 3.2',
    'M14 10.6l2.6 1.5 1.6 3',
    'M11 13.3 9 17l-2.6 3',
  ),
  // Same figure at speed: deeper lean, both legs off the ground, arms driving.
  run: stroke(
    'M15.5 4.6a1.6 1.6 0 1 0 0-.1',
    'M9.4 21l3.2-4.2-2.4-3.1 1.3-4.4',
    'M11.5 9.3 7.8 11l-.9 3',
    'M13.6 11.3l3.1 1.1 1.9 3.2',
    'M4.5 9h3',
    'M3.5 13h2.5',
  ),
  // Two wheels, a frame and a saddle — the one shape everybody reads instantly.
  bike: stroke(
    'M5.5 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    'M18.5 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    'M5.5 15h5l4.5-6',
    'M10.5 15l3-6.5',
    'M12 8.5h4l2.5 6.5',
    'M9 8.5h3.5',
  ),
  // Front crawl: a head at the surface, the far arm reaching over it, the body
  // trailing behind, and the water it is all happening in.
  swim: stroke(
    'M13.3 6.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z',
    'M11.6 9.9C9.9 7.4 8.2 6.2 6.4 6.2c-1 0-1.8.3-2.4.9',
    'M15 10.2l5.6 2',
    'M2.6 16.6c1.7 0 1.7 1.5 3.4 1.5s1.7-1.5 3.4-1.5 1.7 1.5 3.4 1.5 1.7-1.5 3.4-1.5 1.7 1.5 3.4 1.5 1.7-1.5 2.8-1.5',
    'M2.6 20.4c1.7 0 1.7 1.5 3.4 1.5s1.7-1.5 3.4-1.5 1.7 1.5 3.4 1.5 1.7-1.5 3.4-1.5 1.7 1.5 3.4 1.5 1.7-1.5 2.8-1.5',
  ),
  // A bar with plates. Two weights a side, because one reads as a barbell.
  dumbbell: stroke('M6.5 8.5v7', 'M17.5 8.5v7', 'M3.8 10.5v3', 'M20.2 10.5v3', 'M6.5 12h11'),
  // Work and rest: a stopwatch, which is what an interval session actually is.
  timer: stroke(
    'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
    'M12 9v4l2.6 1.8',
    'M9.5 3h5',
    'M18.6 5.6l1.6-1.6',
  ),
  // A football. The seams stop short of the rim on purpose — run them all the
  // way out and the thing reads as a wheel with spokes.
  ball: stroke(
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M12 8.2l3.1 2.2-1.2 3.6h-3.8l-1.2-3.6z',
    'M12 8.2V5.4',
    'M15.1 10.4l2.6-.9',
    'M13.9 14 15.5 16.2',
    'M10.1 14 8.5 16.2',
    'M8.9 10.4 6.3 9.5',
  ),
  // Sitting cross-legged, hands on knees.
  lotus: stroke(
    'M12 6.6a1.7 1.7 0 1 0 0-.1',
    'M12 9.6v4',
    'M12 13.6c-2.6 0-4.6 1.5-4.6 3.4 0 1.3 1 2 2.2 2h4.8c1.2 0 2.2-.7 2.2-2 0-1.9-2-3.4-4.6-3.4z',
    'M8.4 12.2 5 15.2',
    'M15.6 12.2 19 15.2',
  ),
  // A body held under its own weight: arms out, legs braced. Calisthenics and
  // pilates. Drawn open rather than as a plank — a plank at 12px is a smudge.
  hold: stroke(
    'M12 5.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8z',
    'M12 6.4v7',
    'M4.6 8.6 12 10l7.4-1.4',
    'M12 13.4 7.6 21',
    'M12 13.4 16.4 21',
  ),
  // Water, three deep.
  wave: stroke(
    'M3 8.5c1.6 0 1.6 1.4 3.2 1.4S7.8 8.5 9.4 8.5s1.6 1.4 3.2 1.4S14.2 8.5 15.8 8.5s1.6 1.4 3.2 1.4S20.6 8.5 22 8.5',
    'M3 13c1.6 0 1.6 1.4 3.2 1.4S7.8 13 9.4 13s1.6 1.4 3.2 1.4S14.2 13 15.8 13s1.6 1.4 3.2 1.4S20.6 13 22 13',
    'M3 17.5c1.6 0 1.6 1.4 3.2 1.4s1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4 1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4 1.6-1.4 3-1.4',
  ),
  // A boot: a shaft, an ankle, a sole. For the slot that takes anything done
  // on your feet.
  boot: stroke(
    'M7.4 3.4h4.4v7.8c0 1.5 1 2.3 2.5 2.9l3.6 1.4a2.2 2.2 0 0 1 1.4 2.1v2.2H7.4z',
    'M7.4 19.8H4.6a1.2 1.2 0 0 1-1.2-1.2V3.4h4',
    'M11.8 13.6c1.2 1 2.4 1.4 3.8 1.4',
  ),

  /* ----------------------------------------------------------------- system */
  home: stroke('M3.5 10.8 12 3.6l8.5 7.2', 'M5.8 9.5V19a1.5 1.5 0 0 0 1.5 1.5h9.4a1.5 1.5 0 0 0 1.5-1.5V9.5', 'M9.7 20.5v-5.8h4.6v5.8'),
  person: stroke('M12 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6z', 'M4.6 20.4c0-3.9 3.3-6.4 7.4-6.4s7.4 2.5 7.4 6.4'),
  chat: stroke('M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.6V16H6.5A2.5 2.5 0 0 1 4 13.5z'),
  trophy: stroke('M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0z', 'M7.5 5.6H4.8v1.6a3.2 3.2 0 0 0 3 3.2', 'M16.5 5.6h2.7v1.6a3.2 3.2 0 0 1-3 3.2', 'M12 13.7v3.3', 'M8.4 20.4h7.2l-.9-3.4H9.3z'),
  skull: stroke('M12 3.2c-4.3 0-7.4 3-7.4 7 0 2.4 1.1 4 2.6 5v2.5c0 1.2.9 2.1 2.1 2.1h5.4c1.2 0 2.1-.9 2.1-2.1v-2.5c1.5-1 2.6-2.6 2.6-5 0-4-3.1-7-7.4-7z', 'M9.3 11.6a1.7 1.7 0 1 0 0-.1', 'M14.7 11.6a1.7 1.7 0 1 0 0-.1', 'M10.6 16.2h2.8'),
  crosshair: stroke('M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z', 'M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z', 'M12 1.8v3.4', 'M12 18.8v3.4', 'M1.8 12h3.4', 'M18.8 12h3.4'),
  shield: stroke('M12 3.4 5 6v5.6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z'),
  lock: stroke('M6.6 10.6h10.8a1.4 1.4 0 0 1 1.4 1.4v7a1.4 1.4 0 0 1-1.4 1.4H6.6A1.4 1.4 0 0 1 5.2 19v-7a1.4 1.4 0 0 1 1.4-1.4z', 'M8.4 10.6V8a3.6 3.6 0 0 1 7.2 0v2.6'),
  pin: stroke('M12 21c3.8-4.6 5.8-7.8 5.8-10.4A5.8 5.8 0 0 0 6.2 10.6C6.2 13.2 8.2 16.4 12 21z', 'M12 12.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z'),
  swap: stroke('M4 8.4h13.4', 'M14.4 5.2l3.2 3.2-3.2 3.2', 'M20 15.6H6.6', 'M9.6 12.4l-3.2 3.2 3.2 3.2'),
  link: stroke('M10 13.6a3.6 3.6 0 0 0 5.4.4l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.5 1.5', 'M14 10.4a3.6 3.6 0 0 0-5.4-.4L6 12.6a3.6 3.6 0 0 0 5.1 5.1l1.5-1.5'),
  chevron: stroke('M9 5.4 15.6 12 9 18.6'),
  check: stroke('M4.6 12.6 9.6 17.6 19.4 6.6'),
  plus: stroke('M12 4.6v14.8', 'M4.6 12h14.8'),
  sun: stroke('M12 16.6a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2z', 'M12 1.8v2.6', 'M12 19.6v2.6', 'M1.8 12h2.6', 'M19.6 12h2.6', 'M4.9 4.9l1.9 1.9', 'M17.2 17.2l1.9 1.9', 'M19.1 4.9l-1.9 1.9', 'M6.8 17.2l-1.9 1.9'),
  moon: stroke('M20 14.4A8.6 8.6 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4z'),
  stop: stroke('M6.4 6.4h11.2v11.2H6.4z'),
  pause: stroke('M9.2 5.4v13.2', 'M14.8 5.4v13.2'),

  /* ------------------------------------------------------------- the solids */
  // A streak, and it has to read as a lightning bolt at 15px next to a number.
  bolt: solid('M13.6 2 5 13.4h5.2L9.4 22 19 10.2h-5.4z'),
  play: solid('M7.4 4.6 19 12 7.4 19.4z'),
  heart: solid('M12 20.6 4.7 13.5A4.6 4.6 0 0 1 12 7.9a4.6 4.6 0 0 1 7.3 5.6z'),
  spark: solid('M12 2.4 13.9 9 20.6 12l-6.7 3-1.9 6.6L10.1 15 3.4 12l6.7-3z'),
  flame: solid('M12 2.6c3.4 3.4 6.4 6 6.4 10.2A6.4 6.4 0 0 1 5.6 13c0-2.1 1-3.6 2.4-5.2.2 1.4.9 2.3 1.9 2.6.5-3.6 1-6 2.1-7.8z'),
  // The energy the game spends. A cut token rather than a plain disc.
  core: solid('M12 2.6 20.1 7.3v9.4L12 21.4 3.9 16.7V7.3z', 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z'),
  chest: stroke('M4 10.6h16v8.2a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 18.8z', 'M4 10.6 5.6 5.2a1.2 1.2 0 0 1 1.2-.8h10.4a1.2 1.2 0 0 1 1.2.8L20 10.6', 'M10.4 10.6h3.2v3.4h-3.2z'),
  // Two blades crossed, hilts down. Solid rather than outlined: at 20px in the
  // tab bar a stroked blade is two lines close enough to merge into a smudge,
  // and the one thing this icon has to do is read as swords at 20px.
  swords: solid(
    'M9.7 16.9 7.1 14.3 20.4 3.6z',
    'M6.1 13.4 10.6 17.9 9.5 19 5 14.5z',
    'M8.1 16.9 5.7 19.3 4.7 18.3 7.1 15.9z',
    'M4.5 18.2 5.9 19.5 4.5 20.9 3.1 19.5z',
    'M14.3 16.9 16.9 14.3 3.6 3.6z',
    'M17.9 13.4 13.4 17.9 14.5 19 19 14.5z',
    'M15.9 16.9 18.3 19.3 19.3 18.3 16.9 15.9z',
    'M19.5 18.2 18.1 19.5 19.5 20.9 20.9 19.5z',
  ),
  // Where the cores go. A bag, because everything else that means "shop" at
  // this size means something else first.
  bag: stroke(
    'M5.4 8.6h13.2l.9 10.6a1.4 1.4 0 0 1-1.4 1.5H5.9a1.4 1.4 0 0 1-1.4-1.5z',
    'M8.9 11V6.9a3.1 3.1 0 0 1 6.2 0V11',
  ),
}

/** Anything the app asks for that has no drawing yet falls back to a dot. */
export const glyphOf = (name) => GLYPHS[name] ?? null
