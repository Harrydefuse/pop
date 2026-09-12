import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import ExercisePicker from '../components/ExercisePicker'
import StreakFlame from '../components/StreakFlame'
import { BossArt, HeroView, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import {
  INTERVAL,
  MIN_SESSION_S,
  SPLIT_M,
  TRACKED,
  WEIGHT_STEP,
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
import {
  campaignState,
  classById,
  fmtFull,
  formOf,
  minutesOf,
  rankFor,
  resolveActivity,
  powerScore,
  streakTier,
  wornGear,
  xpToNext,
} from '../game/engine'
import { actById } from '../game/campaign'
import { WEEKS_KEPT, lastPlan, liftBoard, liftSeries, topSet, weekOverWeek, weekSeries } from '../game/progress'
import { EFFORT_SLOTS, effortList, pinnedEfforts } from '../game/efforts'
import { MUSCLES, muscleOf, muscleSplit, neglected } from '../game/exercises'
import { guessActivity, readWorkoutFile } from '../game/importFile'
import { alpha } from '../game/color'

/** One empty array, shared: `?? []` builds a new one every render, and every
 *  memo downstream of it then runs every render too. */
const NONE = []

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
    // Browsers refuse location outright on an insecure page, and the refusal
    // looks identical to a denied permission from in here. Saying which it is
    // is the difference between "grant it" and "you cannot from this URL".
    if (window.isSecureContext === false) {
      setStatus('insecure')
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
  denied: 'Location is off — allow it to draw the route. The clock still counts.',
  unavailable: 'This browser will not share location — counting by time.',
  insecure: 'Location needs a secure page (https) — counting by time.',
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
          <span className="font-display text-[11px] text-ink-faint">KM {splits.length + 1}</span>
          <span className="text-[14px] text-ink-faint">{Math.round(intoKm * 100)}%</span>
        </div>
        <Bar pct={intoKm} height={6} color="var(--color-lime)" className="mt-1" />
      </div>

      {splits.length > 0 && (
        <div className="mt-3 border-t border-line pt-3 text-left">
          <div className="font-display text-[11px] text-ink-faint mb-2">Splits</div>
          <div className="space-y-1">
            {splits.slice(-6).map((sp) => (
              <div key={sp.km} className="flex items-center gap-2">
                <span className="text-[14px] text-ink-faint w-7 shrink-0">{sp.km}k</span>
                <span className="h-2 border border-line flex-1 overflow-hidden">
                  <span
                    className="block h-full"
                    style={{ width: `${Math.max(12, (best / sp.ms) * 100)}%`, background: sp.ms === best ? 'var(--color-lime)' : 'var(--color-line-hot)' }}
                  />
                </span>
                <span className="text-[14px] text-ink w-[52px] text-right shrink-0">{splitPace(sp.ms)}</span>
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
      <div className="font-display text-[11px] text-ink-faint">{label}</div>
      <div className="flex items-center gap-1 mt-1">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 min-h-[44px] font-display text-[20px] text-ink-dim active:text-ink"
          aria-label={`Less ${label.toLowerCase()}`}
        >
          −
        </button>
        <span className="text-[18px] text-ink flex-1 text-center tabular-nums">
          {value}
          {suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-9 min-h-[44px] font-display text-[20px] text-ink-dim active:text-ink"
          aria-label={`More ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

/** How long to sit down for, and the choices offered. */
const REST_S = [60, 90, 120, 180]

/**
 * The clock between sets.
 *
 * Counted off the last set's own timestamp rather than a ticking counter of its
 * own, so it survives switching tabs, closing the app and coming back — the set
 * already records when it happened, and a rest timer that forgets the moment
 * you check a message is a rest timer nobody uses.
 */
function RestClock({ sets, ms, length, onLength }) {
  const last = sets[sets.length - 1]
  const rest = last ? Math.max(0, length - Math.round((ms - last.at) / 1000)) : null
  const done = rest === 0
  if (!last) return null
  return (
    <div
      className="mt-3 rounded-[var(--radius-sm)] px-3.5 py-3"
      style={{ background: done ? 'color-mix(in srgb, var(--color-lime) 14%, transparent)' : 'var(--color-panel-2)' }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="label text-ink-faint">{done ? 'Rest is up' : 'Resting'}</div>
          <div className="figure text-[26px] mt-1" style={{ color: done ? 'var(--color-lime)' : 'var(--color-ink)' }}>
            {done ? 'Go' : clock(rest * 1000)}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {REST_S.map((n) => (
            <button
              key={n}
              onClick={() => onLength(n)}
              aria-pressed={length === n}
              className="label min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] transition-colors"
              style={{
                background: length === n ? 'var(--color-panel)' : 'transparent',
                color: length === n ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                boxShadow: length === n ? 'var(--elev)' : undefined,
              }}
            >
              {n}s
            </button>
          ))}
        </div>
      </div>
      {!done && (
        <div className="mt-2.5">
          <Bar pct={1 - rest / length} color="var(--color-neon)" height={4} />
        </div>
      )}
    </div>
  )
}

/**
 * One exercise, as a card you fill in.
 *
 * The old screen asked you to hold three things in your head at once: which
 * exercise the picker was pointing at, what the steppers currently said, and
 * where the set you just logged had gone. This is the shape every gym app
 * converged on instead, because it removes all three questions — the exercise
 * is the heading, the sets are under it, and the next one goes on the end.
 *
 * Only the card you are working on opens its steppers. Five exercises with five
 * sets of controls is the same wall of numbers in a different arrangement.
 */
function ExerciseCard({ name, sets, last, best, custom, open, onOpen, onAdd, onUndo }) {
  const muscle = MUSCLES.find((m) => m.id === muscleOf(name, custom))
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(40)

  // Opens on the heaviest set you did of it last time, so the common case —
  // repeat, or add a little — is already dialled in before you touch anything.
  useEffect(() => {
    const top = topSet(sets.length ? sets : (last?.sets ?? []))
    if (!top) return
    setReps(top.reps)
    setWeight(top.weight ?? 0)
    // Only when the card opens, or typing over it mid-set would fight you.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name])

  const volume = sets.reduce((n, s) => n + s.reps * (s.weight ?? 0), 0)

  return (
    <Panel className="overflow-hidden">
      <button
        onClick={onOpen}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3.5 py-3 min-h-[56px] text-left active:bg-panel-2"
      >
        <span
          className="w-1.5 h-8 shrink-0 rounded-full"
          style={{ background: muscle?.tone ?? 'var(--color-line-hot)' }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16px] text-ink truncate">{name}</span>
          <span className="block label text-ink-faint mt-1">
            {sets.length
              ? `${sets.length} ${sets.length === 1 ? 'set' : 'sets'}${volume ? ` · ${Math.round(volume).toLocaleString()}kg` : ''}`
              : last
                ? `last time ${since(last.at)}`
                : 'nothing logged yet'}
          </span>
        </span>
        {best ? <span className="label text-ink-faint shrink-0">{Math.round(best.e1rm)}kg est.</span> : null}
      </button>

      {/* The sets themselves, numbered the way a notebook would number them. */}
      {sets.length > 0 && (
        <div className="px-3.5 pb-2">
          {sets.map((s, i) => (
            <div key={`${s.at}-${i}`} className="flex items-center gap-3 py-1.5 border-t border-line">
              <span className="figure text-[13px] text-ink-faint w-4 shrink-0">{i + 1}</span>
              <span className="text-[15px] text-ink">
                {s.weight ? `${s.weight} kg × ${s.reps}` : `${s.reps} reps`}
              </span>
              {i === sets.length - 1 && (
                <button
                  onClick={onUndo}
                  className="label text-ink-faint ml-auto min-h-[44px] px-2 active:text-danger"
                  aria-label={`Undo the last set of ${name}`}
                >
                  Undo
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-line">
          {last?.sets?.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-1.5 mb-2.5">
              <span className="label text-ink-faint">Last time</span>
              {last.sets.map((s, i) => (
                <span key={i} className="label px-2 py-1 rounded-full bg-panel-2 text-ink-dim">
                  {s.weight ? `${s.weight} × ${s.reps}` : `${s.reps} reps`}
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
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
          {weight === 0 && <div className="text-[13px] text-ink-faint mt-1.5">Bodyweight — reps only.</div>}
          <Btn full variant="go" className="mt-2" onClick={() => onAdd(reps, weight)}>
            {weight === 0 ? `Add ${reps} reps` : `Add ${weight}kg × ${reps}`}
          </Btn>
        </div>
      )}
    </Panel>
  )
}

/**
 * A gym session, as a list you build.
 *
 * Everything that is not the list moved out: the clock and the controls are in
 * the bar above, the rest timer sits under it, and what the session is worth
 * waits until the end where it belongs. What is left is the exercises, in the
 * order you did them.
 */
function StrengthReadout({ session, ms }) {
  const { state, sessionSet, sessionAddLift, sessionUndoSet, saveRoutine } = useGame()
  const [picking, setPicking] = useState(false)
  const [rest, setRest] = useState(90)
  const [naming, setNaming] = useState(null)
  const sets = session.sets ?? NONE
  const plan = session.plan ?? NONE
  // A session started from a routine opens on its first exercise: the answer to
  // "what am I doing" is already known and should not need a tap.
  const [open, setOpen] = useState(session.lift ?? plan[0] ?? null)

  // The session's running order: what it was planned with, plus anything that
  // got logged without being planned.
  const order = useMemo(() => {
    const seen = [...plan]
    for (const s of sets) if (s.lift && !seen.includes(s.lift)) seen.push(s.lift)
    return seen
  }, [plan, sets])

  const done = useMemo(() => [...new Set(sets.map((s) => s.lift))], [sets])
  const recent = useMemo(() => {
    const out = [...done]
    for (const entry of state.log ?? NONE) {
      for (const g of entry.detail?.lifts ?? NONE) if (!out.includes(g.lift)) out.push(g.lift)
      if (out.length >= 8) break
    }
    return out
  }, [done, state.log])

  const add = (lift, reps, weight) => {
    sessionSet(lift, reps, weight)
    setOpen(lift)
  }

  return (
    <>
      <RestClock sets={sets} ms={ms} length={rest} onLength={setRest} />

      {order.length === 0 && (
        <Panel className="p-5 text-center">
          <div className="font-display text-[17px] text-ink">Nothing in this one yet</div>
          <div className="text-[14px] text-ink-dim mt-2 leading-snug">
            Add the first exercise and the sets go under it. The clock is already running.
          </div>
        </Panel>
      )}

      {order.map((name) => (
        <ExerciseCard
          key={name}
          name={name}
          sets={sets.filter((s) => (s.lift ?? 'Other') === name)}
          last={state.lastSets?.[name]}
          best={state.records?.[name]}
          custom={state.exercises ?? NONE}
          open={open === name}
          onOpen={() => setOpen(open === name ? null : name)}
          onAdd={(reps, weight) => add(name, reps, weight)}
          onUndo={sessionUndoSet}
        />
      ))}

      <Btn full variant="ghost" onClick={() => setPicking(true)}>
        <Icon name="plus" size={12} color="currentColor" /> Add an exercise
      </Btn>

      {/* Saveable once there is a shape to save. One lift is not a routine. */}
      {done.length > 1 &&
        (naming === null ? (
          <Btn variant="ghost" full size="sm" onClick={() => setNaming(done[0])}>
            Save these {done.length} as a routine
          </Btn>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              saveRoutine(naming, done)
              setNaming(null)
            }}
          >
            <input
              value={naming}
              autoFocus
              onChange={(e) => setNaming(e.target.value.slice(0, 28))}
              aria-label="Name this routine"
              placeholder="Push day"
              className="flex-1 min-w-0 bg-panel-2 rounded-[var(--radius-sm)] px-3 min-h-[44px] text-[15px] text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-[var(--color-neon)]"
            />
            <Btn type="submit" size="sm" disabled={!naming.trim()}>
              Save
            </Btn>
          </form>
        ))}

      <ExercisePicker
        open={picking}
        current={open}
        recent={recent}
        onPick={(name) => {
          sessionAddLift(name)
          setOpen(name)
        }}
        onClose={() => setPicking(false)}
      />
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
        <div className="font-display text-[13px]" style={{ color: tone }}>
          {working ? 'WORK' : 'REST'}
        </div>
        <div className="text-[40px] leading-none tabular-nums mt-1" style={{ color: tone }}>
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
              <div className="font-display text-[11px] text-ink-faint">{label}</div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => set(value - 5)}
                  className="w-9 min-h-[44px] font-display text-[18px] text-ink-dim active:text-ink"
                  aria-label={`Five seconds less ${label.toLowerCase()}`}
                >
                  −
                </button>
                <span className="text-[15px] text-ink flex-1 text-center tabular-nums">{value}s</span>
                <button
                  onClick={() => set(value + 5)}
                  className="w-9 min-h-[44px] font-display text-[18px] text-ink-dim active:text-ink"
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
      <div className="font-display text-[11px] text-ink-faint">{label}</div>
      <div className="text-[16px] mt-1 tabular-nums" style={{ color: tone }}>
        {value}
      </div>
    </div>
  )
}

/**
 * The bar at the top of a running session.
 *
 * The clock used to be a 44px number in the middle of the screen with the
 * controls under it, which put the least interactive thing in the app where
 * your thumb is and pushed the work below the fold. It is a bar now: it sticks
 * to the top, it holds the only two buttons a session needs, and everything
 * else on the screen is the session itself.
 */
function SessionBarTop({ act, ms, session, ready, secs, summary, tint, onPause, onResume, onFinish, auto }) {
  return (
    <div className="sticky top-0 z-30 -mx-3 px-3 pt-1 pb-2 bg-void">
      <Panel className="p-3" accent={tint}>
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 shrink-0 rounded-full ${session.paused ? '' : 'pulse-ring'}`}
            style={{ background: session.paused ? 'var(--color-ink-faint)' : tint }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="label text-ink-faint">
              {session.paused ? (auto ? 'Auto-paused' : 'Paused') : act.name}
            </div>
            <div className="figure text-[26px] text-ink leading-none mt-1 tabular-nums">{clock(ms)}</div>
          </div>
          <div className="flex gap-1.5 ml-auto shrink-0">
            <Btn size="sm" variant="ghost" onClick={session.paused ? onResume : onPause}>
              {session.paused ? 'Resume' : 'Pause'}
            </Btn>
            <Btn size="sm" variant={ready ? 'go' : 'dim'} disabled={!ready} onClick={onFinish}>
              Finish
            </Btn>
          </div>
        </div>
        {(summary || !ready) && (
          <div className="label text-ink-faint mt-2.5 pt-2.5 border-t border-line">
            {ready ? summary : `Counts from one minute · ${MIN_SESSION_S - secs}s to go`}
          </div>
        )}
      </Panel>
    </div>
  )
}

/** The instrument for whatever you are doing. Everything the log needs is
 *  read off it. */
function Running({ session, act }) {
  const { pauseSession, resumeSession, finishSession, discardSession, sessionFix, state } = useGame()
  const [, tick] = useState(0)
  const [worth, setWorth] = useState(false)
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

  // One line under the clock, in whatever the session actually measures.
  const totals = setTotals(session.sets ?? NONE)
  const summary =
    mode === 'strength'
      ? totals.sets
        ? `${totals.sets} ${totals.sets === 1 ? 'set' : 'sets'} · ${totals.reps} reps${totals.volume ? ` · ${Math.round(totals.volume).toLocaleString()}kg` : ''}`
        : 'No sets yet'
      : mode === 'distance'
        ? `${(session.metres / 1000).toFixed(2)} km${session.metres > 200 ? ` · ${pace(ms, session.metres)} /km` : ''}`
        : null

  return (
    <div className="p-3 space-y-3">
      <SessionBarTop
        act={act}
        ms={ms}
        session={session}
        ready={ready}
        secs={secs}
        summary={summary}
        tint={tint}
        auto={auto.current}
        onPause={pauseSession}
        onResume={() => {
          auto.current = false
          moved.current = Date.now()
          resumeSession()
        }}
        onFinish={finishSession}
      />

      {mode === 'strength' && <StrengthReadout session={session} ms={ms} />}

      {mode !== 'strength' && (
        <Panel className="p-4 text-center" accent={tint}>
          {mode === 'distance' && <DistanceReadout session={session} ms={ms} />}
          {mode === 'interval' && <IntervalReadout session={session} ms={ms} />}
          {mode === 'steady' && <SteadyReadout act={act} ms={ms} preview={preview} />}

          {GPS_NOTE[gps] && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Icon name="pin" size={10} color={gps === 'on' ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
              <span className="text-[14px] text-ink-faint">{GPS_NOTE[gps]}</span>
            </div>
          )}
        </Panel>
      )}

      {/* Only once there is a line. An empty 132px box that says there is
          nothing to draw is a bigger way of saying nothing. */}
      {mode === 'distance' && session.points.length > 1 && (
        <Panel className="p-3">
          <div className="label text-ink-faint">Your route</div>
          <RouteTrace points={session.points} />
        </Panel>
      )}

      {/* Both of these are answers to questions nobody asks mid-set, so they
          sit at the bottom behind a tap rather than between you and the bar. */}
      <Panel>
        <button
          onClick={() => setWorth((v) => !v)}
          aria-expanded={worth}
          className="w-full flex items-center gap-2 px-3.5 py-3 min-h-[48px] text-left active:bg-panel-2"
        >
          <span className="label text-ink-faint flex-1">What this is worth</span>
          <span className="text-[15px] text-lime">+{preview.xp} XP</span>
          <Icon name="chevron" size={11} color="var(--color-ink-faint)" />
        </button>
        {worth && (
          <div className="px-3.5 pb-3.5 border-t border-line pt-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {Object.entries(preview.statGains).map(([k, v]) => (
                <span key={k} className="text-[14px] text-ink-dim">
                  {k} +{v}
                </span>
              ))}
            </div>
            <div className="text-[14px] text-ink-faint mt-3 leading-relaxed">
              It keeps running if you close the app — the clock is a start time, not a timer, so locking your phone
              mid-run costs you nothing.
            </div>
          </div>
        )}
      </Panel>

      <button
        onClick={discardSession}
        className="label text-ink-faint min-h-[44px] w-full active:text-danger"
      >
        Throw it away
      </button>
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
 * What you have actually done, in one line.
 *
 * The full list used to sit open at the bottom of TRAIN, which made the screen
 * long for something you look at once a week. The week's four numbers are what
 * gets checked; the sessions behind them are one tap away.
 */
function weekTotals(log) {
  const week = Date.now() - 7 * 24 * 3600 * 1000
  return log
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
}

function SessionsRow({ log, onOpen }) {
  const totals = weekTotals(log)
  if (!log.length) {
    return (
      <div>
        <SectionTitle>View sessions</SectionTitle>
        <Panel className="p-4">
          <div className="text-[14px] text-ink-dim text-center leading-snug">
            Nothing here yet. Start something above and it lands here the moment you stop the clock.
          </div>
        </Panel>
      </div>
    )
  }
  return (
    <div>
      <SectionTitle right={<span className="text-[14px] text-ink-faint">last 7 days</span>}>
        View sessions
      </SectionTitle>
      <Panel>
        <button onClick={onOpen} className="w-full flex items-center gap-3 p-3.5 text-left active:bg-panel-2">
          <div className="grid grid-cols-4 gap-2 flex-1 min-w-0">
            {[
              [totals.sessions, 'SESSIONS'],
              [Math.round(totals.minutes), 'MINUTES'],
              [totals.km ? totals.km.toFixed(1) : '0', 'KM'],
              [totals.xp, 'XP'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="figure text-[17px] text-ink">{n}</div>
                <div className="label text-ink-faint mt-1">{label}</div>
              </div>
            ))}
          </div>
          <Icon name="chevron" size={12} color="var(--color-ink-faint)" />
        </button>
      </Panel>
    </div>
  )
}

/** Every session, newest first, with what each one actually was. */
function SessionsSheet({ log, onClose }) {
  return (
    <Modal open onClose={onClose} title="YOUR SESSIONS" wide>
      <Panel className="p-3">
        <div className="space-y-2">
          {log.map((l) => {
            const act = ACTIVITIES.find((a) => a.id === l.activityId)
            if (!act) return null
            const detail = detailLine(l.detail)
            return (
              <div key={l.id} className="border-b border-line last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <Icon name={act.icon} size={12} color={TINT[act.id] ?? 'var(--color-ink-faint)'} />
                  <span className="font-display text-[12px] text-ink-dim w-[74px] shrink-0">
                    {act.name.toUpperCase()}
                  </span>
                  <span className="text-[14px] text-ink">
                    {l.amount} {l.amount === 1 ? act.unit.replace(/s$/, '') : act.unit}
                  </span>
                  <span className="text-[14px] text-lime ml-auto">+{l.xp}</span>
                  <span className="text-[14px] text-ink-faint w-[62px] text-right shrink-0">{ago(l.at)}</span>
                </div>
                {/* The amount is one number and every session collapses into
                    it. This is the part worth reading back. */}
                {detail && <div className="text-[14px] text-ink-faint ml-[24px] mt-0.5">{detail}</div>}
                {l.source && l.source !== 'tracked' && (
                  <div className="label text-ink-faint ml-[24px] mt-1">{l.source}</div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    </Modal>
  )
}

/**
 * How much of a week you have had, and how it compares to the last one.
 *
 * This is the first thing on the page now. It used to open on a wall of twelve
 * activity cards, which is a menu — you look at a menu when you have already
 * decided to do something, and the reason to open a tracking app on a day you
 * have not decided is to see where you are.
 */
function WeekHeader({ weeks, streak }) {
  const series = weekSeries(weeks, WEEKS_KEPT)
  const top = Math.max(1, ...series.map((w) => w.minutes))
  const mins = weekOverWeek(weeks, 'minutes')
  const vol = weekOverWeek(weeks, 'volume')

  // Volume only leads if there is any: a runner should not open the app to a
  // kilogram figure that will read zero forever.
  const lead = vol.now > 0
    ? { label: 'Volume this week', value: `${Math.round(vol.now).toLocaleString()}kg`, cmp: vol }
    : { label: 'Minutes this week', value: `${Math.round(mins.now)}`, cmp: mins }

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="label text-ink-faint">{lead.label}</div>
          <div className="figure text-[34px] text-ink mt-1.5">{lead.value}</div>
          <Delta cmp={lead.cmp} />
        </div>
        <StreakFlame days={streak} />
      </div>

      {/* A quarter of a year, one bar a week. The gaps are the point — a chart
          that only plots the weeks you trained draws a straight line through a
          fortnight off. */}
      <div className="flex items-end gap-[3px] h-14 mt-4" aria-hidden="true">
        {series.map((w, i) => {
          const h = Math.max(2, Math.round((w.minutes / top) * 56))
          const now = i === series.length - 1
          return (
            <span
              key={w.key}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: h,
                background: now ? 'var(--color-neon)' : w.minutes ? 'var(--color-line-hot)' : 'var(--color-line)',
              }}
            />
          )
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="label text-ink-faint">{WEEKS_KEPT} weeks ago</span>
        <span className="label text-ink-faint">this week</span>
      </div>
    </Panel>
  )
}

/** Up, down or level, said in one line. */
function Delta({ cmp }) {
  if (cmp.prev === 0 && cmp.now === 0) {
    return <div className="text-[13px] text-ink-faint mt-1.5">Nothing logged yet this week.</div>
  }
  if (cmp.prev === 0) {
    return <div className="text-[13px] text-ink-dim mt-1.5">First week with anything in it.</div>
  }
  const up = cmp.delta >= 0
  return (
    <div className="text-[13px] mt-1.5" style={{ color: up ? 'var(--color-lime)' : 'var(--color-ink-dim)' }}>
      {up ? '▲' : '▼'} {Math.abs(cmp.pct)}% on last week
    </div>
  )
}

/** A line, drawn small enough to sit inside a row. */
function Spark({ points, color = 'var(--color-neon)', w = 72, h = 22 }) {
  if (points.length < 2) return <span className="inline-block" style={{ width: w, height: h }} />
  const lo = Math.min(...points)
  const hi = Math.max(...points)
  const span = hi - lo || 1
  const d = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - lo) / span) * (h - 3) - 1.5}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="overflow-visible">
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={w}
        cy={h - ((points[points.length - 1] - lo) / span) * (h - 3) - 1.5}
        r="2.5"
        fill={color}
      />
    </svg>
  )
}

/** How long ago a record was set, in the words you would use out loud. */
function since(ms) {
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days}d ago`
  if (days < 60) return `${Math.round(days / 7)}w ago`
  return `${Math.round(days / 30)}mo ago`
}

/**
 * Every lift you have a best for.
 *
 * The number is an estimated one-rep max — Epley off the set that produced it —
 * because nobody compares "eight at sixty" with "five at seventy" in their
 * head. It says "est." everywhere it appears: it is a comparison, not a claim
 * about what you can lift today.
 */
function LiftBoard({ records, log }) {
  const board = liftBoard(records)
  if (!board.length) {
    return (
      <div>
        <SectionTitle>Your lifts</SectionTitle>
        <Panel className="p-4">
          <div className="text-[14px] text-ink-dim text-center leading-snug">
            Log a gym session with weight on the bar and your bests land here — one per exercise,
            and the app tells you when you beat one.
          </div>
        </Panel>
      </div>
    )
  }
  return (
    <div>
      <SectionTitle right={<span className="label text-ink-faint">est. 1RM</span>}>Your lifts</SectionTitle>
      <Panel>
        {board.map((r, i) => {
          const series = liftSeries(log, r.lift).map((p) => p.top).filter(Boolean)
          return (
            <div
              key={r.lift}
              className={`flex items-center gap-3 px-3.5 py-3 ${i === board.length - 1 ? '' : 'border-b border-line'}`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-display text-[15px] text-ink truncate">{r.lift}</div>
                <div className="label text-ink-faint mt-1">
                  {r.reps} × {r.weight}kg · {since(r.at)}
                </div>
              </div>
              <Spark points={series} color="var(--color-neon)" />
              <div className="text-right shrink-0 w-[62px]">
                <div className="figure text-[18px] text-ink">{Math.round(r.e1rm)}</div>
                <div className="label text-ink-faint mt-0.5">kg</div>
              </div>
            </div>
          )
        })}
      </Panel>
    </div>
  )
}

/**
 * The character, at the size a character deserves.
 *
 * This screen used to open on volume, a percentage against last week, and a
 * thirteen-week bar chart — the Strava playbook, competent and backward
 * looking. A game pulls you forward; a dashboard reports what you already did.
 * And the RPG was a forty-pixel avatar in the corner, which is the opposite of
 * what the app is for.
 *
 * So the hero leads and the data supports. The condition band is not
 * decoration either: `formOf` is the same number the arena uses to work out how
 * hard you hit, so a character who looks cold really is weaker in a fight.
 */
function HeroStage({ player, log, streak }) {
  const worn = useMemo(() => wornGear(player), [player])
  const form = useMemo(() => formOf(log), [log])
  const pet = player.pets.find((x) => x.id === player.activePetId)
  const cls = classById(player.classId)
  const { rank } = rankFor(powerScore(player))
  const tier = streakTier(streak)
  const cap = xpToNext(player.level)
  const maxed = !Number.isFinite(cap)
  const days = useMemo(() => {
    if (!log.length) return null
    return Math.floor((Date.now() - log[0].at) / 86400000)
  }, [log])

  const mood = days === null
    ? 'Nothing logged yet. Your character is waiting on you.'
    : days <= 0
      ? 'Trained today. Rested, fed and ready for the next one.'
      : days === 1
        ? 'Trained yesterday. Still sharp.'
        : days < 4
          ? `${days} days since the last session. Getting restless.`
          : `${days} days idle. Going cold — it shows in a fight.`

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between px-3.5 pt-3">
        <div className="flex items-center gap-1.5">
          <Chip color={cls.color}>{cls.name.toUpperCase()}</Chip>
          <Chip color={rank.color}>{rank.name}</Chip>
        </div>
        <span className="label text-ink-faint">{form.label}</span>
      </div>

      {/* The stage: a floor and a wash of the condition colour, so a cold
          character stands in a colder room. */}
      <div
        className="relative flex items-end justify-center gap-1 px-3 pt-2 pb-1"
        style={{
          background: `radial-gradient(120% 80% at 50% 100%, ${alpha(form.color, 16)}, transparent 70%)`,
        }}
      >
        <HeroView
          av={player.avatar}
          equipped={worn}
          height={168}
          className={days !== null && days >= 4 ? 'opacity-70 saturate-[0.55]' : undefined}
        />
        {pet && <PetView refId={pet.ref} level={pet.level} size={64} float className="mb-1" />}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${alpha(form.color, 55)}, transparent)` }}
        />
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <div className="text-[14px] text-ink-dim leading-snug">{mood}</div>

        {/* One bar and one number. Everything else on this screen is secondary
            to the question "how close am I to the next level". */}
        <div className="flex items-baseline justify-between mt-3.5">
          <span className="font-display text-[15px] text-ink">
            Level <span className="text-neon text-[19px]">{player.level}</span>
          </span>
          <span className="text-[14px] text-ink-faint tabular-nums">
            {maxed ? 'MAX LEVEL' : `${fmtFull(Math.round(player.xp))} / ${fmtFull(cap)} XP`}
          </span>
        </div>
        <Bar pct={maxed ? 1 : player.xp / cap} height={10} shine className="mt-1.5" />

        <div className="flex items-center gap-3.5 mt-3.5 pt-3.5 border-t border-line">
          <StreakFlame days={streak} />
          <div className="min-w-0 flex-1 text-[14px] text-ink-dim leading-snug">
            {streak > 0
              ? 'Unbroken. Everything you earn is multiplied while it holds.'
              : 'No streak running. One session today starts it.'}
          </div>
          <div className="text-right shrink-0">
            <div className="figure text-[21px] text-gold leading-none">×{tier.mult.toFixed(2)}</div>
            <div className="label text-ink-faint mt-1.5">on every XP</div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/**
 * What today is for.
 *
 * The piece that was missing entirely: a reason to move now, with the reward
 * in view. Sessions wear the boss down whether or not you open the Battle tab,
 * which is the mechanic that ties the tracker to the game — so it belongs on
 * the screen where you start one.
 */
function Objective({ player, campaign, onGo }) {
  const c = campaignState(player, campaign)

  if (c.finished) {
    return (
      <Panel accent="var(--color-gold)" className="p-3.5">
        <div className="font-display text-[16px] text-gold">The road is clear</div>
        <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
          Ten bosses down. Sessions still pay XP, loot and streak — there is just nothing left standing in the way.
        </div>
      </Panel>
    )
  }

  if (!c.current) {
    const levels = c.gatedBy
    const opens = levels === 1 ? 'One more level' : `${levels} more levels`
    return (
      <Panel accent="var(--color-gold)" className="p-3.5">
        <div className="label text-ink-faint">Your objective</div>
        <div className="font-display text-[16px] text-gold mt-1">{c.locked.name} is waiting</div>
        <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
          {c.cleared === 0
            ? `The first boss opens at level ${c.locked.level}. ${opens} — and anything you log is XP towards it.`
            : `You have beaten everything on this stretch. ${opens} opens it, and every session is XP towards that.`}
        </div>
      </Panel>
    )
  }

  const boss = c.current
  const act = actById(boss.act)
  const left = Math.max(0, boss.hp - c.damage)

  return (
    <button
      onClick={onGo}
      className="w-full text-left transition-transform active:scale-[0.99]"
      aria-label={`Your objective: ${boss.name}. Open the battle tab.`}
    >
      <Panel accent={act.color} className="p-3.5">
        <div className="flex items-center gap-3">
          <BossArt sprite={boss.sprite} size={54} className="shrink-0 float-soft" />
          <div className="min-w-0 flex-1">
            <div className="label text-ink-faint">Your objective</div>
            <div className="font-display text-[17px] mt-1 truncate" style={{ color: act.color }}>
              {boss.name}
            </div>
            <div className="text-[14px] text-ink-faint mt-0.5 truncate">
              ACT {act.numeral} · {act.name}
            </div>
          </div>
          <Icon name="chevron" size={12} color="var(--color-ink-faint)" />
        </div>

        <Bar pct={c.damage / boss.hp} color="var(--color-danger)" height={10} shine className="mt-3" />
        <div className="flex justify-between mt-1.5">
          <span className="text-[14px] text-danger tabular-nums">{fmtFull(Math.round(c.damage))} dealt</span>
          <span className="text-[14px] text-ink-faint tabular-nums">{fmtFull(left)} HP left</span>
        </div>

        <div className="text-[14px] text-ink-dim mt-2.5 leading-snug">
          Every session you log is damage.{' '}
          {boss.weak ? (
            <>
              <span style={{ color: act.color }}>{boss.weakLabel}</span> hits double.
            </>
          ) : (
            'Anything at all counts.'
          )}
        </div>
      </Panel>
    </button>
  )
}

/**
 * One green button.
 *
 * TRAIN used to open on a wall of twelve activity cards and a list of plans
 * above them — a menu you read before you had decided anything. You look at a
 * menu when you have already decided to do something, so the menu moved behind
 * the decision: press go, then say what.
 *
 * It says ACTIVITY and not WORKOUT on purpose. The people this app is for are
 * not lifters yet — they are gamers who do not currently exercise — and "log a
 * workout" is a door a walker does not think is for them.
 */
function StartBlock({ onStart, onImport, note }) {
  return (
    <div className="space-y-2">
      <Btn full size="lg" variant="go" onClick={onStart}>
        START ACTIVITY
      </Btn>
      {note && <div className="text-[14px] text-ink-dim text-center leading-snug px-2">{note}</div>}
      <button
        onClick={onImport}
        className="w-full min-h-[44px] flex items-center justify-center gap-2 text-[14px] text-ink-dim hover:text-ink active:brightness-125"
      >
        <Icon name="swap" size={13} color="currentColor" />
        Import one you already did
      </button>
    </div>
  )
}

/**
 * The week, counted the way the game counts.
 *
 * The old lead was 18,832 kg. A walker or a runner — the convert this app is
 * trying to win — opens that and concludes it is a lifting app. Not one of
 * these four numbers is discipline-specific.
 */
function WeekInGame({ log }) {
  const t = useMemo(() => {
    const week = Date.now() - 7 * 24 * 3600 * 1000
    const days = new Set()
    let xp = 0
    let minutes = 0
    let km = 0
    for (const l of log) {
      if (l.at < week) continue
      const act = ACTIVITIES.find((a) => a.id === l.activityId)
      if (!act) continue
      days.add(new Date(l.at).toDateString())
      xp += l.xp
      minutes += minutesOf(act, l.amount)
      if (act.unit === 'km') km += l.amount
    }
    return { xp, days: days.size, minutes: Math.round(minutes), km }
  }, [log])

  const cells = [
    { label: 'XP earned', value: fmtFull(Math.round(t.xp)), tone: 'var(--color-neon)' },
    { label: 'days moved', value: `${t.days}/7`, tone: t.days >= 4 ? 'var(--color-lime)' : 'var(--color-ink)' },
    { label: 'km covered', value: t.km >= 10 ? Math.round(t.km) : t.km.toFixed(1), tone: 'var(--color-ink)' },
    { label: 'minutes', value: fmtFull(t.minutes), tone: 'var(--color-ink)' },
  ]

  return (
    <div>
      <SectionTitle right={<span className="text-[14px] text-ink-faint">last 7 days</span>}>This week</SectionTitle>
      <Panel className="grid grid-cols-4 divide-x divide-line">
        {cells.map((c) => (
          <div key={c.label} className="px-2 py-3 text-center">
            <div className="figure text-[19px] leading-none" style={{ color: c.tone }}>
              {c.value}
            </div>
            <div className="label text-ink-faint mt-1.5 leading-tight">{c.label}</div>
          </div>
        ))}
      </Panel>
    </div>
  )
}

/** How often each activity has been done lately, newest weighted heavier. */
function byUse(log) {
  const count = new Map()
  for (const l of log.slice(0, 40)) count.set(l.activityId, (count.get(l.activityId) ?? 0) + 1)
  return [...TRACKED].sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0))
}

/**
 * What are you doing — asked at the moment you are actually deciding.
 *
 * Ordered by what this person actually does rather than by what the config
 * file happens to list first. Someone who runs four times a week should find
 * RUN under their thumb, not eight rows down past three things they have never
 * once opened.
 */
function StartSheet({ log, routines, onClose, onStart, onDeleteRoutine }) {
  const last = lastPlan(log)
  const saved = new Set(routines.map((r) => r.lifts.join('|')))
  const showLast = last && !saved.has(last.lifts.join('|'))
  const order = byUse(log)
  const usual = order.slice(0, 4)
  const rest = order.slice(4)

  const Act = ({ a }) => (
    <button
      key={a.id}
      onClick={() => onStart(a.id)}
      aria-label={`Start a ${a.name} session`}
      className="w-full flex items-center gap-3 px-3.5 py-3 text-left border-b border-line last:border-0 active:bg-panel-2"
    >
      <span
        className="grid place-items-center w-9 h-9 shrink-0 rounded-[var(--radius-sm)]"
        style={{ background: alpha(TINT[a.id], 14) }}
      >
        <Icon name={a.icon} size={18} color={TINT[a.id]} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] text-ink leading-tight">{a.name}</span>
        <span className="block label text-ink-faint mt-1">{MODE_NOTE[modeOf(a.id)]}</span>
      </span>
      <Icon name="chevron" size={12} color="var(--color-ink-faint)" />
    </button>
  )

  return (
    <Modal open onClose={onClose} title="START WORKOUT">
      {(showLast || routines.length > 0) && (
        <>
          <SectionTitle>Pick up where you left off</SectionTitle>
          <Panel className="mb-4">
            {showLast && (
              <div className="flex items-center border-b border-line last:border-0">
                {/* The padding lives on the button, not the row: a row that is
                    tall enough to press and a target that is not is the same
                    bug wearing a disguise. */}
                <button
                  onClick={() => onStart('gym', last.lifts)}
                  className="min-w-0 flex-1 text-left px-3.5 py-3 min-h-[56px] active:bg-panel-2"
                >
                  <div className="font-display text-[16px] text-ink truncate">Repeat last session</div>
                  <div className="label text-ink-faint mt-1 truncate">
                    {since(last.at)} · {last.lifts.join(' · ')}
                  </div>
                </button>
                <Icon name="chevron" size={12} color="var(--color-ink-faint)" className="mr-3.5 shrink-0" />
              </div>
            )}
            {routines.map((r) => (
              <div key={r.id} className="flex items-center border-b border-line last:border-0">
                <button
                  onClick={() => onStart('gym', r.lifts)}
                  className="min-w-0 flex-1 text-left px-3.5 py-3 min-h-[56px] active:bg-panel-2"
                >
                  <div className="font-display text-[16px] text-ink truncate">{r.name}</div>
                  <div className="label text-ink-faint mt-1 truncate">{r.lifts.join(' · ')}</div>
                </button>
                <button
                  onClick={() => onDeleteRoutine(r.id)}
                  aria-label={`Delete the ${r.name} routine`}
                  className="shrink-0 grid place-items-center w-11 h-11 rounded-[var(--radius-sm)] text-[15px] text-ink-faint hover:text-danger"
                >
                  ✕
                </button>
                <Icon name="chevron" size={12} color="var(--color-ink-faint)" className="mr-3.5 shrink-0" />
              </div>
            ))}
          </Panel>
        </>
      )}

      <SectionTitle right={<span className="label text-ink-faint shrink-0">the app counts it</span>}>
        {log.length ? 'What you usually do' : 'Pick one'}
      </SectionTitle>
      <Panel className="mb-4">
        {usual.map((a) => (
          <Act key={a.id} a={a} />
        ))}
      </Panel>

      <SectionTitle>Everything else</SectionTitle>
      <Panel>
        {rest.map((a) => (
          <Act key={a.id} a={a} />
        ))}
      </Panel>
    </Modal>
  )
}

/**
 * A workout that happened somewhere else.
 *
 * Reading a file is the honest version of this until there is a server to hold
 * a health-provider link: a GPX or TCX is what the watch itself recorded, so an
 * imported session is evidence in exactly the way a typed one is not, and it
 * earns the same XP.
 */
function ImportSheet({ onClose, onImport }) {
  const [found, setFound] = useState(null)
  const [error, setError] = useState(null)
  const [act, setAct] = useState('run')
  const file = useRef(null)

  const read = async (f) => {
    if (!f) return
    setError(null)
    setFound(null)
    try {
      const workout = readWorkoutFile(await f.text(), f.name)
      setAct(guessActivity(workout))
      setFound({ ...workout, name: f.name })
    } catch (e) {
      setError(e.message)
    }
  }

  const km = found ? found.metres / 1000 : 0

  return (
    <Modal open onClose={onClose} title="IMPORT A WORKOUT">
      <p className="text-[14px] text-ink-dim leading-relaxed">
        Already recorded it on a watch or in another app? Export that activity as <strong>GPX</strong> or{' '}
        <strong>TCX</strong> — Strava, Garmin, Coros, Suunto and Apple&rsquo;s Fitness app all can — and drop the file
        in. The route, the distance and the time come across, and it counts for XP the same as one tracked here.
      </p>

      <input
        ref={file}
        type="file"
        accept=".gpx,.tcx,application/gpx+xml,application/xml,text/xml"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0])}
      />
      <Btn full variant="cyan" className="mt-3" onClick={() => file.current?.click()}>
        {found ? 'CHOOSE A DIFFERENT FILE' : 'CHOOSE A FILE'}
      </Btn>

      {error && (
        <Panel className="p-3 mt-3" accent="var(--color-danger)">
          <div className="text-[14px] text-ink-dim leading-snug">{error}</div>
        </Panel>
      )}

      {found && (
        <>
          <div className="mt-4">
            <SectionTitle right={<span className="label text-ink-faint truncate max-w-[150px]">{found.name}</span>}>
              What came across
            </SectionTitle>
            <Panel className="p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [km >= 10 ? km.toFixed(1) : km.toFixed(2), 'KM'],
                  [clock(found.ms), 'TIME'],
                  [found.splits.length, found.splits.length === 1 ? 'SPLIT' : 'SPLITS'],
                ].map(([v, label]) => (
                  <div key={label}>
                    <div className="figure text-[19px] text-ink">{v}</div>
                    <div className="label text-ink-faint mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="text-[13px] text-ink-faint mt-3 pt-3 border-t border-line leading-snug">
                Recorded {since(found.at)} · {found.points.length} points. The route lands on your map and the ground
                you covered is claimed.
              </div>
            </Panel>
          </div>

          <div className="mt-3">
            <SectionTitle>Count it as</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {['walk', 'run', 'ride', 'swim'].map((id) => {
                const a = TRACKED.find((x) => x.id === id)
                const on = act === id
                return (
                  <button
                    key={id}
                    onClick={() => setAct(id)}
                    aria-pressed={on}
                    className="grid place-items-center gap-1.5 py-2.5 min-h-[64px] border rounded-[var(--radius-sm)] transition-colors"
                    style={{
                      borderColor: on ? TINT[id] : 'var(--color-line)',
                      background: on ? alpha(TINT[id], 12) : 'transparent',
                    }}
                  >
                    <Icon name={a.icon} size={17} color={on ? TINT[id] : 'var(--color-ink-faint)'} />
                    <span className="label" style={{ color: on ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}>
                      {a.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Btn
            full
            variant="go"
            className="mt-4"
            onClick={() => {
              onImport(act, found)
              onClose()
            }}
          >
            IMPORT IT
          </Btn>
        </>
      )}
    </Modal>
  )
}

/**
 * Best efforts.
 *
 * The lift board says how strong you are, one exercise at a time. It cannot say
 * what your 5k is, and for most people that is the number they know by heart.
 * These are the other kind of record — a time over a distance, a heaviest set
 * at a given number of reps, the furthest you have gone — and they come from
 * every discipline rather than only the gym.
 *
 * Three of them go on your profile, and only three, and only ones you chose.
 * A board that filled itself would put your slowest ever kilometre in front of
 * the people you least want to show it to.
 */
function BestEfforts({ bests, picks, onEdit }) {
  const all = effortList(bests)
  const pinned = pinnedEfforts(bests, picks)

  if (!all.length) {
    return (
      <div>
        <SectionTitle>Best efforts</SectionTitle>
        <Panel className="p-4">
          <div className="text-[14px] text-ink-dim text-center leading-snug">
            Track a run, a swim or a gym session and your bests land here — fastest 5k, longest ride, heaviest set of
            eight. Pick three for your profile.
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div>
      <SectionTitle
        right={
          <button onClick={onEdit} className="label text-neon shrink-0 min-h-[44px] px-1">
            {pinned.length ? 'CHANGE' : 'CHOOSE 3'}
          </button>
        }
      >
        Best efforts
      </SectionTitle>

      {pinned.length ? (
        <Panel className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {pinned.map((e) => (
              <div key={e.id} className="min-w-0">
                <div className="figure text-[19px] text-ink leading-none">
                  {e.value}
                  {e.unit && <span className="text-[13px] text-ink-dim ml-0.5">{e.unit}</span>}
                </div>
                <div className="label text-ink-faint mt-1.5 truncate" title={e.name}>
                  {e.name}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[13px] text-ink-faint mt-3 pt-3 border-t border-line leading-snug">
            These three show on your profile. {all.length} bests on record.
          </div>
        </Panel>
      ) : (
        <Panel className="p-4">
          <div className="text-[14px] text-ink-dim leading-snug">
            {all.length} bests on record and none of them on your profile yet. Pick the three worth showing.
          </div>
          <Btn full size="sm" variant="ghost" className="mt-3" onClick={onEdit}>
            CHOOSE THREE
          </Btn>
        </Panel>
      )}
    </div>
  )
}

/** Choosing which three go on the profile. */
function EffortSheet({ bests, picks, onClose, onSave }) {
  const all = effortList(bests)
  const [draft, setDraft] = useState(picks)
  const toggle = (id) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : d.length >= EFFORT_SLOTS ? d : [...d, id]))

  return (
    <Modal open onClose={onClose} title="BEST EFFORTS">
      <p className="text-[14px] text-ink-dim leading-relaxed">
        Up to three, shown on your profile. Everything here was measured by the app — nothing on this list can be typed
        in.
      </p>
      {['Distance', 'Lifts'].map((group) => {
        const rows = all.filter((e) => e.group === group)
        if (!rows.length) return null
        return (
          <div key={group} className="mt-4">
            <SectionTitle>{group}</SectionTitle>
            <Panel>
              {rows.map((e, i) => {
                const on = draft.includes(e.id)
                const full = !on && draft.length >= EFFORT_SLOTS
                return (
                  <button
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    aria-pressed={on}
                    disabled={full}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${
                      i === rows.length - 1 ? '' : 'border-b border-line'
                    } ${full ? 'opacity-40' : 'active:bg-panel-2'}`}
                  >
                    <span
                      className="grid place-items-center w-5 h-5 shrink-0 rounded-full border"
                      style={{
                        borderColor: on ? 'var(--color-go)' : 'var(--color-line-hot)',
                        background: on ? 'var(--color-go)' : 'transparent',
                      }}
                    >
                      {on && <Icon name="check" size={11} color="var(--color-on-accent)" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[15px] text-ink truncate">{e.name}</span>
                      <span className="block label text-ink-faint mt-1">{since(e.at)}</span>
                    </span>
                    <span className="figure text-[16px] text-ink shrink-0">
                      {e.value}
                      {e.unit && <span className="text-[12px] text-ink-dim ml-0.5">{e.unit}</span>}
                    </span>
                  </button>
                )
              })}
            </Panel>
          </div>
        )
      })}
      <Btn
        full
        variant="go"
        className="mt-4"
        onClick={() => {
          onSave(draft)
          onClose()
        }}
      >
        {draft.length ? `SHOW THESE ${draft.length}` : 'SHOW NONE'}
      </Btn>
    </Modal>
  )
}

/**
 * Where the work has actually been going.
 *
 * Everybody trains what they enjoy and skips what they do not, and almost
 * nobody notices which is which — the log has known for months that you have
 * not pulled anything since April, and until now it had no way to say so.
 *
 * Counted in sets, not volume: a set of curls and a set of squats are one
 * decision each, and by volume the squats would look like twenty times the
 * training and drown everything else out.
 */
function Coverage({ log, custom }) {
  const split = useMemo(() => muscleSplit(log, { days: 30, custom }), [log, custom])
  const behind = neglected(split)
  if (!split.total) return null
  const top = Math.max(...split.groups.map((g) => g.sets))

  return (
    <div>
      <SectionTitle right={<span className="label text-ink-faint">last 30 days</span>}>What you have trained</SectionTitle>
      <Panel className="p-3.5">
        <div className="space-y-2">
          {split.groups
            .filter((g) => g.sets > 0 || (g.id !== 'cardio' && g.id !== 'full'))
            .map((g) => (
              <div key={g.id} className="flex items-center gap-2.5">
                <span className="label text-ink-faint w-[74px] shrink-0 truncate">{g.name}</span>
                <span className="flex-1 h-2 rounded-full bg-panel-2 overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${top ? Math.round((g.sets / top) * 100) : 0}%`, background: g.tone }}
                  />
                </span>
                <span className="figure text-[13px] text-ink-dim w-[34px] text-right shrink-0">{g.sets}</span>
              </div>
            ))}
        </div>
        <div className="text-[13px] mt-3 pt-3 border-t border-line leading-snug">
          {behind ? (
            <span className="text-ink-dim">
              <strong className="text-ink">{behind.name.toLowerCase()}</strong> is behind the rest of you —{' '}
              {behind.sets === 0 ? 'nothing at all' : `${behind.sets} ${behind.sets === 1 ? 'set' : 'sets'}`} in a month.
            </span>
          ) : (
            <span className="text-ink-faint">
              {split.total} sets across {split.groups.filter((g) => g.sets > 0).length} groups. Nothing obviously
              skipped.
            </span>
          )}
        </div>
      </Panel>
    </div>
  )
}

/** Pick something to do. */
/**
 * The tab, in two halves.
 *
 * QUEST is the game: your character, your level, the boss in front of you, and
 * the button that moves both. STATS is the tracker: volume, muscle coverage,
 * lifts, best efforts, history. The analytics did not get worse and nothing was
 * deleted — it is just no longer the front door, because the front door was
 * showing ninety percent tracker for an app that sells itself as an RPG.
 */
const VIEWS = [
  { id: 'quest', label: 'Quest' },
  { id: 'stats', label: 'Stats' },
]

function Pick({ onGo }) {
  const { state, startSession, deleteRoutine, setEfforts, importWorkout } = useGame()
  const [view, setView] = useState('quest')
  const [starting, setStarting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [sessions, setSessions] = useState(false)
  const [efforts, setEditingEfforts] = useState(false)
  const p = state.player
  const c = campaignState(p, state.campaign)

  const note = c.current
    ? `Whatever you do counts: XP, a hit on ${c.current.name}, and a roll at loot.`
    : 'Walk, run, ride, lift, swim — it all pays XP and keeps the streak alive.'

  return (
    <>
      <div className="stack-in p-4 space-y-4">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-[var(--radius-sm)] bg-panel-2">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="font-display text-[14px] py-2 min-h-[44px] rounded-[calc(var(--radius-sm)-2px)] transition-colors"
              style={{
                color: view === v.id ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                background: view === v.id ? 'var(--color-panel)' : 'transparent',
                boxShadow: view === v.id ? 'var(--elev)' : undefined,
              }}
              aria-pressed={view === v.id}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'quest' ? (
          <>
            <HeroStage player={p} log={state.log} streak={p.streak} />

            <Objective player={p} campaign={state.campaign} onGo={() => onGo?.('bosses')} />

            <StartBlock onStart={() => setStarting(true)} onImport={() => setImporting(true)} note={note} />

            <WeekInGame log={state.log} />
          </>
        ) : (
          <>
            <WeekHeader weeks={state.weeks} streak={p.streak} />

            <BestEfforts
              bests={state.bests ?? {}}
              picks={p.efforts ?? []}
              onEdit={() => setEditingEfforts(true)}
            />

            <Coverage log={state.log} custom={state.exercises ?? NONE} />

            <LiftBoard records={state.records} log={state.log} />

            <SessionsRow log={state.log} onOpen={() => setSessions(true)} />
          </>
        )}
      </div>

      {/* Outside the stack on purpose. Every direct child of `.stack-in` keeps
          a transform from its entrance animation, and a transform makes that
          element the containing block for anything absolutely positioned inside
          it — a full-screen sheet nested in one is a sheet the size of a card. */}
      {starting && (
        <StartSheet
          log={state.log}
          routines={state.routines ?? []}
          onClose={() => setStarting(false)}
          onStart={(id, plan) => {
            setStarting(false)
            startSession(id, plan)
          }}
          onDeleteRoutine={deleteRoutine}
        />
      )}
      {importing && <ImportSheet onClose={() => setImporting(false)} onImport={importWorkout} />}
      {sessions && <SessionsSheet log={state.log} onClose={() => setSessions(false)} />}
      {efforts && (
        <EffortSheet
          bests={state.bests ?? {}}
          picks={p.efforts ?? []}
          onClose={() => setEditingEfforts(false)}
          onSave={setEfforts}
        />
      )}
    </>
  )
}

export default function Train({ onGo }) {
  const { state } = useGame()
  const session = state.session
  const act = session && TRACKED.find((a) => a.id === session.activityId)
  return session && act ? <Running session={session} act={act} /> : <Pick onGo={onGo} />
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
      <span className="font-display text-[12px] text-ink-dim">{act?.name.toUpperCase()}</span>
      <span className="text-[15px] text-lime ml-auto tabular-nums">{clock(elapsedMs(session))}</span>
      <Icon name="chevron" size={10} color="var(--color-ink-faint)" />
    </button>
  )
}
