import { useMemo, useState } from 'react'
import { Bar, Btn, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import PixelSprite from '../components/PixelSprite'
import SydneyMap, { MAP_PX_H, MAP_PX_W } from '../components/SydneyMap'
import OverviewMap from '../components/OverviewMap'
import MapViewport from '../components/MapViewport'
import { key, toCell } from '../game/mapgrid'
import { OVER_H, OVER_W, overCell } from '../game/overview'
import { SYDNEY } from '../game/sydney'
import { TILE } from '../game/tiles'
import { useGame } from '../game/useGame'
import { CAMPAIGN, actById } from '../game/campaign'
import { campaignState } from '../game/engine'

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
  ['#2874b3', 'Open water'],
  ['#e2d1a0', 'Open ground'],
  ['#3f8a30', 'Bushland'],
  ['#cf5b41', 'Built up'],
  ['#e8933c', 'Main roads'],
  ['#f7e8bc', 'Beach'],
]

/** A compass rose, drawn rather than set in type. Every map that means it has
 *  one, and it is the cheapest thing on the page that says somebody made this. */
const COMPASS = {
  w: 15,
  h: 15,
  palette: { o: '#2a1e12', n: '#b8452f', s: '#e8d9b4', d: '#8a6a3f' },
  grid: [
    '.......o.......',
    '.......n.......',
    '......nnn......',
    '......nnn......',
    '.....onnno.....',
    '.....dnnnd.....',
    '..o..dnnnd..o..',
    'onnnddsssddnnno',
    '..o..dsssd..o..',
    '.....dsssd.....',
    '.....odsdo.....',
    '......ddd......',
    '......ods......',
    '.......d.......',
    '.......o.......',
  ],
}

/** The mark a town gets on the poster: two roofs, the way a world map draws a
 *  settlement. Small enough to sit under its own name plate. */
const TOWN = {
  w: 9,
  h: 7,
  palette: { o: '#4a3a24', f: '#cf5b41', F: '#94382a', w: '#efe4cc', g: '#5f86b0' },
  grid: [
    '..o...o..',
    '.ofo.ogo.',
    'offFo ggo'.replace(' ', 'o'),
    'owwwoowwo',
    'owwwoowwo',
    'ooooooooo',
    '..o...o..',
  ],
}

/** A boss's mark: a pennant on a pole, the way a quest map flags a place worth
 *  going to. The colour is the act it belongs to. */
const PENNANT = {
  w: 9,
  h: 11,
  palette: { o: '#2a1e12', a: 'var(--pennant)', s: '#f0e3bc', p: '#6b5433' },
  grid: [
    '.oo......',
    '.oaaaaao.',
    '.oaosoao.',
    '.oassaao.',
    '.oaosoao.',
    '.oaaaaao.',
    '.opo.....',
    '.opo.....',
    '.opo.....',
    'oopoo....',
    '.ooo.....',
  ],
}

/** Places the poster draws as themselves rather than as a generic town. Their
 *  name sits below the mark so it does not cover the drawing. */
const DRAWN = new Set(['bridge', 'opera', 'heads'])

const place = (id) => SYDNEY.places.find((p) => p.id === id)

/** Where a coordinate lands on the detailed map, in its own pixels. */
const spot = (p) => {
  const [x, y] = toCell([p.lon, p.lat])
  return { cx: x, cy: y, px: x * TILE + TILE / 2, py: y * TILE + TILE / 2 }
}

/** A place on the poster, as a percentage of it. */
const posterAt = (p) => {
  const [x, y] = overCell(p.lon, p.lat)
  return { left: `${(x / OVER_W) * 100}%`, top: `${(y / OVER_H) * 100}%` }
}

/**
 * The poster. Every town the picture has room for, named — a map with six
 * labels on it is a diagram, and the reference this is drawn from names every
 * settlement it has.
 */
function Poster({ onOpen, markers }) {
  const towns = useMemo(() => {
    const taken = []
    const out = []
    for (const p of [...SYDNEY.places].sort((a, b) => a.rank - b.rank)) {
      const [x, y] = overCell(p.lon, p.lat)
      // Dee Why is north of the frame's top edge. A name plate hangs above its
      // mark, so anything near an edge has to go rather than climb out of it.
      if (x < 1 || y < 2 || x > OVER_W - 1 || y > OVER_H - 1) continue
      // Percentages of a square, so one collision test works at any size.
      const px = (x / OVER_W) * 100
      const py = (y / OVER_H) * 100
      if (taken.some((t) => Math.abs(t.px - px) < 26 && Math.abs(t.py - py) < 9)) continue
      taken.push({ px, py })
      out.push(p)
    }
    return out
  }, [])

  return (
    <div
      className="relative p-[10px]"
      style={{
        background: '#2a1e12',
        // Brass notches cut into the timber, the way a border is tooled — a
        // plain rule and four studs was a box round a picture.
        backgroundImage:
          'repeating-linear-gradient(90deg, #6b5433 0 3px, transparent 3px 8px), repeating-linear-gradient(0deg, #6b5433 0 3px, transparent 3px 8px)',
        backgroundSize: '100% 4px, 4px 100%',
        backgroundPosition: 'center top, left center',
        backgroundRepeat: 'repeat-x, repeat-y',
        boxShadow: 'inset 0 0 0 2px #8a6a3f, inset 0 0 0 5px #2a1e12, inset 0 0 0 6px #c9a227, 3px 3px 0 0 rgba(0,0,0,0.55)',
      }}
    >
      {[
        ['top-[2px] left-[2px]', 'border-t-2 border-l-2'],
        ['top-[2px] right-[2px]', 'border-t-2 border-r-2'],
        ['bottom-[2px] left-[2px]', 'border-b-2 border-l-2'],
        ['bottom-[2px] right-[2px]', 'border-b-2 border-r-2'],
      ].map(([at, edge]) => (
        <span key={at} className={`absolute w-2.5 h-2.5 z-20 ${at} ${edge}`} style={{ borderColor: '#c9a227' }} />
      ))}

      <button
        onClick={onOpen}
        className="relative block w-full overflow-hidden active:brightness-105"
        aria-label="Open the full map"
      >
        <OverviewMap />

        {(() => {
          const held = []
          return [...markers]
            .sort((a, b) => Number(b.current) - Number(a.current))
            .filter((m) => {
              const [x, y] = overCell(m.place.lon, m.place.lat)
              if (held.some((h) => Math.abs(h[0] - x) < 3 && Math.abs(h[1] - y) < 3)) return false
              held.push([x, y])
              return true
            })
        })().map((m) => {
          const act = actById(m.boss.act)
          const at = posterAt(m.place)
          return (
            <span
              key={m.boss.id}
              className={`absolute -translate-y-full pointer-events-none ${m.current ? 'pulse-ring' : ''}`}
              style={{ ...at, '--pennant': m.cleared ? '#7a6035' : act.color, opacity: m.cleared ? 0.75 : 1 }}
              aria-hidden="true"
            >
              <PixelSprite sprite={PENNANT} size={16} />
            </span>
          )
        })}

        {towns.map((p) => (
          <span
            key={p.id}
            className={`absolute -translate-x-1/2 flex flex-col items-center pointer-events-none ${
              DRAWN.has(p.id) ? 'translate-y-1' : '-translate-y-full'
            }`}
            style={posterAt(p)}
          >
            {!DRAWN.has(p.id) && <PixelSprite sprite={TOWN} size={11} />}
            <span
              className="font-pixel text-[5px] leading-none whitespace-nowrap px-[3px] py-[2px] border mt-[1px]"
              style={{ color: '#33260f', background: '#f0e3bc', borderColor: '#7a6035' }}
            >
              {p.name}
            </span>
          </span>
        ))}
      </button>

      <span
        className="absolute left-2.5 bottom-2.5 z-10 grid place-items-center w-9 h-9 border pointer-events-none"
        style={{ background: '#e8d9b4', borderColor: '#2a1e12' }}
        aria-hidden="true"
      >
        <PixelSprite sprite={COMPASS} size={26} />
      </span>
    </div>
  )
}

/** The detailed map, opened. Same ground at a hundred metres a cell, with the
 *  fog, the bosses and somewhere to pan to. */
function FullMap({ onClose, revealed, markers, onPick }) {
  return (
    <Modal open onClose={onClose} title="SYDNEY" accent="var(--color-lime)" wide>
      <MapViewport
        w={MAP_PX_W}
        h={MAP_PX_H}
        label="Sydney"
        className="w-full aspect-square bg-[#2a1e12]"
        content={<SydneyMap revealed={revealed} style={{ width: MAP_PX_W, height: MAP_PX_H }} />}
      >
        {(view) => {
          const limit = view.zoom >= 3 ? 2 : view.zoom >= 1.6 ? 1 : 0
          const taken = []
          const room = (l) => {
            const x = view.x + l.px * view.s
            const y = view.y + l.py * view.s
            if (x < -80 || y < -20 || x > view.box.w + 80 || y > view.box.h + 20) return false
            if (x > view.box.w - 82 && y > view.box.h - 150) return false
            if (taken.some((t) => Math.abs(t.x - x) < 62 && Math.abs(t.y - y) < 16)) return false
            taken.push({ x, y })
            return true
          }
          return (
            <>
              {SYDNEY.places
                .map((p) => ({ ...p, ...spot(p) }))
                .sort((a, b) => a.rank - b.rank)
                .filter((l) => l.rank <= limit && room(l))
                .map((l) => (
                  <span
                    key={l.id}
                    aria-hidden="true"
                    className="absolute -translate-x-1/2 font-pixel text-[7px] leading-none whitespace-nowrap pointer-events-none px-1 py-[3px] border"
                    style={{
                      left: view.x + l.px * view.s,
                      top: view.y + l.py * view.s + 7,
                      color: '#33260f',
                      background: '#f0e3bc',
                      borderColor: '#7a6035',
                    }}
                  >
                    {l.name}
                  </span>
                ))}

              {markers.map((m) => {
                const act = actById(m.boss.act)
                const colour = m.cleared ? 'var(--color-ink-faint)' : m.current ? act.color : '#4a3a24'
                return (
                  <button
                    key={m.boss.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPick(m)
                    }}
                    aria-label={`${m.boss.name} at ${m.place.name}`}
                    className="absolute grid place-items-center w-11 h-11 -translate-x-1/2 -translate-y-1/2 active:brightness-125"
                    style={{ left: view.x + m.px * view.s, top: view.y + m.py * view.s }}
                  >
                    <span
                      className={`block w-3 h-3 border-2 rotate-45 ${m.current ? 'pulse-ring' : ''}`}
                      style={{
                        borderColor: colour,
                        background: m.current ? act.color : m.cleared ? 'transparent' : '#f0e3bc',
                        opacity: m.found || m.current ? 1 : 0.6,
                      }}
                    />
                  </button>
                )
              })}
            </>
          )
        }}
      </MapViewport>
      <div className="text-[10px] text-ink-faint mt-2.5 leading-relaxed">
        Drag to move, pinch or use + to get closer. Ground you have not walked sits under haze.
      </div>
    </Modal>
  )
}

export default function Map() {
  const { state } = useGame()
  const revealed = useMemo(() => new Set(state.explored ?? []), [state.explored])
  const [picked, setPicked] = useState(null)
  const [open, setOpen] = useState(false)
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

  const shown = picked ?? markers.find((m) => m.current) ?? markers[0]

  return (
    <div className="p-3 space-y-3">
      <Poster onOpen={() => setOpen(true)} markers={markers} />

      <Btn full variant="ghost" onClick={() => setOpen(true)}>
        OPEN THE FULL MAP
      </Btn>

      {open && (
        <FullMap
          onClose={() => setOpen(false)}
          revealed={revealed}
          markers={markers}
          onPick={(m) => {
            setPicked(m)
            setOpen(false)
          }}
        />
      )}

      <Panel corners={false} className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[8px] text-ink-faint">SYDNEY EXPLORED</span>
          <span className="font-mono text-[12px] text-lime">{(pct * 100).toFixed(1)}%</span>
        </div>
        <Bar pct={pct} color="var(--color-lime)" height={6} className="mt-2" />
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Ground you have not walked sits under haze. Every kilometre you cover clears more of it, and it stays clear.
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
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">450m a cell</span>}>
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
              the north, Coogee in the south, and the whole harbour in the middle. Open it and the same ground is drawn
              at a hundred metres a cell.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
