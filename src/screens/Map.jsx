import { useMemo, useState } from 'react'
import { Bar, Btn, Modal, SectionTitle } from '../components/ui'
import CampaignSheet from '../components/CampaignSheet'
import PixelSprite from '../components/PixelSprite'
import OverviewMap from '../components/OverviewMap'
import SydneyMap from '../components/SydneyMap'
import MapViewport from '../components/MapViewport'
import RouteMap from '../components/RouteMap'
import { OVER_H, OVER_PX, OVER_W, coarseExplored, overCell } from '../game/overview'
import { SYDNEY } from '../game/sydney'
import { useGame } from '../game/useGame'
import { ACTIVITIES } from '../game/config'
import { CAMPAIGN, actById } from '../game/campaign'
import { campaignState } from '../game/engine'

/** One colour per route, so a screen of them reads as separate walks. */
const ROUTE_COLOURS = ['#0e7490', '#be123c', '#3f6212', '#6d28d9', '#c2410c', '#0369a1']

/** How long ago, short enough for a list row. */
function whenAgo(at) {
  const days = Math.floor((Date.now() - at) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.round(days / 7)}w ago`
}

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

/** How big the map is drawn when it is open: the coarse art at 3x, so every
 *  drawn pixel is three across and the thing reads as chunky rather than fine. */
const BIG = OVER_PX * 3

/** The frame. Tooled timber, a gold rule, brackets at the corners. */
function Framed({ children, className = '', pad = 10 }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        padding: pad,
        background: '#2a1e12',
        backgroundImage:
          'repeating-linear-gradient(90deg, #6b5433 0 3px, transparent 3px 8px), repeating-linear-gradient(0deg, #6b5433 0 3px, transparent 3px 8px)',
        backgroundSize: '100% 4px, 4px 100%',
        backgroundPosition: 'center top, left center',
        backgroundRepeat: 'repeat-x, repeat-y',
        boxShadow:
          'inset 0 0 0 2px #8a6a3f, inset 0 0 0 5px #2a1e12, inset 0 0 0 6px #a16207, 3px 3px 0 0 rgba(0,0,0,0.55)',
      }}
    >
      {[
        ['top-[2px] left-[2px]', 'border-t-2 border-l-2'],
        ['top-[2px] right-[2px]', 'border-t-2 border-r-2'],
        ['bottom-[2px] left-[2px]', 'border-b-2 border-l-2'],
        ['bottom-[2px] right-[2px]', 'border-b-2 border-r-2'],
      ].map(([at, edge]) => (
        <span key={at} className={`absolute w-2.5 h-2.5 z-20 ${at} ${edge}`} style={{ borderColor: '#a16207' }} />
      ))}
      {children}
    </div>
  )
}

/**
 * The map, open. Same drawing at three times the size so it is chunky the way
 * the reference is, with every town named, the landmarks in place, and a
 * pennant on every boss you have not put down yet.
 */
function BigMap({ markers, onPick, revealed, fine, footer }) {
  return (
    <>
      <Framed pad={6}>
        <MapViewport
          w={BIG}
          h={BIG}
          label="Sydney"
          className="w-full aspect-square bg-[#2a1e12]"
          // Two drawings of the same ground, stacked and cross-faded by how far
          // in you are: the world map you can read at a glance, resolving into
          // the streets you actually walked. One coordinate space, so nothing
          // jumps at the handover.
          content={(view) => {
            const street = Math.min(1, Math.max(0, (view.zoom - 1.9) / 1.3))
            return (
              <div className="relative" style={{ width: BIG, height: BIG }}>
                <OverviewMap revealed={revealed} style={{ width: BIG, height: BIG, opacity: 1 - street }} />
                <SydneyMap
                  revealed={fine}
                  animate={street > 0.05}
                  className="absolute inset-0"
                  style={{ width: BIG, height: BIG, opacity: street }}
                />
              </div>
            )
          }}
        >
          {(view) => {
            const at = (p) => {
              const [x, y] = overCell(p.lon, p.lat)
              return { x: view.x + (x / OVER_W) * BIG * view.s, y: view.y + (y / OVER_H) * BIG * view.s }
            }
            // Zoomed out, only the places that carry the shape of the city;
            // the suburbs arrive as you go in.
            const limit = view.zoom >= 2.4 ? 2 : view.zoom >= 1.5 ? 1 : 0
            const taken = []
            const room = (p) => {
              if (p.rank > limit) return false
              const { x, y } = at(p)
              if (x < -60 || y < -20 || x > view.box.w + 60 || y > view.box.h + 20) return false
              // Plates are wide and stack easily; this box is what keeps The
              // Heads off Watsons Bay.
              if (taken.some((t) => Math.abs(t.x - x) < 78 && Math.abs(t.y - y) < 27)) return false
              taken.push({ x, y })
              return true
            }
            const held = []
            const flags = [...markers]
              .sort((a, b) => Number(b.current) - Number(a.current))
              .filter((m) => {
                const { x, y } = at(m.place)
                if (held.some((h) => Math.abs(h.x - x) < 26 && Math.abs(h.y - y) < 26)) return false
                held.push({ x, y })
                return true
              })

            return (
              <>
                {flags.map((m) => {
                  const act = actById(m.boss.act)
                  const { x, y } = at(m.place)
                  return (
                    <button
                      key={m.boss.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPick(m)
                      }}
                      aria-label={`${m.boss.name} at ${m.place.name}`}
                      className="absolute -translate-y-full grid place-items-start w-11 h-11 active:brightness-125"
                      style={{ left: x, top: y, '--pennant': m.cleared ? '#7a6035' : act.color }}
                    >
                      <span className={m.current ? 'pulse-ring' : ''}>
                        <PixelSprite sprite={PENNANT} size={20} />
                      </span>
                    </button>
                  )
                })}

                {[...SYDNEY.places]
                  .sort((a, b) => a.rank - b.rank)
                  .filter(room)
                  .map((p) => {
                    const { x, y } = at(p)
                    return (
                      <span
                        key={p.id}
                        aria-hidden="true"
                        className={`absolute -translate-x-1/2 flex flex-col items-center pointer-events-none ${
                          DRAWN.has(p.id) ? 'translate-y-1' : '-translate-y-full'
                        }`}
                        style={{ left: x, top: y }}
                      >
                        {!DRAWN.has(p.id) && <PixelSprite sprite={TOWN} size={13} />}
                        <span
                          className="font-pixel text-[6px] leading-none whitespace-nowrap px-1 py-[3px] border mt-[1px]"
                          style={{ color: '#33260f', background: '#f0e3bc', borderColor: '#7a6035' }}
                        >
                          {p.name}
                        </span>
                      </span>
                    )
                  })}
              </>
            )
          }}
        </MapViewport>
        <span
          className="absolute left-3 bottom-3 z-10 grid place-items-center w-9 h-9 border pointer-events-none"
          style={{ background: '#e8d9b4', borderColor: '#2a1e12' }}
          aria-hidden="true"
        >
          <PixelSprite sprite={COMPASS} size={26} />
        </span>
      </Framed>
      <div className="text-[10px] text-ink-faint mt-2.5 leading-relaxed">
        Drag to move, pinch or use + to get closer — go far enough in and the drawing gives way to the streets. Tap a
        pennant for what is waiting there.
      </div>
      {footer}
    </>
  )
}

/** The walks themselves, on a street map rather than on the drawn one. */
function RouteView({ routes }) {
  const [pickedId, setPickedId] = useState('all')
  const shown = pickedId === 'all' ? routes : routes.filter((r) => r.id === pickedId)
  const totalKm = routes.reduce((n, r) => n + r.km, 0)

  return (
    <>
      {/* The map is here whether or not there is a line on it yet — an empty
          street map you can pan is a map; a paragraph explaining that you have
          not walked anywhere is not. */}
      <RouteMap
        routes={shown.map((r) => ({ id: r.id, points: r.points, colour: r.colour }))}
        height={300}
        locate={!routes.length}
        className="border border-line"
      />

      {!routes.length && (
        <p className="text-[11px] text-ink-dim mt-3 leading-relaxed">
          Nothing walked yet. Track a walk, a run or a ride from TRAIN with location switched on, and the line you make
          lands here.
        </p>
      )}

      {routes.length > 0 && (
        <div className="flex items-center justify-between mt-3">
          <span className="font-pixel text-[7px] text-ink-faint">
            {routes.length} {routes.length === 1 ? 'ROUTE' : 'ROUTES'}
          </span>
          <span className="font-mono text-[11px] text-lime">{totalKm.toFixed(1)} km</span>
        </div>
      )}

      {routes.length > 0 && (
      <div className="mt-2 border-t border-line pt-2 space-y-1">
        <button
          onClick={() => setPickedId('all')}
          className="w-full flex items-center gap-2.5 min-h-[44px] px-1 text-left active:brightness-125"
          aria-pressed={pickedId === 'all'}
        >
          <span
            className="w-2.5 h-2.5 shrink-0 border"
            style={{ borderColor: 'var(--color-line-hot)', background: pickedId === 'all' ? 'var(--color-neon)' : 'transparent' }}
          />
          <span className="font-pixel text-[7px] text-ink-dim">EVERYTHING</span>
        </button>
        {routes.map((r) => (
          <button
            key={r.id}
            onClick={() => setPickedId(r.id)}
            className="w-full flex items-center gap-2.5 min-h-[44px] px-1 text-left active:brightness-125"
            aria-pressed={pickedId === r.id}
          >
            <span
              className="w-2.5 h-2.5 shrink-0 border"
              style={{ borderColor: r.colour, background: pickedId === r.id ? r.colour : 'transparent' }}
            />
            <span className="font-pixel text-[7px] text-ink-dim w-[62px] shrink-0">{r.label}</span>
            <span className="font-mono text-[11px] text-ink">{r.km.toFixed(2)} km</span>
            <span className="font-mono text-[10px] text-ink-faint ml-auto">{r.when}</span>
          </button>
        ))}
      </div>
      )}
    </>
  )
}

/** Which of the two maps is on screen. */
function ViewSwitch({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {[
        ['routes', 'YOUR ROUTES'],
        ['world', 'THE WORLD'],
      ].map(([id, label]) => {
        const on = value === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={on}
            className="font-pixel text-[8px] min-h-[44px] border transition-colors active:brightness-125"
            style={{
              color: on ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
              background: on ? 'var(--color-gold)' : 'transparent',
              borderColor: on ? 'var(--color-gold)' : 'var(--color-line)',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The map, opened from the header.
 *
 * It used to be a tab of its own with the explored bar and the boss it points
 * at underneath. Those belong with the map rather than beside it, so they came
 * along when it moved.
 */
export default function MapSheet({ onClose }) {
  const { state } = useGame()
  const revealed = useMemo(() => new Set(state.explored ?? []), [state.explored])
  const coarse = useMemo(() => coarseExplored(revealed), [revealed])
  const [picked, setPicked] = useState(null)
  const [campaign, setCampaign] = useState(false)
  const c = campaignState(state.player, state.campaign)
  const pct = revealed.size / (SYDNEY.w * SYDNEY.h)

  const markers = useMemo(
    () =>
      CAMPAIGN.map((boss) => {
        const p = place(BOSS_SITES[boss.id])
        if (!p) return null
        return {
          boss,
          place: p,
          cleared: c.defeated.includes(boss.id),
          current: c.current?.id === boss.id,
        }
      }).filter(Boolean),
    [c.defeated, c.current],
  )

  const shown = picked ?? markers.find((m) => m.current) ?? markers[0]

  // Every distance session that came back with a trace, newest first.
  const routes = useMemo(
    () =>
      (state.log ?? [])
        .filter((l) => l.detail?.route?.length > 1)
        .slice(0, 12)
        .map((l, i) => ({
          id: l.id,
          points: l.detail.route,
          km: (l.detail.metres ?? 0) / 1000,
          label: (ACTIVITIES.find((a) => a.id === l.activityId)?.name ?? 'SESSION').toUpperCase(),
          when: whenAgo(l.at),
          colour: ROUTE_COLOURS[i % ROUTE_COLOURS.length],
        })),
    [state.log],
  )

  // Opens on the street map. The drawn Sydney is the game's board and it is one
  // tap away, but "where did I walk" is the question the button gets asked.
  const [view, setView] = useState('routes')

  return (
    <>
      <Modal open onClose={onClose} title={view === 'world' ? 'SYDNEY' : 'WHERE YOU WENT'} accent="var(--color-gold)" wide>
        <ViewSwitch value={view} onChange={setView} />
        {view === 'routes' ? (
          <RouteView routes={routes} />
        ) : (
          <BigMap
        revealed={coarse}
        fine={revealed}
        markers={markers}
        onPick={setPicked}
        footer={
          <>
            <div className="mt-3 pt-3 border-t border-line">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[8px] text-ink-faint">SYDNEY EXPLORED</span>
                <span className="font-mono text-[12px] text-lime">{(pct * 100).toFixed(1)}%</span>
              </div>
              <Bar pct={pct} color="var(--color-lime)" height={6} className="mt-2" />
              <div className="text-[11px] text-ink-dim mt-2 leading-snug">
                Ground you have not walked sits under haze. Every kilometre you cover clears more of it, and it stays
                clear.
              </div>
            </div>

            {shown && (
              <div className="mt-3 pt-3 border-t border-line">
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
                {!shown.cleared && (
                  <Btn
                    full
                    size="sm"
                    variant={shown.current ? 'danger' : 'ghost'}
                    className="mt-3"
                    onClick={() => setCampaign(true)}
                  >
                    {shown.current ? 'FIGHT IT' : 'SEE THE ROAD'}
                  </Btn>
                )}
              </div>
            )}
          </>
        }
          />
        )}
      </Modal>
      {campaign && <CampaignSheet onClose={() => setCampaign(false)} />}
    </>
  )
}
