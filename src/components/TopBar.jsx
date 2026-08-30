import Avatar from './Avatar'
import OverviewMap from './OverviewMap'
import Icon from './Icon'
import { Bar } from './ui'
import { useGame } from '../game/useGame'
import { classById, fmt, powerScore, rankFor, streakTier, xpToNext } from '../game/engine'

export default function TopBar({ onOpenProfile, onOpenAxis, onOpenMap }) {
  const { state } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank } = rankFor(power)
  const need = xpToNext(p.level)
  const streak = streakTier(p.streak)

  return (
    <header className="relative z-20 border-b border-line bg-[#0d0918]/95 backdrop-blur px-3 pb-2.5 pad-safe-top">
      <div className="flex items-center gap-2.5">
        {/* 38px of avatar, 44px of hit area — padding expands the target without
            changing the visual size. */}
        <button
          onClick={onOpenProfile}
          className="shrink-0 active:brightness-125 grid place-items-center w-11 h-11 -m-[3px]"
          aria-label="Open character sheet"
        >
          <Avatar av={p.avatar} size={38} ring={cls.color} />
        </button>

        <div className="min-w-0 flex-1">
          {/* No class chip. Nobody picks a class at sign-up, so the header was
              labelling the player with something they never chose — and the
              room it took is what the map needed. */}
          <div className="font-pixel text-[10px] truncate">{p.name}</div>
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
          {/* The map lives up here now: a picture of the city small enough to
              sit beside the numbers, and one tap from the whole thing. */}
          <button
            onClick={onOpenMap}
            className="shrink-0 grid place-items-center w-11 h-11 active:brightness-110"
            aria-label="Open the map of Sydney"
          >
            <span
              className="block w-8 h-8 overflow-hidden"
              style={{ padding: 2, background: '#2a1e12', boxShadow: 'inset 0 0 0 1px #c9a227' }}
            >
              <OverviewMap className="w-full h-full" />
            </span>
          </button>
          <button
            onClick={onOpenAxis}
            className="grid place-items-center w-11 h-11 border border-cyan bg-[#0c1a20] hover:brightness-125 active:brightness-150"
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
