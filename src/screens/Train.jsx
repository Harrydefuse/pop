import { useEffect, useRef, useState } from 'react'
import { Bar, Btn, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { useGame } from '../game/useGame'
import {
  INTERVAL,
  LIFTS,
  MIN_SESSION_S,
  SPLIT_M,
  TRACKED,
  WEIGHT_STEP,
  byLift,
  clock,
  elapsedMs,
  intervalPhase,
  modeOf,
  pace,
  sessionAmount,
  setTotals,
  splitPace,
  fixStep,
} from '../game/session'
import { ACTIVITIES } from '../game/config'
import { minutesOf, resolveActivity } from '../game/engine'
import { alpha } from '../game/color'

/** What the tracker will actually do, said on the card you press. A run and a
 *  gym session are not measured the same way and the choice should say so. */
const MODE_NOTE = {
  distance: 'GPS · pace · splits',
  strength: 'sets and reps',
  interval: 'work / rest rounds',
  steady: 'timed',
}

/** Distance activities are the ones worth asking for a GPS fix. */
const WANTS_GPS = new Set(['walk', 'run', 'ride'])

/** A wall of twelve identical cards is a list, not a choice. Colour groups them
 *  by what they are for, which is the thing you are actually picking between. */
const TINT = {
  walk: 'var(--color-lime)', run: 'var(--color-lime)', ride: 'var(--color-lime)',
  swim: 'var(--color-lime)', hiit: 'var(--color-lime)', sport: 'var(--color-lime)',
  gym: 'var(--color-gold)', bodyweight: 'var(--color-gold)',
  mobility: 'var(--color-cyan)', sleep: 'var(--color-cyan)',
  aim: 'var(--color-neon)', vod: 'var(--color-neon)',
}

/**
 * Watches where you actually are, for as long as a session is running.
 *
 * Kept deliberately forgiving: geolocation is refused more often than it is
 * granted — a sandboxed frame, plain http, a flat denial — and none of that
 * should stop a workout. Without a fix the clock still runs and the session
 * still counts, it just cannot say how far.
 */
function useTrace(session, onFix) {
  const [status, setStatus] = useState('off')
  const last = useRef(null)
  const cb = useRef(onFix)
  cb.current = onFix

  const active = Boolean(session) && !session.paused && WANTS_GPS.has(session.activityId)

  useEffect(() => {
    if (!active) {
      last.current = null
      setStatus('off')
      return
    }
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('waiting')
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus('on')
        const now = { lat: pos.coords.latitude, lon: pos.coords.longitude, t: pos.timestamp }
        const prev = last.current
        const step = fixStep(prev, now)
        if (step.anchor) last.current = now
        cb.current(now, step.metres, step.keep)
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [active])

  return status
}

const GPS_NOTE = {
  on: 'Following your route',
  waiting: 'Looking for a signal',
  denied: 'No location — counting by time',
  unavailable: 'No location on this device — counting by time',
  off: null,
}

/**
 * The trace, drawn as you make it.
 *
 * A distance session already collects every fix so the fog can be lifted; this
 * puts the same points on screen while you are still running, which is the
 * difference between a stopwatch and a tracker. Colour is read back off the
 * element rather than written in, so the line follows the theme.
 */
function RouteTrace({ points }) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const w = Math.round(cv.clientWidth)
    const h = Math.round(cv.clientHeight)
    if (!w || !h) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = w * dpr
    cv.height = h * dpr
    const g = cv.getContext('2d')
    g.scale(dpr, dpr)
    g.clearRect(0, 0, w, h)
    if (points.length < 2) return

    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity
    for (const pt of points) {
      minLat = Math.min(minLat, pt.lat); maxLat = Math.max(maxLat, pt.lat)
      minLon = Math.min(minLon, pt.lon); maxLon = Math.max(maxLon, pt.lon)
    }
    // Latitude and longitude are not the same distance apart on the ground, so
    // the longitude span is squeezed by the cosine of where you are standing.
    // Without it a north-south run comes out looking like a diagonal.
    const squeeze = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
    const spanLat = Math.max(1e-6, maxLat - minLat)
    const spanLon = Math.max(1e-6, (maxLon - minLon) * squeeze)
    const pad = 10
    const k = Math.min((w - pad * 2) / spanLon, (h - pad * 2) / spanLat)
    const ox = (w - spanLon * k) / 2
    const oy = (h - spanLat * k) / 2
    const X = (pt) => ox + (pt.lon - minLon) * squeeze * k
    const Y = (pt) => oy + (maxLat - pt.lat) * k

    const ink = getComputedStyle(cv).color
    g.lineWidth = 3
    g.lineJoin = 'round'
    g.lineCap = 'round'
    g.strokeStyle = ink
    g.beginPath()
    g.moveTo(X(points[0]), Y(points[0]))
    for (let i = 1; i < points.length; i++) g.lineTo(X(points[i]), Y(points[i]))
    g.stroke()

    // Where you set off, and where you are now.
    const dot = (pt, fill) => {
      g.fillStyle = fill
      g.fillRect(Math.round(X(pt)) - 3, Math.round(Y(pt)) - 3, 6, 6)
    }
    dot(points[0], getComputedStyle(cv).getPropertyValue('--color-ink-faint').trim() || ink)
    dot(points[points.length - 1], ink)
  }, [points])

  return <canvas ref={ref} className="w-full h-[132px] block" style={{ color: 'var(--color-lime)' }} aria-hidden="true" />
}

/** Distance, pace, and the kilometres behind you. */
function DistanceReadout({ session, ms }) {
  const km = session.metres / 1000
  const p = pace(ms, session.metres)
  const splits = session.splits ?? []
  const best = splits.reduce((b, sp) => Math.min(b, sp.ms), Infinity)
  const intoKm = (session.metres % SPLIT_M) / SPLIT_M

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Stat label="DISTANCE" value={`${km.toFixed(2)} km`} />
        <Stat label="PACE" value={p ?? '—'} tone="var(--color-lime)" />
      </div>

      {/* How far into the current kilometre you are. A run is a sequence of
          small finishes, and this is the one you are currently chasing. */}
      <div className="mt-3 text-left">
        <div className="flex justify-between items-baseline">
          <span className="font-pixel text-[6px] text-ink-faint">KM {splits.length + 1}</span>
          <span className="font-mono text-[10px] text-ink-faint">{Math.round(intoKm * 100)}%</span>
        </div>
        <Bar pct={intoKm} height={6} color="var(--color-lime)" className="mt-1" />
      </div>

      {splits.length > 0 && (
        <div className="mt-3 border-t border-line pt-3 text-left">
          <div className="font-pixel text-[6px] text-ink-faint mb-2">SPLITS</div>
          <div className="space-y-1">
            {splits.slice(-6).map((sp) => (
              <div key={sp.km} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-ink-faint w-7 shrink-0">{sp.km}k</span>
                <span className="h-2 border border-line flex-1 overflow-hidden">
                  <span
                    className="block h-full"
                    style={{ width: `${Math.max(12, (best / sp.ms) * 100)}%`, background: sp.ms === best ? 'var(--color-lime)' : 'var(--color-line-hot)' }}
                  />
                </span>
                <span className="font-mono text-[11px] text-ink w-[52px] text-right shrink-0">{splitPace(sp.ms)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/** A number you change with your thumbs rather than a keyboard. */
function Stepper({ label, value, onChange, step = 1, min = 0, max = 999, suffix = '' }) {
  return (
    <div className="border border-line p-2">
      <div className="font-pixel text-[6px] text-ink-faint">{label}</div>
      <div className="flex items-center gap-1 mt-1">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 min-h-[44px] font-pixel text-[12px] text-ink-dim active:text-ink"
          aria-label={`Less ${label.toLowerCase()}`}
        >
          −
        </button>
        <span className="font-mono text-[18px] text-ink flex-1 text-center tabular-nums">
          {value}
          {suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-9 min-h-[44px] font-pixel text-[12px] text-ink-dim active:text-ink"
          aria-label={`More ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

/**
 * What you lifted, how many times, how heavy.
 *
 * A clock does not describe a gym session, and neither does a rep count on its
 * own — five by five at a hundred kilos and five by five at forty are the same
 * row otherwise. None of it earns XP: that still comes off the clock, so a
 * typed weight cannot be turned into a level. It is a training record.
 */
function StrengthReadout({ session, ms }) {
  const { sessionSet, sessionUndoSet } = useGame()
  const [lift, setLift] = useState(session.lift ?? LIFTS[0])
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(40)
  const [pickingLift, setPickingLift] = useState(false)
  const sets = session.sets ?? []
  const totals = setTotals(sets)
  const perLift = byLift(sets)

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="SETS" value={totals.sets} />
        <Stat label="REPS" value={totals.reps} />
        <Stat label="VOLUME" value={totals.volume ? `${Math.round(totals.volume)}kg` : '—'} tone="var(--color-gold)" />
      </div>

      {/* The lift comes off a short list rather than a text field: free text
          turns the log into a pile of spellings of "bench press" that nothing
          can add up. */}
      <button
        onClick={() => setPickingLift((v) => !v)}
        aria-expanded={pickingLift}
        className="w-full min-h-[44px] border border-line mt-3 px-3 flex items-center justify-between active:brightness-125"
      >
        <span className="font-pixel text-[6px] text-ink-faint">EXERCISE</span>
        <span className="font-mono text-[13px] text-ink truncate ml-2">{lift}</span>
      </button>

      {pickingLift && (
        <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-[188px] overflow-y-auto scroll-thin">
          {LIFTS.map((name) => (
            <button
              key={name}
              onClick={() => {
                setLift(name)
                setPickingLift(false)
              }}
              aria-pressed={lift === name}
              className="font-mono text-[11px] min-h-[44px] px-2 border text-left truncate active:brightness-125"
              style={{
                color: lift === name ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
                background: lift === name ? 'var(--color-gold)' : 'transparent',
                borderColor: lift === name ? 'var(--color-gold)' : 'var(--color-line)',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Stepper label="REPS" value={reps} onChange={setReps} min={1} max={500} />
        <Stepper
          label="WEIGHT"
          value={weight}
          onChange={setWeight}
          step={WEIGHT_STEP}
          max={1000}
          suffix={weight === 0 ? '' : 'kg'}
        />
      </div>
      {weight === 0 && <div className="font-mono text-[10px] text-ink-faint mt-1">Bodyweight — reps only.</div>}

      <Btn
        full
        className="mt-2"
        onClick={() => sessionSet(lift, reps, weight)}
        style={{ background: 'var(--color-gold)', borderColor: 'var(--color-gold)', color: 'var(--color-on-accent)' }}
      >
        LOG {reps} × {weight === 0 ? 'BODYWEIGHT' : `${weight}KG`}
      </Btn>

      {sets.length > 0 && (
        <div className="mt-3 border-t border-line pt-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[6px] text-ink-faint">TODAY</span>
            <button onClick={sessionUndoSet} className="font-pixel text-[6px] text-ink-faint min-h-[44px] px-2 active:text-danger">
              UNDO LAST
            </button>
          </div>

          {/* Grouped by lift, because that is how a session is actually
              remembered: four exercises, not nineteen numbered sets. */}
          <div className="space-y-2.5">
            {perLift.map((g) => (
              <div key={g.lift}>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[12px] text-ink truncate">{g.lift}</span>
                  <span className="font-mono text-[10px] text-ink-faint ml-auto shrink-0">
                    {g.volume ? `${Math.round(g.volume)}kg` : `${g.reps} reps`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sets
                    .filter((set) => (set.lift ?? 'Other') === g.lift)
                    .map((set, i) => (
                      <span
                        key={`${g.lift}-${set.at}-${i}`}
                        className="font-mono text-[10px] px-1.5 py-0.5 border border-line text-ink-dim"
                      >
                        {set.reps}
                        {set.weight ? ` × ${set.weight}kg` : ''}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="font-mono text-[10px] text-ink-faint mt-3">{clock(ms)} under the bar</div>
    </>
  )
}

/** Work, rest, repeat — read off the clock rather than counted by hand. */
function IntervalReadout({ session, ms }) {
  const { sessionInterval } = useGame()
  const work = session.work ?? INTERVAL.work
  const rest = session.rest ?? INTERVAL.rest
  const at = intervalPhase(ms, work, rest)
  const working = at.phase === 'work'
  const tone = working ? 'var(--color-lime)' : 'var(--color-cyan)'
  const span = working ? work : rest
  const setup = at.completed === 0

  return (
    <>
      <div className="mt-4 border p-3" style={{ borderColor: tone, background: alpha(tone, 10) }}>
        <div className="font-pixel text-[8px]" style={{ color: tone }}>
          {working ? 'WORK' : 'REST'}
        </div>
        <div className="font-mono text-[40px] leading-none tabular-nums mt-1" style={{ color: tone }}>
          {at.left}
        </div>
        <Bar pct={1 - at.left / span} height={6} color={tone} className="mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Stat label="ROUND" value={at.round} />
        <Stat label="DONE" value={at.completed} tone={tone} />
      </div>

      {/* Only before the first round closes. Changing the block after that
          would re-cut every round already behind you, because the schedule is
          derived from the clock rather than recorded. */}
      {setup && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            ['WORK', work, (n) => sessionInterval(n, rest)],
            ['REST', rest, (n) => sessionInterval(work, n)],
          ].map(([label, value, set]) => (
            <div key={label} className="border border-line p-2">
              <div className="font-pixel text-[6px] text-ink-faint">{label}</div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => set(value - 5)}
                  className="w-9 min-h-[44px] font-pixel text-[11px] text-ink-dim active:text-ink"
                  aria-label={`Five seconds less ${label.toLowerCase()}`}
                >
                  −
                </button>
                <span className="font-mono text-[15px] text-ink flex-1 text-center tabular-nums">{value}s</span>
                <button
                  onClick={() => set(value + 5)}
                  className="w-9 min-h-[44px] font-pixel text-[11px] text-ink-dim active:text-ink"
                  aria-label={`Five seconds more ${label.toLowerCase()}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/** One number, for the activities where one number is the honest answer. */
function SteadyReadout({ act, ms, preview }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      <Stat label="COUNTS AS" value={`${sessionAmount(act, ms)} ${act.unit}`} />
      <Stat label="XP SO FAR" value={`+${preview.xp}`} tone="var(--color-lime)" />
    </div>
  )
}

function Stat({ label, value, tone = 'var(--color-ink)' }) {
  return (
    <div className="border border-line p-2.5">
      <div className="font-pixel text-[6px] text-ink-faint">{label}</div>
      <div className="font-mono text-[16px] mt-1 tabular-nums" style={{ color: tone }}>
        {value}
      </div>
    </div>
  )
}

/** The instrument for whatever you are doing. Everything the log needs is
 *  read off it. */
function Running({ session, act }) {
  const { pauseSession, resumeSession, finishSession, discardSession, sessionFix, state } = useGame()
  const [, tick] = useState(0)
  const moved = useRef(Date.now())
  const auto = useRef(false)
  const gps = useTrace(session, (point, metres, keep) => {
    if (metres > 0) moved.current = Date.now()
    sessionFix(point, metres, keep)
  })
  const mode = modeOf(act.id)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Standing at a crossing should not cost you a pace figure, and a coffee
  // stop should not count as running. With a fix coming in, a still minute and
  // a half pauses the clock and the next step you take starts it again. Only
  // with a fix: without one there is no way to tell a treadmill from a sofa,
  // and pausing someone's session on a guess is worse than counting it.
  useEffect(() => {
    if (mode !== 'distance' || gps !== 'on') return
    if (!session.paused && Date.now() - moved.current > 90000) {
      auto.current = true
      pauseSession()
    } else if (session.paused && auto.current && Date.now() - moved.current < 4000) {
      auto.current = false
      resumeSession()
    }
  })

  const ms = elapsedMs(session)
  const secs = Math.floor(ms / 1000)
  const ready = secs >= MIN_SESSION_S
  const amount = sessionAmount(act, ms, session.metres)
  const preview = resolveActivity(state.player, { activityId: act.id, amount, verified: true })
  const tint = TINT[act.id] ?? 'var(--color-lime)'

  return (
    <div className="p-3 space-y-3">
      <Panel className="p-4 text-center" accent={tint}>
        <SectionTitle color={tint}>
          {session.paused ? (auto.current ? 'AUTO-PAUSED' : 'PAUSED') : act.name.toUpperCase()}
        </SectionTitle>
        <div className="font-mono text-[44px] leading-none text-ink tabular-nums" aria-live="off">
          {clock(ms)}
        </div>

        {mode === 'distance' && <DistanceReadout session={session} ms={ms} />}
        {mode === 'strength' && <StrengthReadout session={session} ms={ms} />}
        {mode === 'interval' && <IntervalReadout session={session} ms={ms} />}
        {mode === 'steady' && <SteadyReadout act={act} ms={ms} preview={preview} />}

        {GPS_NOTE[gps] && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Icon name="pin" size={10} color={gps === 'on' ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
            <span className="text-[11px] text-ink-faint">{GPS_NOTE[gps]}</span>
          </div>
        )}

        {!ready && (
          <div className="text-[11px] text-ink-faint mt-3">
            Sessions count from one minute. {MIN_SESSION_S - secs}s to go.
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {session.paused ? (
            <Btn
              full
              onClick={() => {
                auto.current = false
                moved.current = Date.now()
                resumeSession()
              }}
            >
              RESUME
            </Btn>
          ) : (
            <Btn full variant="ghost" onClick={pauseSession}>
              PAUSE
            </Btn>
          )}
          <Btn
            full
            disabled={!ready}
            onClick={finishSession}
            style={ready ? { background: 'var(--color-lime)', borderColor: 'var(--color-lime)', color: 'var(--color-on-accent)' } : undefined}
          >
            FINISH
          </Btn>
        </div>
        <button
          onClick={discardSession}
          className="font-pixel text-[7px] text-ink-faint mt-3 min-h-[44px] w-full active:text-danger"
        >
          THROW IT AWAY
        </button>
      </Panel>

      {mode === 'distance' && (
        <Panel corners={false} className="p-3">
          <div className="font-pixel text-[7px] text-ink-faint">YOUR ROUTE</div>
          {session.points.length > 1 ? (
            <RouteTrace points={session.points} />
          ) : (
            <div className="h-[132px] grid place-items-center text-[11px] text-ink-faint text-center px-4">
              {gps === 'on' || gps === 'waiting'
                ? 'The line appears once you have covered some ground.'
                : 'No location, so there is no line to draw. The clock still counts.'}
            </div>
          )}
        </Panel>
      )}

      <Panel corners={false} className="p-3">
        <div className="font-pixel text-[7px] text-ink-faint">WHAT THIS IS WORTH</div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-mono text-[18px] text-lime">+{preview.xp}</span>
          <span className="text-[11px] text-ink-dim">XP</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {Object.entries(preview.statGains).map(([k, v]) => (
            <span key={k} className="font-mono text-[11px] text-ink-dim">
              {k} +{v}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-ink-faint mt-3 leading-relaxed">
          It keeps running if you close the app — the clock is a start time, not a timer, so locking your phone mid-run
          costs you nothing.
        </div>
      </Panel>
    </div>
  )
}

/** What the session actually was, in one line, from what its mode recorded. */
function detailLine(detail) {
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  if (!detail) return null
  if (detail.mode === 'strength') {
    const named = (detail.lifts ?? []).slice(0, 2).map((g) => g.lift).join(', ')
    const more = (detail.lifts?.length ?? 0) > 2 ? ` +${detail.lifts.length - 2}` : ''
    const volume = detail.volume ? ` · ${Math.round(detail.volume).toLocaleString()} kg` : ''
    return `${plural(detail.sets, 'set')}${volume}${named ? ` · ${named}${more}` : ''}`
  }
  if (detail.mode === 'interval') return `${plural(detail.rounds, 'round')} · ${detail.work}s on ${detail.rest}s off`
  if (detail.mode === 'distance' && detail.splits?.length) {
    return `${plural(detail.splits.length, 'split')} · best ${splitPace(Math.min(...detail.splits))} /km`
  }
  return null
}

/** How long ago, in the words you would use out loud. */
function ago(ms) {
  const mins = Math.round((Date.now() - ms) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

/**
 * What you have actually done.
 *
 * Every session was already being recorded and nothing showed it, which made
 * the app feel like it forgot you the moment you stopped the clock. The week is
 * the number people check; the list underneath is the proof behind it.
 */
function History({ log }) {
  const week = Date.now() - 7 * 24 * 3600 * 1000
  const recent = log.slice(0, 12)
  const totals = log
    .filter((l) => l.at >= week)
    .reduce(
      (acc, l) => {
        const act = ACTIVITIES.find((a) => a.id === l.activityId)
        if (!act) return acc
        acc.sessions += 1
        acc.xp += l.xp
        acc.minutes += minutesOf(act, l.amount)
        if (act.unit === 'km') acc.km += l.amount
        return acc
      },
      { sessions: 0, xp: 0, minutes: 0, km: 0 },
    )

  if (!log.length) {
    return (
      <div>
        <SectionTitle>YOUR SESSIONS</SectionTitle>
        <Panel corners={false} className="p-4">
          <div className="text-[11px] text-ink-dim text-center leading-snug">
            Nothing here yet. Start something above and it lands here the moment you stop the clock.
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div>
      <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">last 7 days</span>}>
        YOUR SESSIONS
      </SectionTitle>
      <Panel corners={false} className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            [totals.sessions, 'SESSIONS'],
            [Math.round(totals.minutes), 'MINUTES'],
            [totals.km ? totals.km.toFixed(1) : '0', 'KM'],
            [totals.xp, 'XP'],
          ].map(([n, label]) => (
            <div key={label} className="border border-line p-2 text-center">
              <div className="font-mono text-[15px] text-ink tabular-nums">{n}</div>
              <div className="font-pixel text-[6px] text-ink-faint mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-line space-y-1.5">
          {recent.map((l) => {
            const act = ACTIVITIES.find((a) => a.id === l.activityId)
            if (!act) return null
            const detail = detailLine(l.detail)
            return (
              <div key={l.id}>
                <div className="flex items-center gap-2.5">
                  <Icon name={act.icon} size={12} color={TINT[act.id] ?? 'var(--color-ink-faint)'} />
                  <span className="font-pixel text-[7px] text-ink-dim w-[74px] shrink-0">{act.name.toUpperCase()}</span>
                  <span className="font-mono text-[11px] text-ink">
                    {l.amount} {l.amount === 1 ? act.unit.replace(/s$/, '') : act.unit}
                  </span>
                  <span className="font-mono text-[11px] text-lime ml-auto">+{l.xp}</span>
                  <span className="font-mono text-[10px] text-ink-faint w-[62px] text-right shrink-0">{ago(l.at)}</span>
                </div>
                {/* The amount is one number and every session collapses into
                    it. This is the part worth reading back. */}
                {detail && <div className="font-mono text-[10px] text-ink-faint ml-[24px] mb-0.5">{detail}</div>}
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/** Pick something to do. */
function Pick() {
  const { state, startSession } = useGame()
  return (
    <div className="p-3 space-y-3">
      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">the app counts it</span>}>
          WHAT ARE YOU DOING?
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {TRACKED.map((a) => (
            <button
              key={a.id}
              onClick={() => startSession(a.id)}
              className="text-left active:brightness-125"
              aria-label={`Start a ${a.name} session`}
            >
              <Panel corners={false} className="p-2.5 h-full" style={{ borderColor: alpha(TINT[a.id], 45) }}>
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid place-items-center w-11 h-11 shrink-0 border"
                    style={{ borderColor: alpha(TINT[a.id], 55), background: alpha(TINT[a.id], 10) }}
                  >
                    <Icon name={a.icon} size={20} color={TINT[a.id]} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-pixel text-[8px]" style={{ color: TINT[a.id] }}>
                      {a.name.toUpperCase()}
                    </div>
                    <div className="font-mono text-[10px] text-ink-faint mt-1">
                      {a.xp} XP / {a.per} {a.per === 1 ? a.unit.replace(/s$/, '') : a.unit}
                    </div>
                    <div className="font-mono text-[9px] text-ink-faint mt-0.5 truncate">{MODE_NOTE[modeOf(a.id)]}</div>
                  </div>
                </div>
              </Panel>
            </button>
          ))}
        </div>
      </div>

      <History log={state.log} />
    </div>
  )
}

export default function Train() {
  const { state } = useGame()
  const session = state.session
  const act = session && TRACKED.find((a) => a.id === session.activityId)
  return session && act ? <Running session={session} act={act} /> : <Pick />
}

/** A running session follows you around the app, so you never have to come
 *  back here to stop the clock. */
export function SessionBar({ onOpen }) {
  const { state } = useGame()
  const [, tick] = useState(0)
  const session = state.session

  useEffect(() => {
    if (!session) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [session])

  if (!session) return null
  const act = TRACKED.find((a) => a.id === session.activityId)
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 px-3 min-h-[44px] border-t border-line bg-panel active:brightness-125"
    >
      <span className={`w-2 h-2 shrink-0 ${session.paused ? '' : 'pulse-ring'}`} style={{ background: 'var(--color-lime)' }} />
      <span className="font-pixel text-[7px] text-ink-dim">{act?.name.toUpperCase()}</span>
      <span className="font-mono text-[13px] text-lime ml-auto tabular-nums">{clock(elapsedMs(session))}</span>
      <Icon name="chevron" size={10} color="var(--color-ink-faint)" />
    </button>
  )
}
