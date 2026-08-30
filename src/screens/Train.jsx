import { useEffect, useRef, useState } from 'react'
import { Btn, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { useGame } from '../game/useGame'
import { MIN_SESSION_S, TRACKED, clock, elapsedMs, pace, sessionAmount, stepMetres } from '../game/session'
import { ACTIVITIES } from '../game/config'
import { minutesOf, resolveActivity } from '../game/engine'
import { alpha } from '../game/color'

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
        last.current = now
        cb.current(now, stepMetres(prev, now, prev ? (now.t - prev.t) / 1000 : 0))
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

/** The stopwatch. Everything the log needs is read off it. */
function Running({ session, act }) {
  const { pauseSession, resumeSession, finishSession, discardSession, sessionFix, state } = useGame()
  const [, tick] = useState(0)
  const gps = useTrace(session, (point, metres) => sessionFix(point, metres))

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const ms = elapsedMs(session)
  const secs = Math.floor(ms / 1000)
  const ready = secs >= MIN_SESSION_S
  const amount = sessionAmount(act, ms, session.metres)
  const preview = resolveActivity(state.player, { activityId: act.id, amount, verified: true })
  const km = session.metres / 1000
  const p = pace(ms, session.metres)

  return (
    <div className="p-3 space-y-3">
      <Panel className="p-4 text-center" accent="var(--color-lime)">
        <SectionTitle color="var(--color-lime)">{session.paused ? 'PAUSED' : act.name.toUpperCase()}</SectionTitle>
        <div className="font-mono text-[44px] leading-none text-ink tabular-nums" aria-live="off">
          {clock(ms)}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="border border-line p-2.5">
            <div className="font-pixel text-[6px] text-ink-faint">{WANTS_GPS.has(act.id) ? 'DISTANCE' : 'COUNTS AS'}</div>
            <div className="font-mono text-[16px] text-ink mt-1">
              {WANTS_GPS.has(act.id) ? `${km.toFixed(2)} km` : `${amount} ${act.unit}`}
            </div>
          </div>
          <div className="border border-line p-2.5">
            <div className="font-pixel text-[6px] text-ink-faint">{p ? 'PACE' : 'XP SO FAR'}</div>
            <div className="font-mono text-[16px] text-lime mt-1">{p ?? `+${preview.xp}`}</div>
          </div>
        </div>

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
            <Btn full onClick={resumeSession}>
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
            style={ready ? { background: 'var(--color-lime)', borderColor: 'var(--color-lime)', color: '#ffffff' } : undefined}
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
            return (
              <div key={l.id} className="flex items-center gap-2.5">
                <Icon name={act.icon} size={12} color={TINT[act.id] ?? 'var(--color-ink-faint)'} />
                <span className="font-pixel text-[7px] text-ink-dim w-[74px] shrink-0">{act.name.toUpperCase()}</span>
                <span className="font-mono text-[11px] text-ink">
                  {l.amount} {l.amount === 1 ? act.unit.replace(/s$/, '') : act.unit}
                </span>
                <span className="font-mono text-[11px] text-lime ml-auto">+{l.xp}</span>
                <span className="font-mono text-[10px] text-ink-faint w-[62px] text-right shrink-0">{ago(l.at)}</span>
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
