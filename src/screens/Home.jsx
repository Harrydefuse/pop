import { useState } from 'react'
import { Bar, Btn, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import LogSheet from '../components/LogSheet'
import { BossArt } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { BOSS } from '../game/data'
import { CHEST_TIERS, DAILY_SLOTS } from '../game/config'
import { chestTier, fmt, fmtFull, nextStreakTier, streakTier } from '../game/engine'

/**
 * One slot, one card, one colour. Each card answers "what is this, have I done
 * it, and what do I do about it" without needing to be compared against its
 * neighbours.
 */
function SlotCard({ slot, state, onLog }) {
  const done = state.done
  const pct = slot.minMinutes ? Math.min(1, state.minutes / slot.minMinutes) : state.minutes > 0 ? 1 : 0

  return (
    <Panel accent={done ? slot.color : undefined} className="overflow-hidden" corners={false}>
      <div className="h-1 w-full" style={{ background: done ? slot.color : 'var(--color-line)' }} />

      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div
            className="grid place-items-center w-12 h-12 shrink-0 border"
            style={{
              borderColor: slot.color,
              background: done ? slot.color : 'transparent',
            }}
          >
            <Icon name={slot.icon} size={22} color={done ? '#0b0715' : slot.color} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[11px]" style={{ color: slot.color }}>
                {slot.name}
              </span>
              {done && (
                <span
                  className="font-pixel text-[7px] px-1.5 py-1 border"
                  style={{ color: slot.color, borderColor: slot.color }}
                >
                  DONE
                </span>
              )}
            </div>
            <div className="text-[12px] text-ink mt-1.5">{slot.lead}</div>
            <div className="text-[11px] text-ink-dim mt-1 leading-snug">{slot.rule}</div>
          </div>

          <span className="font-pixel text-[9px] shrink-0" style={{ color: done ? slot.color : 'var(--color-ink-faint)' }}>
            +{slot.xp}
          </span>
        </div>

        {slot.minMinutes > 0 && (
          <div className="mt-3">
            <Bar pct={pct} color={slot.color} height={8} />
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[11px]" style={{ color: done ? slot.color : 'var(--color-ink-dim)' }}>
                {Math.round(state.minutes)} / {slot.minMinutes} min
              </span>
              {state.loggedAs && <span className="font-mono text-[11px] text-ink-faint">{state.loggedAs}</span>}
            </div>
          </div>
        )}

        {slot.sealsChest && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
            <Icon name="chest" size={12} color="var(--color-gold)" />
            <span className="text-[11px] text-gold">This one seals your daily chest</span>
          </div>
        )}

        <Btn
          full
          size="sm"
          className="mt-3"
          variant={done ? 'dim' : 'ghost'}
          onClick={onLog}
          style={done ? undefined : { borderColor: slot.color, color: slot.color }}
        >
          {done ? 'LOG MORE' : 'LOG IT'}
        </Btn>
      </div>
    </Panel>
  )
}

export default function Home({ setTab }) {
  const { state, openChest } = useGame()
  const [sheet, setSheet] = useState(null)
  const p = state.player
  const streak = streakTier(p.streak)
  const nextTier = nextStreakTier(p.streak)
  const doneCount = state.dailies.filter((d) => d.done).length
  const tier = chestTier(Math.max(1, state.chest.sealedDays))
  const bossPct = state.world.bossKm / BOSS.goalKm

  return (
    <div className="p-3 space-y-3.5">
      {/* --------------------------------------------------------- streak */}
      <Panel className="p-3.5" accent="#fb923c">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-12 h-12 border border-line bg-panel-2 shrink-0">
            <Icon name="flame" size={24} color="#fb923c" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-pixel text-[16px] text-[#fb923c]">{p.streak}</span>
              <span className="font-pixel text-[8px] text-ink-faint">DAY STREAK</span>
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5">
              {streak.label} · <span className="text-lime">×{streak.mult.toFixed(2)} XP</span>
              {nextTier && <span className="text-ink-faint"> · {nextTier.days - p.streak} to ×{nextTier.mult.toFixed(2)}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-pixel text-[14px]" style={{ color: doneCount === 3 ? 'var(--color-lime)' : 'var(--color-ink)' }}>
              {doneCount}/3
            </div>
            <div className="font-pixel text-[7px] text-ink-faint mt-1">TODAY</div>
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------- today */}
      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">3 a day, that&apos;s it</span>}>
          TODAY
        </SectionTitle>
        <div className="space-y-2.5">
          {DAILY_SLOTS.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              state={state.dailies.find((d) => d.id === slot.id) ?? { minutes: 0, done: false }}
              onLog={() => setSheet(slot)}
            />
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- chest */}
      <Panel className="p-3.5" accent={state.chest.sealedDays > 0 ? tier.color : undefined}>
        <div className="flex items-start gap-3">
          <div className="grid place-items-center w-12 h-12 border border-line bg-panel-2 shrink-0">
            <Icon name="chest" size={24} color={state.chest.sealedDays > 0 ? tier.color : 'var(--color-ink-faint)'} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[10px]" style={{ color: state.chest.sealedDays > 0 ? tier.color : 'var(--color-ink-faint)' }}>
              {state.chest.sealedDays > 0 ? tier.name : 'NO CHEST YET'}
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              {state.chest.sealedDays > 0
                ? `Sealed ${state.chest.sealedDays} day${state.chest.sealedDays > 1 ? 's' : ''}. Every day you move and leave it shut, it climbs a tier.`
                : 'Do your MOVE task and a chest seals. Leave it shut and it grows.'}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-3">
          {CHEST_TIERS.map((t) => {
            const reached = state.chest.sealedDays >= t.day
            return (
              <div key={t.day} className="flex-1 text-center" title={`Day ${t.day} · ${t.name}`}>
                <div className="h-1.5 mb-1" style={{ background: reached ? t.color : 'var(--color-panel-2)' }} />
                <span className="font-mono text-[9px]" style={{ color: reached ? t.color : 'var(--color-ink-faint)' }}>
                  {t.day}
                </span>
              </div>
            )
          })}
        </div>

        <Btn
          full
          className="mt-3"
          variant={state.chest.sealedDays > 0 ? 'gold' : 'dim'}
          disabled={state.chest.sealedDays === 0}
          onClick={openChest}
        >
          OPEN · {fmt(tier.cores)} CORES
        </Btn>
      </Panel>

      {/* ----------------------------------------------------------- boss */}
      <button className="block w-full text-left" onClick={() => setTab('arena')}>
        <Panel accent="var(--color-danger)" className="p-3.5">
          <div className="flex items-center gap-3">
            <BossArt size={56} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-pixel text-[9px] text-danger">{BOSS.name}</div>
              <Bar pct={bossPct} color="var(--color-danger)" height={6} className="mt-2" />
              <div className="font-mono text-[10px] text-ink-faint mt-1.5">
                {fmtFull(state.world.bossKm)} / {fmtFull(BOSS.goalKm)} km · you: {p.lifetime.bossKm} km
              </div>
            </div>
          </div>
        </Panel>
      </button>

      {sheet && (
        <LogSheet
          title={sheet.name}
          accepts={sheet.accepts}
          accent={sheet.color}
          minMinutes={sheet.minMinutes}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
