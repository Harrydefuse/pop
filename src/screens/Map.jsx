import { useMemo, useState } from 'react'
import { Bar, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import PixelSprite from '../components/PixelSprite'
import OverviewMap from '../components/OverviewMap'
import MapViewport from '../components/MapViewport'
import { OVER_H, OVER_PX, OVER_W, overCell } from '../game/overview'
import { SYDNEY } from '../game/sydney'
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
          'inset 0 0 0 2px #8a6a3f, inset 0 0 0 5px #2a1e12, inset 0 0 0 6px #c9a227, 3px 3px 0 0 rgba(0,0,0,0.55)',
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
      {children}
    </div>
  )
}

/** The tab shows a picture of it. Names, flags and landmarks are for when it is
 *  open — at thumbnail size they would be a smudge. */
function Thumb({ onOpen }) {
  return (
    <Framed pad={7}>
      <button
        onClick={onOpen}
        className="relative block w-full overflow-hidden active:brightness-110"
        aria-label="Open the map of Sydney"
      >
        <OverviewMap />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1.5 bg-[#2a1e12]/85">
          <span className="font-pixel text-[7px]" style={{ color: '#e8d9b4' }}>
            SYDNEY
          </span>
          <span className="font-pixel text-[6px]" style={{ color: '#c9a227' }}>
            TAP TO OPEN
          </span>
        </span>
      </button>
    </Framed>
  )
}

/**
 * The map, open. Same drawing at three times the size so it is chunky the way
 * the reference is, with every town named, the landmarks in place, and a
 * pennant on every boss you have not put down yet.
 */
function BigMap({ onClose, markers, onPick }) {
  return (
    <Modal open onClose={onClose} title="SYDNEY" accent="var(--color-gold)" wide>
      <Framed pad={6}>
        <MapViewport
          w={BIG}
          h={BIG}
          label="Sydney"
          className="w-full aspect-square bg-[#2a1e12]"
          content={<OverviewMap style={{ width: BIG, height: BIG }} />}
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
              if (taken.some((t) => Math.abs(t.x - x) < 78 && Math.abs(t.y - y) < 21)) return false
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
        Drag to move, pinch or use + to get closer. Tap a pennant for what is waiting there.
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

  return (
    <div className="p-3 space-y-3">
      <Thumb onOpen={() => setOpen(true)} />

      {open && (
        <BigMap
          onClose={() => setOpen(false)}
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
