import { useEffect, useRef, useState } from 'react'
import { Btn, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { useGame } from '../game/useGame'
import { MIN_SESSION_S, TRACKED, clock, elapsedMs, pace, sessionAmount, stepMetres } from '../game/session'
import { resolveActivity } from '../game/engine'
import { alpha } from '../game/color'

/** Distance activities are the ones worth asking for a GPS fix. */
const WANTS_GPS = new Set(['walk', 'run', 'ride'])

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
            style={ready ? { background: 'var(--color-lime)', borderColor: 'var(--color-lime)', color: '#0b0715' } : undefined}
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

/** Pick something to do. */
function Pick() {
  const { startSession } = useGame()
  return (
    <div className="p-3 space-y-3">
      <Panel corners={false} className="p-3.5">
        <div className="font-pixel text-[11px] text-neon">WHAT ARE YOU DOING?</div>
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Start it here and the app does the counting. Nothing is typed in, so nothing can be made up — the XP costs
          exactly the time it says it does.
        </div>
      </Panel>

      <div>
        <SectionTitle>TRAIN</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {TRACKED.map((a) => (
            <button
              key={a.id}
              onClick={() => startSession(a.id)}
              className="text-left active:brightness-125"
              aria-label={`Start a ${a.name} session`}
            >
              <Panel corners={false} className="p-3 h-full" style={{ background: alpha('#0b0715', 40) }}>
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-11 h-11 shrink-0 border border-line">
                    <Icon name={a.icon} size={20} color="var(--color-neon)" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-pixel text-[8px] text-ink">{a.name.toUpperCase()}</div>
                    <div className="font-mono text-[10px] text-ink-faint mt-1">
                      {a.xp} XP / {a.per} {a.unit}
                    </div>
                  </div>
                </div>
              </Panel>
            </button>
          ))}
        </div>
      </div>
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
