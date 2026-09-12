import { streakTier } from '../game/engine'

/**
 * The streak, on fire.
 *
 * Two hundred days and three days rendered identically, which made the number
 * the app asks you to protect the most look like the least. Heat runs from
 * nothing at day zero to everything at a hundred, and it drives the glow, how
 * many embers are lit and how quickly they climb — so the difference between a
 * good week and a good year is visible from across the room.
 */
export default function StreakFlame({ days }) {
  const tier = streakTier(days)
  const heat = Math.min(1, days / 100)
  const embers = days >= 3 ? Math.min(6, 1 + Math.floor(days / 14)) : 0

  return (
    <div className="text-right shrink-0">
      <div className="label text-ink-faint">Streak</div>
      <div className="streak-flame mt-1.5" style={{ '--heat': heat.toFixed(2) }}>
        {heat > 0 && <span className="streak-halo" aria-hidden="true" />}
        {Array.from({ length: embers }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="streak-ember"
            style={{
              left: `${18 + (i * 37) % 64}%`,
              '--drift': `${(i % 2 ? 1 : -1) * (3 + i)}px`,
              animationDelay: `${(i * 0.43).toFixed(2)}s`,
            }}
          />
        ))}
        <span className="streak-n figure text-[24px]" style={{ color: 'var(--tone-orange)' }}>
          {days}
        </span>
      </div>
      <div className="label text-ink-faint mt-1">{tier.label}</div>
    </div>
  )
}
