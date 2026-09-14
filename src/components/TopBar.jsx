import { useState } from 'react'
import Avatar from './Avatar'
import PixelSprite from './PixelSprite'
import { MAP_ICON } from '../game/sprites'
import Icon from './Icon'
import { Bar, Num } from './ui'
import ArenaEmblem from './ArenaEmblem'
import { useGame } from '../game/useGame'
import { campaignState, classById, fmt, streakTier, xpToNext } from '../game/engine'
import { MAX_LEVEL } from '../game/config'
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
      <Icon name={dark ? 'sun' : 'moon'} size={19} color="var(--color-ink-dim)" />
    </button>
  )
}

export default function TopBar({ onOpenProfile, onOpenMap }) {
  const { state } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const need = xpToNext(p.level)
  const maxed = !Number.isFinite(need)
  const streak = streakTier(p.streak)
  // The room, up here with the level, because the two are the same fact said
  // twice: your level is what puts you in this arena.
  const arena = campaignState(p, state.campaign).arena

  return (
    // The header is the room's. Tinted ground and a rule along the bottom in
    // the arena's colour, so the first thing on every screen says where you
    // are standing before you have read a word.
    <header
      className="relative z-20 bg-panel/95 backdrop-blur px-3 pb-2.5 pad-safe-top"
      style={{
        backgroundImage: `linear-gradient(var(--arena-wash), var(--arena-wash))`,
        boxShadow: 'inset 0 -2px 0 0 var(--arena)',
      }}
    >
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
          <div className="font-display text-[19px] truncate leading-tight">{p.name}</div>
          {/* The arena, in the slot the power rank used to have.
              Two ladders were competing for the same corner of the screen and
              the wrong one was winning: BRONZE through IMMORTAL is scored off
              your gear, changes when you equip a hat, and is already on both
              screens where power belongs. The arena is scored off the training
              and is the thing the whole game is climbing, so it gets the
              header. */}
          <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap overflow-hidden">
            <ArenaEmblem arena={arena} size={14} plate={false} />
            <span className="label truncate" style={{ color: 'var(--arena)' }}>
              {arena.name.toUpperCase()} · ARENA {arena.n}
            </span>
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
            aria-label="Open the map"
          >
            <PixelSprite sprite={MAP_ICON} size={28} />
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <span className="figure text-[15px] shrink-0" style={{ color: 'var(--arena)' }}>
          LV {p.level}
        </span>
        <Bar pct={maxed ? 1 : p.xp / need} height={7} shine color="var(--arena)" className="flex-1" />
        <span className="text-[13px] text-ink-faint shrink-0 tabular-nums">
          {maxed ? `MAX ${MAX_LEVEL}` : `${fmt(p.xp)}/${fmt(need)}`}
        </span>
        <span className="w-px h-3 bg-line shrink-0" />
        <span className="flex items-center gap-1 shrink-0" title={`${p.streak} day streak · ${streak.label}`}>
          <Icon name="bolt" size={15} color={p.streak > 0 ? 'var(--tone-orange)' : 'var(--color-ink-faint)'} />
          <span className="figure text-[14px]" style={{ color: p.streak > 0 ? 'var(--tone-orange)' : 'var(--color-ink-faint)' }}>
            {p.streak}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0" title="Cores">
          <Icon name="core" size={13} color="var(--color-gold)" />
          <span className="figure text-[14px] text-gold">
            <Num value={p.cores} format={fmt} />
          </span>
        </span>
      </div>
    </header>
  )
}
