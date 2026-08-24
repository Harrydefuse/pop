import { useMemo, useState } from 'react'
import { Bar, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import SydneyMap from '../components/SydneyMap'
import { key, toCell } from '../game/mapgrid'
import { SYDNEY } from '../game/sydney'
import { useGame } from '../game/useGame'
import { CAMPAIGN, actById } from '../game/campaign'
import { campaignState } from '../game/engine'
import { alpha } from '../game/color'

/**
 * Bosses stand somewhere. Tying each one to a real place turns the ladder into
 * a route through the city rather than a list — you can see where the story
 * goes next, and it is a walk away.
 */
const BOSS_SITES = {
  golem: 'quay',
  wraith: 'darling',
  couch: 'northsyd',
  doomscroll: 'cbd',
  ironjaw: 'domain',
  wall: 'centennial',
  nox: 'mosman',
  mirror: 'rose',
  backslide: 'bondi',
  lvl100: 'heads',
}

const LEGEND = [
  ['#3f93cc', 'Harbour'],
  ['#57893f', 'Open ground'],
  ['#3d6b2c', 'Bushland'],
  ['#8a8378', 'Built up'],
  ['#e2d19a', 'Beach'],
]

export default function Map() {
  const { state } = useGame()
  const revealed = useMemo(() => new Set(state.explored ?? []), [state.explored])
  const [picked, setPicked] = useState(null)
  const c = campaignState(state.player, state.campaign)

  const pct = revealed.size / (SYDNEY.w * SYDNEY.h)
  const place = (id) => SYDNEY.places.find((p) => p.id === id)

  const markers = useMemo(
    () =>
      CAMPAIGN.map((boss) => {
        const p = place(BOSS_SITES[boss.id])
        if (!p) return null
        const [x, y] = toCell([p.lon, p.lat])
        return {
          boss,
          place: p,
          left: `${(x / SYDNEY.w) * 100}%`,
          top: `${(y / SYDNEY.h) * 100}%`,
          found: revealed.has(key(x, y)),
          cleared: c.defeated.includes(boss.id),
          current: c.current?.id === boss.id,
        }
      }).filter(Boolean),
    [revealed, c.defeated, c.current],
  )

  const shown = picked ?? markers.find((m) => m.current) ?? markers[0]

  return (
    <div className="p-3 space-y-3">
      <Panel className="p-2" accent="var(--color-lime)">
        <div className="relative">
          <SydneyMap revealed={revealed} className="w-full h-auto" />

          {markers.map((m) => {
            const act = actById(m.boss.act)
            const colour = m.cleared ? 'var(--color-ink-faint)' : m.current ? act.color : 'var(--color-ink-faint)'
            return (
              <button
                key={m.boss.id}
                onClick={() => setPicked(m)}
                aria-label={m.boss.name}
                className="absolute grid place-items-center w-11 h-11 -translate-x-1/2 -translate-y-1/2 active:brightness-125"
                style={{ left: m.left, top: m.top }}
              >
                <span
                  className={`block w-2.5 h-2.5 border ${m.current ? 'pulse-ring' : ''}`}
                  style={{
                    borderColor: colour,
                    background: m.current ? act.color : m.cleared ? 'transparent' : alpha('#0b0715', 70),
                    opacity: m.found || m.current ? 1 : 0.45,
                  }}
                />
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel corners={false} className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[8px] text-ink-faint">SYDNEY EXPLORED</span>
          <span className="font-mono text-[12px] text-lime">{(pct * 100).toFixed(1)}%</span>
        </div>
        <Bar pct={pct} color="var(--color-lime)" height={6} className="mt-2" />
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Ground stays dark until you have been there. Every kilometre you cover opens more of the harbour, and it stays
          open.
        </div>
      </Panel>

      {shown && (
        <Panel className="p-3.5" accent={actById(shown.boss.act).color}>
          <SectionTitle color={actById(shown.boss.act).color}>
            {shown.cleared ? 'CLEARED' : shown.current ? 'STANDING HERE NOW' : 'FURTHER ON'}
          </SectionTitle>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-pixel text-[10px]" style={{ color: actById(shown.boss.act).color }}>
              {shown.boss.name}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">at {shown.place.name}</span>
          </div>
          <div className="text-[11px] text-ink-dim mt-2 leading-snug">{shown.boss.lore}</div>
        </Panel>
      )}

      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">100m a cell</span>}>
          THE HARBOUR
        </SectionTitle>
        <Panel corners={false} className="p-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {LEGEND.map(([colour, label]) => (
              <span key={label} className="flex items-center gap-2">
                <span className="w-3 h-3 shrink-0 border border-line" style={{ background: colour }} />
                <span className="text-[11px] text-ink-dim">{label}</span>
              </span>
            ))}
          </div>
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-line">
            <span className="mt-0.5 shrink-0">
              <Icon name="spark" size={11} color="var(--color-ink-faint)" />
            </span>
            <p className="text-[10px] text-ink-faint leading-relaxed">
              Twelve kilometres of harbour, from Balmain out to the Heads. Coastline traced from the real thing;
              everything on the land is drawn.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
