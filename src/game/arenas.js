/**
 * The ten arenas.
 *
 * An arena is the room a level bracket happens in. The bracket and the boss
 * already existed — your level puts you in front of one of ten bosses and its
 * health is the XP that bracket costs — but none of it had a face. You could
 * not see the ladder, where you stood on it, or what was ahead, so a thing
 * that is structurally a rank system read as a single label.
 *
 * So every bracket becomes a place, and the places are a ladder of materials:
 * ordinary stone at the bottom, then metals, then black glass, then things
 * that fell out of the sky, then light. The colour arc is deliberate — dull
 * minerals through to heat and gold — and every tint is an existing token, so
 * the whole ladder follows a theme swap rather than pinning ten hex codes to
 * the light mode.
 *
 * Every tint is drawn from the palette's TEXT-SAFE entries rather than picked
 * for looks, because the app wears the current room: the tint ends up on the
 * level label, the tab bar and the week strip, and a colour that only works as
 * a 40px emblem turns the bottom of the screen into 4:1 mud when it gets
 * there.
 *
 * `lit` is the other half of that: the bright end of the metal, used only
 * where nothing has to be read through it — the rank badge's gradient. A
 * colour dark enough to carry an 11px label on paper cannot also be the
 * yellow gold looks like, so gold gets to be both, in the two places that
 * need different things from it. Arenas without their own bright token fall
 * back to their tint mixed with white, which is what RankBadge does.
 *
 * It is also why Stone is green rather than the grey its name asks for. Every
 * player starts there, the app wears the room, and an app whose level bar and
 * tab bar are grey on day one does not look themed — it looks switched off.
 * So the first room is an overgrown quarry, and the greys wait for Obsidian,
 * where black glass is the point and there is colour behind you to show it
 * against.
 *
 * `guard` is the dial that stops every arena being the same fight at a
 * different size: the share of a SWING the room turns aside, from nothing at
 * Stone to nearly half at Everforge. Health is only size; guard is what makes
 * a late arena feel late.
 *
 * It touches the arena fight and nothing else. Logged training always lands in
 * full, because a boss's health is exactly the XP of its level bracket and
 * shaving sessions would pull the health bar and the level bar apart. See
 * `swingFor` in engine.js.
 */

export const ARENAS = [
  { boss: 'golem', n: 1, name: 'Stone', theme: 'Mossy quarry', tint: 'var(--tone-green)', lit: 'var(--color-lime-glow)', guard: 0, pace: 3,
    scene: { deep: '#1d2a1c', air: 'drift', motes: 9,  grain: 'rock',  haze: 0.10 },
    emblem: 'M9 33 L13 15 L35 13 L40 31 L33 41 L14 41 Z' },
  { boss: 'wraith', n: 2, name: 'Copper', theme: 'Green patina', tint: 'var(--tone-jade)', guard: 0.05, pace: 3,
    scene: { deep: '#14282a', air: 'drift', motes: 7,  grain: 'patina', haze: 0.10 },
    emblem: 'M14 13 h20 l3 7 h-26 Z M9 22 h30 l4 11 h-38 Z M6 35 h36 v4 h-36 Z' },
  { boss: 'couch', n: 3, name: 'Iron', theme: 'Cold anvil', tint: 'var(--tone-sky)', guard: 0.1, pace: 4,
    scene: { deep: '#14242e', air: 'rise',  motes: 6,  grain: 'brushed', haze: 0.09 },
    emblem: 'M7 13 h34 l-5 10 h-9 v13 h11 v6 h-28 v-6 h11 v-13 h-9 Z' },
  { boss: 'doomscroll', n: 4, name: 'Steel', theme: 'Blue temper', tint: 'var(--tone-blue)', guard: 0.15, pace: 4,
    scene: { deep: '#141f33', air: 'rise',  motes: 7,  grain: 'brushed', haze: 0.11 },
    emblem: 'M24 3 L30 14 L30 32 L18 32 L18 14 Z M12 32 h24 v5 h-24 Z M21 37 h6 v8 h-6 Z' },
  { boss: 'ironjaw', n: 5, name: 'Cobalt', theme: 'Deep ore', tint: 'var(--color-cyan)', lit: 'var(--color-cyan-glow)', guard: 0.2, pace: 4,
    scene: { deep: '#0f2630', air: 'twinkle', motes: 11, grain: 'ore',   haze: 0.12 },
    emblem: 'M24 4 L32 22 L24 42 L16 22 Z M9 17 L14 28 L9 40 L4 28 Z M39 17 L44 28 L39 40 L34 28 Z' },
  { boss: 'wall', n: 6, name: 'Obsidian', theme: 'Black glass', tint: 'var(--tone-obsidian)', guard: 0.25, pace: 4,
    scene: { deep: '#0d0f14', air: 'drift', motes: 5,  grain: 'facet',  haze: 0.14 },
    emblem: 'M24 2 L34 25 L29 45 L19 45 L14 25 Z' },
  { boss: 'nox', n: 7, name: 'Meteorite', theme: 'Crater fall', tint: 'var(--tone-orange)', guard: 0.3, pace: 5,
    scene: { deep: '#2a1710', air: 'fall',  motes: 12, grain: 'rock',   haze: 0.13 },
    emblem: 'M28 16 a13 13 0 1 0 0.1 0 Z M3 5 L11 13 L7 17 L0 10 Z M15 1 L21 7 L17 11 L11 5 Z' },
  { boss: 'mirror', n: 8, name: 'Starsteel', theme: 'Starlight', tint: 'var(--color-neon)', lit: 'var(--color-neon-glow)', guard: 0.35, pace: 5,
    scene: { deep: '#17122e', air: 'twinkle', motes: 16, grain: 'star',  haze: 0.14 },
    emblem: 'M24 1 L28 20 L47 24 L28 28 L24 47 L20 28 L1 24 L20 20 Z' },
  { boss: 'backslide', n: 9, name: 'Sunforge', theme: 'White heat', tint: 'var(--color-danger)', guard: 0.4, pace: 5,
    scene: { deep: '#2e1518', air: 'rise',  motes: 12, grain: 'brushed', haze: 0.15 },
    emblem: 'M24 13 a11 11 0 1 0 0.1 0 Z M22 0 h4 v8 h-4 Z M22 40 h4 v8 h-4 Z M0 22 h8 v4 h-8 Z M40 22 h8 v4 h-8 Z M5 8 l3-3 l6 6 l-3 3 Z M34 37 l3-3 l6 6 l-3 3 Z M43 8 l-3-3 l-6 6 l3 3 Z M14 37 l-3-3 l-6 6 l3 3 Z' },
  { boss: 'lvl100', n: 10, name: 'Everforge', theme: 'Endless flame', tint: 'var(--color-gold)', lit: 'var(--color-gold-glow)', guard: 0.45, pace: 5,
    scene: { deep: '#2b1a08', air: 'rise',  motes: 16, grain: 'ember',  haze: 0.17 },
    emblem: 'M24 2 C31 13 35 18 35 26 a11 11 0 1 1 -22 0 C13 18 17 13 24 2 Z M11 41 h26 v5 h-26 Z' },
]

/** The room a boss stands in. Falls back to the first so a boss added to the
 *  campaign without an arena still draws something rather than crashing. */
export function arenaFor(bossId) {
  return ARENAS.find((a) => a.boss === bossId) ?? ARENAS[0]
}

/** How much of a swing this arena turns aside, said in words. */
export function guardNote(guard) {
  if (!guard) return 'No guard. Every swing you take lands in full.'
  return `Guard ${Math.round(guard * 100)}% — that much of every swing is turned aside.`
}

/** How many of the five guard pips this arena fills. */
export function guardPips(guard) {
  return Math.round((guard / 0.45) * 5)
}
