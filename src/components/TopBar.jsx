import Avatar from './Avatar'
import Icon from './Icon'
import { Bar } from './ui'
import { useGame } from '../game/useGame'
import { classById, fmt, powerScore, rankFor, streakTier, xpToNext } from '../game/engine'

export default function TopBar({ onOpenProfile, onOpenAxis }) {
  const { state } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank } = rankFor(power)
  const need = xpToNext(p.level)
  const streak = streakTier(p.streak)

  return (
    <header className="relative z-20 border-b border-line bg-[#0d0918]/95 backdrop-blur px-3 pt-3 pb-2.5">
      <div className="flex items-center gap-2.5">
        <button onClick={onOpenProfile} className="shrink-0" aria-label="Open character sheet">
          <Avatar av={p.avatar} size={38} ring={cls.color} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-pixel text-[10px] truncate">{p.name}</span>
            <span className="font-pixel text-[7px] px-1 py-0.5 border" style={{ color: cls.color, borderColor: cls.color }}>
              {cls.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-pixel text-[7px]" style={{ color: rank.color }}>
              {rank.name}
            </span>
            <span className="text-ink-faint text-[10px]">·</span>
            <span className="font-mono text-[10px] text-ink-dim">{fmt(power)} PWR</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1" title={`${p.streak} day streak · ${streak.label}`}>
            <Icon name="flame" size={11} color={p.streak > 0 ? '#fb923c' : 'var(--color-ink-faint)'} />
            <span className="font-pixel text-[9px]" style={{ color: p.streak > 0 ? '#fb923c' : 'var(--color-ink-faint)' }}>
              {p.streak}
            </span>
          </div>
          <div className="flex items-center gap-1" title="Cores">
            <Icon name="core" size={11} color="var(--color-gold)" />
            <span className="font-pixel text-[9px] text-gold">{fmt(p.cores)}</span>
          </div>
          <button
            onClick={onOpenAxis}
            className="grid place-items-center w-8 h-8 border border-cyan bg-[#0c1a20] hover:brightness-125"
            style={{ boxShadow: '0 0 14px -6px var(--color-cyan)' }}
            aria-label="Open AXIS coach"
            title="AXIS coach"
          >
            <Icon name="spark" size={14} color="var(--color-cyan)" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <span className="font-pixel text-[8px] text-neon shrink-0">LV {p.level}</span>
        <Bar pct={p.xp / need} height={7} shine className="flex-1" />
        <span className="font-mono text-[9px] text-ink-faint shrink-0 tabular-nums">
          {fmt(p.xp)}/{fmt(need)}
        </span>
      </div>
    </header>
  )
}
