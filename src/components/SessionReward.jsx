import { useEffect, useState } from 'react'
import { Bar, Btn, Modal, RarityFrame, RarityTag } from './ui'
import { GearIcon, PetView } from './Sprites'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { RARITY } from '../game/config'
import { fmtFull, xpToNext } from '../game/engine'
import { alpha } from '../game/color'

/**
 * What the session just paid.
 *
 * This is the whole loop in one screen, and before it existed the loop was
 * invisible: you finished a workout, six toasts fired in a row and scrolled
 * past each other, and a bar chart nudged up half a pixel. Everything the game
 * awarded was already being awarded — XP, coins, boss damage, records — it just
 * never landed anywhere you were looking.
 *
 * So it lands here, in the two seconds after the effort, in the order that
 * reads as a reward and not as a receipt: what you did, what it earned, what it
 * moved, and then — on a good day — what dropped.
 */

/** Counts up to its value once, on mount. The landing is the point. */
function Tally({ value, format = fmtFull, delay = 0 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still || value <= 0) {
      setN(value)
      return
    }
    let raf = 0
    let t0 = 0
    const tick = (now) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0 - delay) / 620)
      if (t > 0) setN(Math.round(value * (1 - (1 - t) ** 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, delay])
  return <>{format(n)}</>
}

function Earned({ icon, color, value, label, delay }) {
  return (
    <div className="loot-pop text-center px-2 py-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-center gap-1.5">
        <Icon name={icon} size={14} color={color} />
        <span className="figure text-[21px] leading-none" style={{ color }}>
          +<Tally value={value} delay={delay} />
        </span>
      </div>
      <div className="label text-ink-faint mt-1.5">{label}</div>
    </div>
  )
}

export default function SessionReward() {
  const { state, dismissSessionReward } = useGame()
  const r = state.sessionReward
  if (!r) return null

  const p = state.player
  const cap = xpToNext(p.level)
  const maxed = !Number.isFinite(cap)
  const best = r.drops.length
    ? r.drops.reduce((acc, d) => (RARITY[d.rarity].weight < RARITY[acc].weight ? d.rarity : acc), 'common')
    : null
  const accent = best ? RARITY[best].color : 'var(--color-lime)'

  const cells = [
    { icon: 'spark', color: 'var(--color-neon)', value: r.xp, label: 'XP' },
    { icon: 'core', color: 'var(--color-gold)', value: r.coins, label: 'coins' },
  ]
  if (r.damage > 0) cells.push({ icon: 'swords', color: 'var(--color-danger)', value: r.damage, label: 'damage' })

  return (
    <Modal open onClose={dismissSessionReward} title="Session complete">
      <div className="text-center">
        <div className="loot-pop inline-flex items-center gap-2">
          <Icon name={r.icon} size={20} color="var(--color-ink-dim)" />
          <span className="font-display text-[17px] text-ink">
            {r.activity} · {r.amount}
            {r.unit === 'min' ? ' min' : ` ${r.unit}`}
          </span>
        </div>
        {!r.verified && <div className="text-[14px] text-ink-faint mt-1.5">Unverified — half rate</div>}
      </div>

      {/* ---- what it earned, counting up */}
      <div className="grid mt-3.5 border border-line divide-x divide-line" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
        {cells.map((c, i) => (
          <Earned key={c.label} {...c} delay={140 + i * 130} />
        ))}
      </div>

      {/* ---- what it moved */}
      <div className="mt-3.5">
        <div className="flex items-baseline justify-between">
          <span className="label text-ink-faint">Level {p.level}</span>
          <span className="text-[14px] text-ink-faint tabular-nums">
            {maxed ? 'MAX' : `${fmtFull(Math.round(p.xp))} / ${fmtFull(cap)}`}
          </span>
        </div>
        <Bar pct={maxed ? 1 : p.xp / cap} height={9} shine className="mt-1.5" />
      </div>

      {r.boss && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="label text-ink-faint">{r.boss.name}</span>
            <span className="text-[14px] text-ink-faint tabular-nums">
              {fmtFull(Math.round(r.boss.damage))} / {fmtFull(r.boss.hp)}
            </span>
          </div>
          <Bar pct={r.boss.damage / r.boss.hp} color="var(--color-danger)" height={9} shine className="mt-1.5" />
        </div>
      )}

      {/* ---- milestones: the things that actually drop loot */}
      {r.milestones.length > 0 && (
        <div className="mt-3.5 space-y-1.5">
          {r.milestones.map((m, i) => (
            <div
              key={`${m.kind}${i}`}
              className="loot-pop flex items-center gap-2 border px-2.5 py-2"
              style={{
                animationDelay: `${420 + i * 90}ms`,
                borderColor: alpha('#f59e0b', 45),
                background: alpha('#f59e0b', 8),
              }}
            >
              <Icon name="trophy" size={14} color="var(--color-gold)" />
              <span className="text-[15px] text-ink">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {r.prs.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {r.prs.map((pr) => (
            <div key={pr.lift} className="text-[14px] text-ink-dim leading-snug">
              <span className="text-ink">{pr.lift}</span> — {pr.reps} × {pr.weight}kg, an estimated{' '}
              {Math.round(pr.e1rm)}kg max, up from {Math.round(pr.prev)}kg.
            </div>
          ))}
        </div>
      )}

      {/* ---- the drop */}
      {r.drops.length > 0 && (
        <div className="mt-3.5">
          <div className="label text-ink-faint mb-2">
            {r.drops.length === 1 ? 'A drop' : `${r.drops.length} drops`}
          </div>
          <div className="space-y-2">
            {r.drops.map((d, i) => (
              <div
                key={i}
                className="loot-pop flex items-center gap-3 border p-2.5"
                style={{
                  animationDelay: `${620 + i * 140}ms`,
                  borderColor: RARITY[d.rarity].color,
                  background: alpha(RARITY[d.rarity].color, 10),
                  boxShadow: `0 0 20px -8px ${RARITY[d.rarity].color}`,
                }}
              >
                <RarityFrame rarity={d.rarity} size={46}>
                  {d.kind === 'pet' ? (
                    <PetView refId={d.ref} level={1} size={38} />
                  ) : (
                    <GearIcon slot={d.slot} kind={d.side ?? d.slot} set={d.set} size={28} />
                  )}
                </RarityFrame>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[15px] truncate" style={{ color: RARITY[d.rarity].color }}>
                    {d.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <RarityTag rarity={d.rarity} />
                    <span className="text-[14px] text-ink-faint truncate">from {d.from}</span>
                  </div>
                  {d.duplicate && <div className="text-[14px] text-ink-dim mt-1">Already owned — converted to coins</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.levels.length > 0 && (
        <div className="mt-3 text-[15px] text-neon text-center">
          Level {r.levels[r.levels.length - 1]} reached.
        </div>
      )}
      {r.pet && (
        <div className="mt-2 text-[14px] text-ink-dim text-center">
          {r.pet.name} grew to level {r.pet.level}.
        </div>
      )}
      {r.stones.map((st) => (
        <div key={st.name} className="mt-2 text-[14px] text-center" style={{ color: st.color }}>
          {st.name} stone — {st.reward}
        </div>
      ))}

      <Btn
        full
        className="mt-4"
        onClick={dismissSessionReward}
        style={{ background: accent, borderColor: accent, color: 'var(--color-on-accent)' }}
      >
        {r.drops.length ? 'Take it' : 'Done'}
      </Btn>
    </Modal>
  )
}
