import { useState } from 'react'
import Avatar from './Avatar'
import PixelSprite from './PixelSprite'
import { MAP_ICON } from '../game/sprites'
import Icon from './Icon'
import { Bar } from './ui'
import { useGame } from '../game/useGame'
import { classById, fmt, powerScore, rankFor, streakTier, xpToNext } from '../game/engine'
import { applyTheme, readTheme } from '../game/theme'

/** Light or dark, on the same shelf as the map. */
function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme)
  const dark = theme === 'dark'
  const next = dark ? 'light' : 'dark'
  return (
    <button
      onClick={() => setTheme(applyTheme(next))}
      className="shrink-0 grid place-items-center w-11 h-11 active:brightness-125"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {/* The icon is the mode you are about to get, not the one you are in:
          a moon to go dark, a sun to come back. */}
      <span
        className="grid place-items-center w-7 h-7 border"
        style={{
          borderColor: dark ? 'var(--color-gold)' : 'var(--color-neon)',
          background: dark ? 'color-mix(in srgb, var(--color-gold) 14%, transparent)' : 'color-mix(in srgb, var(--color-neon) 10%, transparent)',
        }}
      >
        <Icon name={dark ? 'sun' : 'moon'} size={13} color={dark ? 'var(--color-gold)' : 'var(--color-neon)'} />
      </span>
    </button>
  )
}

export default function TopBar({ onOpenProfile, onOpenAxis, onOpenMap }) {
  const { state } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank } = rankFor(power)
  const need = xpToNext(p.level)
  const streak = streakTier(p.streak)

  return (
    <header className="relative z-20 border-b border-line bg-panel/95 backdrop-blur px-3 pb-2.5 pad-safe-top">
      <div className="flex items-center gap-2.5">
        {/* 38px of avatar, 44px of hit area — padding expands the target without
            changing the visual size. */}
        <button
          onClick={onOpenProfile}
          className="shrink-0 active:brightness-125 grid place-items-center w-11 h-11"
          aria-label="Open character sheet"
        >
          <Avatar av={p.avatar} size={42} ring={cls.color} />
        </button>

        <div className="min-w-0 flex-1">
          {/* No class chip. Nobody picks a class at sign-up, so the header was
              labelling the player with something they never chose — and the
              room it took is what the map needed. */}
          <div className="font-pixel text-[10px] truncate">{p.name}</div>
          <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap overflow-hidden">
            <span className="font-pixel text-[7px] shrink-0" style={{ color: rank.color }}>
              {rank.name}
            </span>
            <span className="text-ink-faint text-[10px] shrink-0">·</span>
            <span className="font-mono text-[10px] text-ink-dim truncate">{fmt(power)} PWR</span>
          </div>
        </div>

        {/* Controls only. The streak and the cores moved down to the meter row
            when the theme toggle arrived — three 44px targets, a name and two
            readouts do not fit across a 375px phone, and the name is the part
            that was losing. */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* The map lives up here now: a picture of the city small enough to
              sit beside the numbers, and one tap from the whole thing. */}
          <button
            onClick={onOpenMap}
            className="shrink-0 grid place-items-center w-11 h-11 active:brightness-110"
            aria-label="Open the map of Sydney"
          >
            <PixelSprite sprite={MAP_ICON} size={30} />
          </button>
          <ThemeToggle />
          <button
            onClick={onOpenAxis}
            className="grid place-items-center w-11 h-11 border border-cyan bg-cyan/10 hover:brightness-125 active:brightness-150"
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
        <span className="w-px h-3 bg-line shrink-0" />
        <span className="flex items-center gap-1 shrink-0" title={`${p.streak} day streak · ${streak.label}`}>
          <Icon name="flame" size={10} color={p.streak > 0 ? 'var(--tone-orange)' : 'var(--color-ink-faint)'} />
          <span className="font-pixel text-[8px]" style={{ color: p.streak > 0 ? 'var(--tone-orange)' : 'var(--color-ink-faint)' }}>
            {p.streak}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0" title="Cores">
          <Icon name="core" size={10} color="var(--color-gold)" />
          <span className="font-pixel text-[8px] text-gold">{fmt(p.cores)}</span>
        </span>
      </div>
    </header>
  )
}
