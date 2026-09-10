import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Btn, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import ExercisePicker from '../components/ExercisePicker'
import { useGame } from '../game/useGame'
import {
  INTERVAL,
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
import { minutesOf, resolveActivity, streakTier } from '../game/engine'
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

/**
 * The plan you are working down, and where you are in it.
 *
 * A routine is only worth saving if the session then knows about it. Each lift
 * is a chip you can tap to switch to, and it ticks once you have logged a set
 * of it — so the question "what's next" is answered by looking rather than by
 * remembering.
 */
function PlanStrip({ plan, sets, lift, onPick }) {
  if (!plan?.length) return null
  const done = new Set(sets.map((s) => s.lift))
  return (
    <div className="mt-3 text-left">
      <div className="label text-ink-faint">
        Today&apos;s plan · {plan.filter((l) => done.has(l)).length} of {plan.length}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {plan.map((name) => {
          const isDone = done.has(name)
          const active = name === lift
          return (
            <button
              key={name}
              onClick={() => onPick(name)}
              aria-pressed={active}
              className="label px-2.5 min-h-[34px] rounded-full inline-flex items-center gap-1.5 transition-colors"
              style={{
                background: active ? 'var(--color-neon)' : 'var(--color-panel-2)',
                color: active ? 'var(--color-on-accent)' : isDone ? 'var(--color-ink-faint)' : 'var(--color-ink)',
              }}
            >
              {isDone && <Icon name="check" size={11} color={active ? 'var(--color-on-accent)' : 'var(--color-lime)'} />}
              {name}
            </button>
          )
        })}
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
 * What you did the last time you touched this lift.
 *
 * The single most useful thing a gym tracker does. Without it the steppers
 * opened on eight reps at forty kilos every session regardless of what you had
 * done on Tuesday, which meant the app knew your history and made you remember
 * it anyway.
 */
function LastTime({ record, best }) {
  if (!record) {
    return <div className="text-[13px] text-ink-faint mt-2">First time on this one — the app will remember it.</div>
  }
  return (
    <div className="mt-2.5">
      <div className="flex items-baseline gap-2">
        <span className="label text-ink-faint">Last time · {since(record.at)}</span>
        {best ? <span className="label text-ink-faint ml-auto">best {Math.round(best.e1rm)}kg est.</span> : null}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {record.sets.map((set, i) => (
          <span key={i} className="label px-2 py-1 rounded-full bg-panel-2 text-ink-dim">
            {set.reps}
            {set.weight ? ` × ${set.weight}kg` : ''}
          </span>
        ))}
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
  const { state, sessionSet, sessionUndoSet, saveRoutine } = useGame()
  const [lift, setLift] = useState(session.lift ?? 'Bench press')
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(40)
  const [pickingLift, setPickingLift] = useState(false)
  const [rest, setRest] = useState(90)
  const [naming, setNaming] = useState(null)
  const sets = session.sets ?? NONE
  const lastTime = state.lastSets?.[lift]
  const plan = session.plan ?? []
  // What this session actually turned out to be, in the order it happened —
  // which is the thing worth saving, not the plan you walked in with.
  const done = useMemo(() => [...new Set(sets.map((s) => s.lift))], [sets])

  // Pick a lift and the steppers land on the heaviest set you did of it last
  // time, so the common case — repeat, or add a little — is already dialled in.
  // Only when the lift changes: typing over it mid-session would fight you.
  useEffect(() => {
    const top = topSet(lastTime?.sets ?? [])
    if (!top) return
    setReps(top.reps)
    setWeight(top.weight ?? 0)
    // The lift is the trigger; the record is looked up from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lift])
  const totals = setTotals(sets)
  const perLift = byLift(sets)

  // What to put at the top of the picker: this session first, then whatever
  // the last few sessions were built out of. Most people rotate through the
  // same fifteen exercises and should never have to search for them.
  const recentLifts = useMemo(() => {
    const seen = [...done]
    for (const entry of state.log ?? []) {
      for (const g of entry.detail?.lifts ?? []) if (!seen.includes(g.lift)) seen.push(g.lift)
      if (seen.length >= 8) break
    }
    return seen
  }, [done, state.log])

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="SETS" value={totals.sets} />
        <Stat label="REPS" value={totals.reps} />
        <Stat label="VOLUME" value={totals.volume ? `${Math.round(totals.volume)}kg` : '—'} tone="var(--color-gold)" />
      </div>

      {/* The exercise comes off a catalogue rather than a text field: free text
          turns the log into a pile of spellings of "bench press" that nothing
          can add up. The list is long enough now to need searching, so it
          opens rather than unfolding in place. */}
      <button
        onClick={() => setPickingLift(true)}
        className="w-full min-h-[52px] border border-line rounded-[var(--radius-sm)] mt-3 px-3 flex items-center gap-2 active:bg-panel-2"
      >
        <span
          className="w-1.5 h-7 shrink-0 rounded-full"
          style={{ background: MUSCLES.find((m) => m.id === muscleOf(lift, state.exercises))?.tone }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 text-left">
          <span className="block label text-ink-faint">Exercise</span>
          <span className="block text-[15px] text-ink truncate mt-0.5">{lift}</span>
        </span>
        <Icon name="chevron" size={12} color="var(--color-ink-faint)" />
      </button>

      <LastTime record={lastTime} best={state.records?.[lift]} />
      <PlanStrip plan={plan} sets={sets} lift={lift} onPick={setLift} />

      <ExercisePicker
        open={pickingLift}
        current={lift}
        recent={recentLifts}
        onPick={setLift}
        onClose={() => setPickingLift(false)}
      />

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
      {weight === 0 && <div className="text-[14px] text-ink-faint mt-1">Bodyweight — reps only.</div>}

      <Btn
        full
        className="mt-2"
        onClick={() => sessionSet(lift, reps, weight)}
        style={{ background: 'var(--color-gold)', borderColor: 'var(--color-gold)', color: 'var(--color-on-accent)' }}
      >
        Log {reps} × {weight === 0 ? 'bodyweight' : `${weight}kg`}
      </Btn>

      <RestClock sets={sets} ms={ms} length={rest} onLength={setRest} />

      {sets.length > 0 && (
        <div className="mt-3 border-t border-line pt-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-ink-faint">This session</span>
            <button onClick={sessionUndoSet} className="label text-ink-faint min-h-[44px] px-2 active:text-danger">
              Undo last
            </button>
          </div>

          {/* Grouped by lift, because that is how a session is actually
              remembered: four exercises, not nineteen numbered sets. */}
          <div className="space-y-2.5">
            {perLift.map((g) => (
              <div key={g.lift}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] text-ink truncate">{g.lift}</span>
                  <span className="text-[14px] text-ink-faint ml-auto shrink-0">
                    {g.volume ? `${Math.round(g.volume)}kg` : `${g.reps} reps`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sets
                    .filter((set) => (set.lift ?? 'Other') === g.lift)
                    .map((set, i) => (
                      <span
                        key={`${g.lift}-${set.at}-${i}`}
                        className="text-[14px] px-1.5 py-0.5 border border-line text-ink-dim"
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

      {/* Saveable once there is a shape to save. One lift is not a routine. */}
      {done.length > 1 &&
        (naming === null ? (
          <Btn variant="ghost" full size="sm" className="mt-3" onClick={() => setNaming(done[0])}>
            Save these {done.length} as a routine
          </Btn>
        ) : (
          <form
            className="flex gap-2 mt-3"
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

      <div className="text-[14px] text-ink-faint mt-3">{clock(ms)} under the bar</div>
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
    <div className="stack-in p-4 space-y-4">
      <Panel className="p-4 text-center" accent={tint}>
        <SectionTitle color={tint}>
          {session.paused ? (auto.current ? 'AUTO-PAUSED' : 'PAUSED') : act.name.toUpperCase()}
        </SectionTitle>
        <div className="text-[44px] leading-none text-ink tabular-nums" aria-live="off">
          {clock(ms)}
        </div>

        {mode === 'distance' && <DistanceReadout session={session} ms={ms} />}
        {mode === 'strength' && <StrengthReadout session={session} ms={ms} />}
        {mode === 'interval' && <IntervalReadout session={session} ms={ms} />}
        {mode === 'steady' && <SteadyReadout act={act} ms={ms} preview={preview} />}

        {GPS_NOTE[gps] && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Icon name="pin" size={10} color={gps === 'on' ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
            <span className="text-[14px] text-ink-faint">{GPS_NOTE[gps]}</span>
          </div>
        )}

        {!ready && (
          <div className="text-[14px] text-ink-faint mt-3">
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
              Resume
            </Btn>
          ) : (
            <Btn full variant="ghost" onClick={pauseSession}>
              Pause
            </Btn>
          )}
          <Btn
            full
            disabled={!ready}
            onClick={finishSession}
            style={ready ? { background: 'var(--color-lime)', borderColor: 'var(--color-lime)', color: 'var(--color-on-accent)' } : undefined}
          >
            Finish
          </Btn>
        </div>
        <button
          onClick={discardSession}
          className="font-display text-[12px] text-ink-faint mt-3 min-h-[44px] w-full active:text-danger"
        >
          Throw it away
        </button>
      </Panel>

      {mode === 'distance' && (
        <Panel className="p-3">
          <div className="font-display text-[12px] text-ink-faint">Your route</div>
          {session.points.length > 1 ? (
            <RouteTrace points={session.points} />
          ) : (
            <div className="h-[132px] grid place-items-center text-[14px] text-ink-faint text-center px-4">
              {gps === 'on' || gps === 'waiting'
                ? 'The line appears once you have covered some ground.'
                : 'No location, so there is no line to draw. The clock still counts.'}
            </div>
          )}
        </Panel>
      )}

      <Panel className="p-3">
        <div className="font-display text-[12px] text-ink-faint">What this is worth</div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-[18px] text-lime">+{preview.xp}</span>
          <span className="text-[14px] text-ink-dim">XP</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {Object.entries(preview.statGains).map(([k, v]) => (
            <span key={k} className="text-[14px] text-ink-dim">
              {k} +{v}
            </span>
          ))}
        </div>
        <div className="text-[14px] text-ink-faint mt-3 leading-relaxed">
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
/**
 * The streak, on fire.
 *
 * Two hundred days and three days rendered identically, which made the number
 * the app asks you to protect the most look like the least. Heat runs from
 * nothing at day zero to everything at a hundred, and it drives the glow, how
 * many embers are lit and how quickly they climb — so the difference between a
 * good week and a good year is visible from across the room.
 */
function StreakFlame({ days }) {
  const tier = streakTier(days)
  const heat = Math.min(1, days / 100)
  const embers = days >= 3 ? Math.min(6, 1 + Math.floor(days / 14)) : 0

  return (
    <div className="text-right shrink-0">
      <div className="label text-ink-faint">Streak</div>
      <div className="streak-flame mt-1.5" style={{ '--heat': heat.toFixed(2) }}>
        {heat > 0 && <span className="streak-halo" aria-hidden="true" />}
        {Array.from({ length: embers }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="streak-ember"
            style={{
              left: `${18 + (i * 37) % 64}%`,
              '--drift': `${(i % 2 ? 1 : -1) * (3 + i)}px`,
              animationDelay: `${(i * 0.43).toFixed(2)}s`,
            }}
          />
        ))}
        <span className="streak-n figure text-[24px]" style={{ color: 'var(--tone-orange)' }}>
          {days}
        </span>
      </div>
      <div className="label text-ink-faint mt-1">{tier.label}</div>
    </div>
  )
}

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
 * One green button.
 *
 * TRAIN used to open on a wall of twelve activity cards and a list of plans
 * above them — a menu you read before you had decided anything. You look at a
 * menu when you have already decided to do something, so the menu moved behind
 * the decision: press go, then say what.
 */
function StartBlock({ onStart, onImport }) {
  return (
    <div className="space-y-2">
      <Btn full size="lg" variant="go" onClick={onStart}>
        START WORKOUT
      </Btn>
      <button
        onClick={onImport}
        className="w-full min-h-[44px] flex items-center justify-center gap-2 text-[14px] text-ink-dim hover:text-ink active:brightness-125"
      >
        <Icon name="swap" size={13} color="currentColor" />
        Import a workout
      </button>
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
function Pick() {
  const { state, startSession, deleteRoutine, setEfforts, importWorkout } = useGame()
  const [starting, setStarting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [sessions, setSessions] = useState(false)
  const [efforts, setEditingEfforts] = useState(false)

  return (
    <>
      <div className="stack-in p-4 space-y-4">
        <WeekHeader weeks={state.weeks} streak={state.player.streak} />

        <StartBlock onStart={() => setStarting(true)} onImport={() => setImporting(true)} />

        <BestEfforts
          bests={state.bests ?? {}}
          picks={state.player.efforts ?? []}
          onEdit={() => setEditingEfforts(true)}
        />

        <Coverage log={state.log} custom={state.exercises ?? NONE} />

        <LiftBoard records={state.records} log={state.log} />

        <SessionsRow log={state.log} onOpen={() => setSessions(true)} />
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
          picks={state.player.efforts ?? []}
          onClose={() => setEditingEfforts(false)}
          onSave={setEfforts}
        />
      )}
    </>
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
      <span className="font-display text-[12px] text-ink-dim">{act?.name.toUpperCase()}</span>
      <span className="text-[15px] text-lime ml-auto tabular-nums">{clock(elapsedMs(session))}</span>
      <Icon name="chevron" size={10} color="var(--color-ink-faint)" />
    </button>
  )
}
