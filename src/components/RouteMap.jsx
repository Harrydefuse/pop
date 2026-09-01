import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * The routes you actually walked, on a real map.
 *
 * The illustrated Sydney is the game's map — fog, landmarks, a boss standing on
 * a headland. It is the wrong instrument for "show me where I ran on Tuesday",
 * which wants streets, labels and the whole world rather than one hand-traced
 * harbour. So this is a second map with a different job, and the two live under
 * one button.
 *
 * Leaflet is bundled rather than pulled from a CDN, so the app's code still
 * loads with no network at all. The tiles are the one thing that cannot be:
 * they come from OpenStreetMap over the wire, and where that is blocked — a
 * sandboxed preview, a plane, a locked-down network — the map falls back to
 * drawing the route on plain ground. The line is the part that is yours; the
 * streets underneath it are a nicety.
 */

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIB = '© OpenStreetMap'

/** Long enough for a slow connection, short enough not to feel broken. */
const TILE_GRACE_MS = 2500

export default function RouteMap({ routes = [], height = 300, locate = false, className = '' }) {
  const host = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const [tiles, setTiles] = useState('loading')

  // Set up once. Leaflet owns its own DOM inside the host element, so it must
  // not be torn down and rebuilt every time a route changes.
  useEffect(() => {
    const el = host.current
    if (!el || map.current) return
    const m = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    }).setView([-33.8688, 151.2093], 13)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    map.current = m
    layer.current = L.layerGroup().addTo(m)

    const tileLayer = L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIB, crossOrigin: true })
    let loaded = 0
    tileLayer.on('tileload', () => {
      loaded += 1
      setTiles('ok')
    })
    tileLayer.addTo(m)
    // Judge by whether anything arrived rather than by counting failures: a
    // blocked host errors on every tile, a slow one simply takes its time.
    const grace = setTimeout(() => {
      if (loaded === 0) {
        setTiles('blocked')
        m.removeLayer(tileLayer)
      }
    }, TILE_GRACE_MS)

    return () => {
      clearTimeout(grace)
      m.remove()
      map.current = null
      layer.current = null
    }
  }, [])

  // With nothing recorded yet the map would open on a default city nobody
  // chose. One position fix puts it where the person holding the phone is.
  useEffect(() => {
    if (!locate || routes.length || !navigator.geolocation) return
    let live = true
    navigator.geolocation.getCurrentPosition(
      (pos) => live && map.current?.setView([pos.coords.latitude, pos.coords.longitude], 15),
      () => {},
      { maximumAge: 60000, timeout: 8000 },
    )
    return () => {
      live = false
    }
  }, [locate, routes.length])

  // Redraw the lines whenever the set of routes changes.
  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const drawn = routes.filter((r) => r.points?.length > 1)
    if (!drawn.length) return

    for (const route of drawn) {
      const colour = route.colour ?? '#0e7490'
      // A dark casing under the line, the way every map draws a road: it keeps
      // the route readable over both a pale street map and a dark one.
      L.polyline(route.points, { color: 'rgba(10,14,24,0.55)', weight: 7, lineJoin: 'round' }).addTo(g)
      L.polyline(route.points, { color: colour, weight: 4, lineJoin: 'round' }).addTo(g)
      const start = route.points[0]
      const end = route.points[route.points.length - 1]
      L.circleMarker(start, { radius: 5, color: '#0a0e18', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }).addTo(g)
      L.circleMarker(end, { radius: 6, color: '#0a0e18', weight: 2, fillColor: colour, fillOpacity: 1 }).addTo(g)
    }

    const bounds = L.latLngBounds(drawn.flatMap((r) => r.points))
    m.fitBounds(bounds, { padding: [26, 26], maxZoom: 16 })
  }, [routes])

  // The container has to be told when it changes size, or Leaflet keeps
  // rendering at whatever it measured on the first frame.
  useEffect(() => {
    const el = host.current
    if (!el) return
    const ro = new ResizeObserver(() => map.current?.invalidateSize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* The ground, on its own element. Leaflet sets a background on its
          container with a shorthand, so anything painted there is at the mercy
          of which stylesheet the bundler happens to emit last. */}
      <div className="absolute inset-0 route-ground" aria-hidden="true" />
      <div ref={host} className="absolute inset-0 route-map" />
      {tiles === 'blocked' && (
        <div className="absolute left-2 top-2 right-14 pointer-events-none">
          <div className="bg-panel/95 border border-line px-2 py-1.5 leading-snug">
            <div className="font-pixel text-[6px] text-ink-dim">NO STREET TILES HERE</div>
            <div className="font-mono text-[10px] text-ink-faint mt-1">
              Streets come from OpenStreetMap over the internet, and this page cannot reach it. Open the app from a
              normal URL and they appear under your line.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
