import { ARENAS } from '../game/arenas'
import { alpha } from '../game/color'

/**
 * The rank, as a thing you want.
 *
 * The arena crest on its own is a flat glyph — right for a 38px row on a
 * ladder, and far too quiet to be the reason anyone trains. A rank badge has a
 * different job: it has to be the carrot. So the crest keeps its shape and
 * gains a shield to sit on, and the shield gains ornament as you climb —
 * chevrons, then wings, then a burst behind it, then a crown.
 *
 * The escalation is the whole point and it is deliberately not subtle. Stone is
 * a bare plate with nothing on it. Everforge is winged, crowned, haloed and
 * lit. Somebody who sees both knows immediately which one they would rather
 * have, which is the only thing this component is for.
 *
 * Five steps over ten arenas, so a rank change is visible roughly every other
 * promotion rather than once in the whole game.
 */
function tierOf(n) {
  return Math.min(4, Math.floor((n - 1) / 2))
}

const SHIELD = 'M32 9 L53 16.5 V34 C53 45.5 43.5 53.5 32 57.5 C20.5 53.5 11 45.5 11 34 V16.5 Z'

export default function RankBadge({ arena, size = 64, className = '', style }) {
  const a = arena ?? ARENAS[0]
  const tier = tierOf(a.n)
  const tint = a.tint
  // The bright end of the metal. Where an arena has a colour of its own for
  // this it uses it — which is how gold stays gold in light mode, where the
  // token that carries its words has to be dark enough to read.
  const lit = a.lit ?? `color-mix(in srgb, ${tint} 42%, white)`
  // Crest art is authored on a 48 grid; this one is 64, and the crest has to
  // sit inside the plate rather than on top of it.
  const s = 0.6
  const crest = `translate(${32 - 24 * s} ${31 - 24 * s}) scale(${s})`

  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={Math.round((size * 72) / 64)}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role="img"
      aria-label={`Rank badge, arena ${a.n}, ${a.name}`}
    >
      <defs>
        {/* Metal, not a wash.
            The plate was a flat fade of one colour at two opacities, which is
            what made the gold rank read as brown: a single mid-tone with no
            bright end to it looks like the colour of a thing rather than light
            on a thing. This is the ramp every piece of metal art in the game
            uses — lit at the top, the true colour through the middle, shadow
            underneath — and it is why the same token can look like gold here
            and stay legible as text elsewhere. */}
        <linearGradient id={`rb-${a.n}`} x1="0" y1="0" x2="0" y2="1">
          {/* Weighted to the lit end on purpose. A ramp that reaches the true
              colour halfway down spends most of a 62px shield in its own
              shadow, which is the version of this that still looked brown. */}
          <stop offset="0%" stopColor={lit} />
          <stop offset="44%" stopColor={`color-mix(in srgb, ${lit} 58%, ${tint})`} />
          <stop offset="80%" stopColor={tint} />
          <stop offset="100%" stopColor={`color-mix(in srgb, ${tint} 74%, black)`} />
        </linearGradient>
        <linearGradient id={`rbc-${a.n}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lit} />
          <stop offset="100%" stopColor={tint} />
        </linearGradient>
      </defs>

      {/* ---- the burst, from arena 7. Drawn first so everything sits on it. */}
      {tier >= 3 && (
        <g stroke={alpha(tint, 40)} strokeWidth="2" strokeLinecap="round">
          {[-58, -32, 32, 58].map((deg) => (
            <line key={deg} x1="32" y1="33" x2="32" y2="1" transform={`rotate(${deg} 32 33)`} />
          ))}
        </g>
      )}

      {/* ---- wings, from arena 5. They grow a second feather at arena 7. */}
      {tier >= 2 && (
        <g fill={`url(#rbc-${a.n})`} stroke={`color-mix(in srgb, ${tint} 60%, black)`} strokeWidth="1.2" strokeLinejoin="round">
          <path d="M11 22 L1 17 L3 28 L11 31 Z" />
          <path d="M53 22 L63 17 L61 28 L53 31 Z" />
          {tier >= 3 && (
            <>
              <path d="M11 33 L2 31 L5 40 L11 40 Z" />
              <path d="M53 33 L62 31 L59 40 L53 40 Z" />
            </>
          )}
        </g>
      )}

      {/* ---- the crown, at Everforge and nowhere else. */}
      {tier >= 4 && (
        <path
          d="M20 10 L24 3 L28 9 L32 0 L36 9 L40 3 L44 10 Z"
          fill={`url(#rbc-${a.n})`}
          stroke={`color-mix(in srgb, ${tint} 60%, black)`}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      )}

      {/* ---- the plate every rank has */}
      <path d={SHIELD} fill={`url(#rb-${a.n})`} stroke={tint} strokeWidth="2.4" strokeLinejoin="round" />
      {/* An inner line, so the plate has a rim rather than being one flat wash. */}
      <path
        d={SHIELD}
        fill="none"
        stroke={alpha(tint, 45)}
        strokeWidth="1.2"
        strokeLinejoin="round"
        transform="translate(32 33) scale(0.86) translate(-32 -33)"
      />

      <g transform={crest}>
        {/* A dark rim under the crest, so a light crest on a lit plate still
            has an edge rather than dissolving into it. */}
        <path
          d={a.emblem}
          fill="none"
          stroke={`color-mix(in srgb, ${tint} 55%, black)`}
          strokeWidth="2.6"
          strokeLinejoin="round"
          fillRule="evenodd"
        />
        <path d={a.emblem} fill={`url(#rbc-${a.n})`} fillRule="evenodd" />
      </g>

      {/* ---- chevrons under the plate: one from arena 3, two from 5, three
              from 7. The cheapest possible "you moved up" signal, and the one
              every competitive ladder reaches for, because it counts. */}
      {tier >= 1 && (
        <g fill="none" stroke={tint} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          {Array.from({ length: Math.min(3, tier) }).map((_, i) => (
            <path key={i} d={`M24 ${59 + i * 3.3} L32 ${63 + i * 3.3} L40 ${59 + i * 3.3}`} opacity={1 - i * 0.22} />
          ))}
        </g>
      )}
    </svg>
  )
}
