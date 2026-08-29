import { useMemo, useState } from 'react'
import { Bar, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import SydneyMap, { MAP_PX_H, MAP_PX_W } from '../components/SydneyMap'
import MapViewport from '../components/MapViewport'
import { key, toCell } from '../game/mapgrid'
import { SYDNEY } from '../game/sydney'
import { TILE } from '../game/tiles'
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
  ['#5d9a44', 'Open ground'],
  ['#3f7a30', 'Bushland'],
  ['#a85a44', 'Built up'],
  ['#e8d8a6', 'Beach'],
]

const place = (id) => SYDNEY.places.find((p) => p.id === id)

/** Where a coordinate lands on the painted map, in its own pixels. */
const spot = (p) => {
  const [x, y] = toCell([p.lon, p.lat])
  return { cx: x, cy: y, px: x * TILE + TILE / 2, py: y * TILE + TILE / 2 }
}

export default function Map() {
  const { state } = useGame()
  const revealed = useMemo(() => new Set(state.explored ?? []), [state.explored])
  const [picked, setPicked] = useState(null)
  const c = campaignState(state.player, state.campaign)

  const pct = revealed.size / (SYDNEY.w * SYDNEY.h)

  const markers = useMemo(
    () =>
      CAMPAIGN.map((boss) => {
        const p = place(BOSS_SITES[boss.id])
        if (!p) return null
        const s = spot(p)
        return {
          boss,
          place: p,
          ...s,
          found: revealed.has(key(s.cx, s.cy)),
          cleared: c.defeated.includes(boss.id),
          current: c.current?.id === boss.id,
        }
      }).filter(Boolean),
    [revealed, c.defeated, c.current],
  )

  const labels = useMemo(
    () => [...SYDNEY.places].sort((a, b) => a.rank - b.rank).map((p) => ({ ...p, ...spot(p) })),
    [],
  )
  const shown = picked ?? markers.find((m) => m.current) ?? markers[0]

  return (
    <div className="p-3 space-y-3">
      <Panel className="p-2" accent="var(--color-lime)">
        <MapViewport
          w={MAP_PX_W}
          h={MAP_PX_H}
          label="Sydney Harbour"
          className="w-full aspect-square bg-[#0b0715]"
          content={<SydneyMap revealed={revealed} style={{ width: MAP_PX_W, height: MAP_PX_H }} />}
        >
          {(view) => {
            // Labels earn their place as you go in: six anchors from across the
            // whole harbour, then the suburbs, then everything.
            const limit = view.zoom >= 3 ? 2 : view.zoom >= 1.6 ? 1 : 0
            // Two names on top of each other is worse than one name. Take them
            // in order of importance and drop anything that lands on a name
            // already down.
            const taken = []
            const room = (l) => {
              const x = view.x + l.px * view.s
              const y = view.y + l.py * view.s
              // The zoom controls own the bottom right corner; nothing gets
              // written underneath them.
              if (x > view.box.w - 82 && y > view.box.h - 150) return false
              if (taken.some((t) => Math.abs(t.x - x) < 62 && Math.abs(t.y - y) < 16)) return false
              taken.push({ x, y })
              return true
            }
            return (
              <>
                {labels
                  .filter((l) => l.rank <= limit && room(l))
                  .map((l) => (
                    <span
                      key={l.id}
                      aria-hidden="true"
                      className="absolute -translate-x-1/2 font-pixel text-[7px] whitespace-nowrap pointer-events-none text-[#f6f1e4]"
                      style={{
                        left: view.x + l.px * view.s,
                        top: view.y + l.py * view.s + 8,
                        textShadow: '0 1px 0 #10131c, 0 -1px 0 #10131c, 1px 0 0 #10131c, -1px 0 0 #10131c',
                      }}
                    >
                      {l.name}
                    </span>
                  ))}

                {markers.map((m) => {
                  const act = actById(m.boss.act)
                  const colour = m.cleared ? 'var(--color-ink-faint)' : m.current ? act.color : 'var(--color-ink-faint)'
                  return (
                    <button
                      key={m.boss.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPicked(m)
                      }}
                      aria-label={`${m.boss.name} at ${m.place.name}`}
                      className="absolute grid place-items-center w-11 h-11 -translate-x-1/2 -translate-y-1/2 active:brightness-125"
                      style={{ left: view.x + m.px * view.s, top: view.y + m.py * view.s }}
                    >
                      <span
                        className={`block w-3 h-3 border-2 rotate-45 ${m.current ? 'pulse-ring' : ''}`}
                        style={{
                          borderColor: colour,
                          background: m.current ? act.color : m.cleared ? 'transparent' : alpha('#0b0715', 78),
                          opacity: m.found || m.current ? 1 : 0.5,
                        }}
                      />
                    </button>
                  )
                })}
              </>
            )
          }}
        </MapViewport>
      </Panel>

      <Panel corners={false} className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[8px] text-ink-faint">SYDNEY EXPLORED</span>
          <span className="font-mono text-[12px] text-lime">{(pct * 100).toFixed(1)}%</span>
        </div>
        <Bar pct={pct} color="var(--color-lime)" height={6} className="mt-2" />
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Ground stays dark until you have been there. Every kilometre you cover opens more of the harbour, and it stays
          open. Drag to move, pinch or use + to get closer.
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
              Eighteen kilometres of Sydney: the Parramatta and Lane Cove rivers in the west, Dee Why and Curl Curl in
              the north, Coogee in the south, and the whole harbour in the middle. Coastline traced from the real
              thing; every hundred metres of it drawn by hand.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
