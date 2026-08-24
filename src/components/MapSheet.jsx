import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Btn, Modal, Panel } from './ui'
import Icon from './Icon'
import PixelMap from './PixelMap'
import { metres, projector, revealAround } from '../game/mapgeo'
import { CITY } from '../game/city'
import { useGame } from '../game/useGame'

const W = 176
const H = 232

/** A plausible loop: the Quay, down George, around Hyde Park and the Domain. */
const DEMO_ROUTE = [
  [151.2098, -33.8598], [151.2090, -33.8620], [151.2085, -33.8645], [151.2078, -33.8670],
  [151.2072, -33.8695], [151.2065, -33.8731], [151.2085, -33.8729], [151.2105, -33.8728],
  [151.2128, -33.8727], [151.2132, -33.8700], [151.2136, -33.8672], [151.2160, -33.8660],
  [151.2185, -33.8648], [151.2160, -33.8630], [151.2135, -33.8622], [151.2115, -33.8612],
  [151.2098, -33.8610], [151.2098, -33.8598],
]

/** Walks the route at a fixed pace, emitting a point every tick. */
function interpolate(route, step = 0.00018) {
  const out = []
  for (let i = 0; i < route.length - 1; i++) {
    const [a, b] = [route[i], route[i + 1]]
    const d = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.max(1, Math.round(d / step))
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n])
  }
  out.push(route[route.length - 1])
  return out
}

export default function MapSheet({ onClose }) {
  const { state, explore, log } = useGame()
  const project = useMemo(() => projector(CITY.bbox, W, H), [])
  const [revealed, setRevealed] = useState(() => new Set(state.explored ?? []))
  const [route, setRoute] = useState([])
  const [live, setLive] = useState(null)
  const [running, setRunning] = useState(false)
  const [km, setKm] = useState(0)
  const [gps, setGps] = useState(null)
  const timer = useRef(null)

  const total = W * H
  const pct = revealed.size / total

  useEffect(() => () => clearInterval(timer.current), [])

  const finish = useCallback(
    (path, distance) => {
      setRunning(false)
      clearInterval(timer.current)
      setLive(null)
      if (distance > 0.05) {
        explore([...revealed])
        log({ activityId: 'run', amount: Math.round(distance * 10) / 10, verified: true, source: 'GPS' })
      }
    },
    [explore, log, revealed],
  )

  const startDemo = () => {
    const path = interpolate(DEMO_ROUTE)
    let i = 0
    let dist = 0
    const seen = new Set(revealed)
    setRoute([])
    setKm(0)
    setRunning(true)
    timer.current = setInterval(() => {
      const p = path[i]
      if (!p) return finish(path, dist)
      if (i > 0) dist += metres(path[i - 1], p) / 1000
      revealAround(seen, project, p, 3)
      setRevealed(new Set(seen))
      setRoute((r) => [...r, p])
      setLive(p)
      setKm(dist)
      i += 1
    }, 45)
  }

  /** Real positioning, to show the plumbing is the same either way. */
  const locate = () => {
    if (!navigator.geolocation) return setGps({ error: 'This browser has no location support.' })
    setGps({ pending: true })
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { longitude: lon, latitude: lat, accuracy } = p.coords
        const [w0, s0, e0, n0] = CITY.bbox
        setGps({ lon, lat, accuracy, inside: lon >= w0 && lon <= e0 && lat >= s0 && lat <= n0 })
      },
      (e) => setGps({ error: e.message }),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <Modal open onClose={running ? undefined : onClose} wide title="YOUR CITY" accent="var(--color-lime)">
      <Panel corners={false} className="p-2">
        <PixelMap width={W} height={H} revealed={revealed} route={route} live={live} />
      </Panel>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[8px] text-ink-faint">CITY EXPLORED</span>
          <span className="font-mono text-[12px] text-lime">{(pct * 100).toFixed(1)}%</span>
        </div>
        <Bar pct={pct} color="var(--color-lime)" height={6} className="mt-2" />
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Streets stay dark until you have actually been down them. Run somewhere new and it is yours for good.
        </div>
      </div>

      {running ? (
        <Panel corners={false} className="p-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[8px] text-lime">TRACKING</span>
            <span className="font-mono text-[15px] text-lime">{km.toFixed(2)} km</span>
          </div>
        </Panel>
      ) : (
        <>
          <Btn full variant="primary" className="mt-3" onClick={startDemo}>
            RUN THE DEMO ROUTE
          </Btn>
          <Btn full variant="ghost" className="mt-2" onClick={locate}>
            USE MY REAL LOCATION
          </Btn>
        </>
      )}

      {gps && (
        <div className="mt-2.5 border border-line bg-panel-2 p-2.5 text-[11px] leading-snug">
          {gps.pending && <span className="text-ink-dim">Asking your device…</span>}
          {gps.error && <span className="text-danger">{gps.error}</span>}
          {gps.lon != null && (
            <>
              <div className="font-mono text-ink">
                {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)} · ±{Math.round(gps.accuracy)}m
              </div>
              <div className="text-ink-dim mt-1">
                {gps.inside
                  ? 'You are inside the mapped area — a real run would draw here.'
                  : 'Outside the mapped area. Only the Sydney CBD is drawn so far, so there is nothing to reveal where you are.'}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 mt-3">
        <span className="mt-0.5 shrink-0">
          <Icon name="spark" size={11} color="var(--color-ink-faint)" />
        </span>
        <p className="text-[10px] text-ink-faint leading-relaxed">
          Prototype. Streets are hand-placed from the real layout, not surveyed. A browser can only track while the app
          is open — background tracking needs a native build.
        </p>
      </div>
    </Modal>
  )
}
