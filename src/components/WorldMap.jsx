import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { groundRuns } from '../game/ground'

/**
 * The map. A real one — streets, labels, the whole world — with the game drawn
 * on top of it rather than instead of it.
 *
 * There used to be two maps here: an illustrated Sydney that carried the fog
 * and the bosses, and a street map that carried your routes. Two maps of the
 * same city is one too many, and the drawn one only worked for people who lived
 * in it. So the street map won, and everything the other one held moved across:
 * the ground you have covered is a tint over the real blocks you walked, and a
 * boss stands at a real address.
 *
 * Leaflet is bundled rather than pulled from a CDN, so the app's code still
 * loads with no network at all. The tiles are the one thing that cannot be:
 * they come off the wire, and where that is blocked — a sandboxed preview, a
 * plane, a locked-down network — the map falls back to drawing your lines on
 * plain ground.
 */

/**
 * The basemap, in the app's own theme.
 *
 * Plain OpenStreetMap is a beautiful reference map and the wrong ground for
 * this: it is loud, and every colour in it competes with a route line drawn on
 * top. Every running app uses a quiet grey base for exactly that reason, so
 * these are CARTO's, which are that same base rendered from OSM data — one for
 * each theme, so the map is not a white rectangle in a dark app.
 *
 * If those cannot be reached the plain OSM tiles are tried next, and if the
 * network is gone entirely the ground underneath carries the route on its own.
 */
const BASEMAPS = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap · © CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap · © CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  },
}

/**
 * A tile source of your own, if you have one. Set VITE_TILE_URL (and
 * VITE_TILE_ATTRIBUTION) at build time and it is used instead of everything
 * below — which is what a shipped app would do, since neither the OSM public
 * server nor CARTO's free basemaps are meant to carry one.
 */
const OVERRIDE = import.meta.env.VITE_TILE_URL
  ? {
      url: import.meta.env.VITE_TILE_URL,
      attribution: import.meta.env.VITE_TILE_ATTRIBUTION ?? '© OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 20,
    }
  : null

/** The fallback: everyone can serve these, and they are always in date. */
const PLAIN_OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap',
  subdomains: 'abc',
  maxZoom: 19,
}

/** Long enough for a slow connection, short enough not to feel broken. */
const TILE_GRACE_MS = 2500

const SYDNEY = [-33.8688, 151.2093]

const themeNow = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

/** A pin is a dot on a stalk, the way every map app draws one. */
function pinIcon({ colour, state }) {
  const ring = state === 'current' ? 'world-pin-live' : ''
  return L.divIcon({
    className: 'world-pin-wrap',
    html: `<span class="world-pin ${ring}" style="--pin:${colour}">${
      state === 'cleared' ? '<span class="world-pin-tick"></span>' : ''
    }</span>`,
    iconSize: [26, 32],
    iconAnchor: [13, 32],
  })
}

export default function WorldMap({
  routes = [],
  ground,
  pins = [],
  onPickPin,
  height = 320,
  className = '',
}) {
  const host = useRef(null)
  const map = useRef(null)
  const groundLayer = useRef(null)
  const routeLayer = useRef(null)
  const pinLayer = useRef(null)
  const base = useRef(null)
  const me = useRef(null)
  const framed = useRef(false)
  // What we want in view, and whether the person has taken over from us.
  const fit = useRef(null)
  const fitting = useRef(false)
  const touched = useRef(false)
  const pick = useRef(onPickPin)
  pick.current = onPickPin
  const [tiles, setTiles] = useState('loading')

  // Set up once. Leaflet owns its own DOM inside the host element, so it must
  // not be torn down and rebuilt every time something on it changes.
  useEffect(() => {
    const el = host.current
    if (!el || map.current) return
    // SVG rather than canvas for the lines and the ground. The counts here are
    // small — the tiles are merged into runs before they are drawn — and the
    // canvas renderer queues its redraws on animation frames, which throws when
    // the sheet is closed in the same frame it opened.
    const m = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      // It is the whole world: pinch, wheel, double-tap and drag all move it,
      // and panning past the date line wraps round rather than running out.
      worldCopyJump: true,
      minZoom: 2,
    }).setView(SYDNEY, 13)
    // Top right, because the bottom of a map screen belongs to the sheet.
    L.control.zoom({ position: 'topright' }).addTo(m)
    // The moment the map is moved on purpose it stops being ours to re-frame.
    m.on('dragstart', () => (touched.current = true))
    m.on('zoomstart', () => {
      if (!fitting.current) touched.current = true
    })
    map.current = m
    // Order matters: ground under the lines, lines under the pins.
    groundLayer.current = L.layerGroup().addTo(m)
    routeLayer.current = L.layerGroup().addTo(m)
    pinLayer.current = L.layerGroup().addTo(m)

    // Try the themed basemap, fall back to plain OSM, and only then give up.
    // Judge by whether anything arrived rather than by counting failures: a
    // blocked host errors on every tile, a slow one simply takes its time.
    let grace
    const light = (src, next) => {
      const layer = L.tileLayer(src.url, {
        attribution: src.attribution,
        subdomains: src.subdomains,
        maxZoom: src.maxZoom,
        detectRetina: true,
        crossOrigin: true,
      })
      let loaded = 0
      layer.on('tileload', () => {
        if (loaded++ === 0) setTiles('ok')
      })
      layer.addTo(m)
      base.current = layer
      grace = setTimeout(() => {
        if (loaded) return
        m.removeLayer(layer)
        if (next) light(next, null)
        else setTiles('blocked')
      }, TILE_GRACE_MS)
    }
    light(OVERRIDE ?? BASEMAPS[themeNow()], OVERRIDE ? null : PLAIN_OSM)

    return () => {
      clearTimeout(grace)
      m.remove()
      map.current = null
      base.current = null
      groundLayer.current = routeLayer.current = pinLayer.current = null
    }
  }, [])

  // The base swaps with the app's theme. It is one attribute on <html>, so the
  // map watches for it rather than being told.
  useEffect(() => {
    const swap = () => {
      const m = map.current
      if (!m || tiles !== 'ok') return
      if (OVERRIDE) return
      const src = BASEMAPS[themeNow()]
      if (base.current?._url === src.url) return
      const layer = L.tileLayer(src.url, {
        attribution: src.attribution,
        subdomains: src.subdomains,
        maxZoom: src.maxZoom,
        detectRetina: true,
        crossOrigin: true,
      }).addTo(m)
      // Only drop the old one once the new one has something to show, or the
      // map blinks white halfway through a theme change.
      layer.once('load', () => base.current && m.removeLayer(base.current))
      const old = base.current
      base.current = layer
      setTimeout(() => old && m.hasLayer(old) && m.removeLayer(old), 1200)
    }
    const mo = new MutationObserver(swap)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [tiles])

  // The ground you have covered. Drawn as filled squares with no stroke, so a
  // run of neighbouring tiles reads as one patch rather than as graph paper.
  useEffect(() => {
    const g = groundLayer.current
    if (!g) return
    g.clearLayers()
    if (!ground?.size) return
    for (const box of groundRuns(ground)) {
      L.rectangle(box, { stroke: false, fillColor: '#22c55e', fillOpacity: 0.22, interactive: false }).addTo(g)
    }
  }, [ground])

  // The lines themselves.
  useEffect(() => {
    const g = routeLayer.current
    if (!g) return
    g.clearLayers()
    for (const route of routes.filter((r) => r.points?.length > 1)) {
      const colour = route.colour ?? '#0e7490'
      // A dark casing under the line, the way every map draws a road: it keeps
      // the route readable over both a pale street map and a dark one.
      L.polyline(route.points, { color: 'rgba(10,14,24,0.55)', weight: 7, lineJoin: 'round' }).addTo(g)
      L.polyline(route.points, { color: colour, weight: 4, lineJoin: 'round' }).addTo(g)
      const end = route.points[route.points.length - 1]
      L.circleMarker(route.points[0], {
        radius: 5,
        color: '#0a0e18',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1,
      }).addTo(g)
      L.circleMarker(end, { radius: 6, color: '#0a0e18', weight: 2, fillColor: colour, fillOpacity: 1 }).addTo(g)
    }
  }, [routes])

  // Where the bosses stand.
  useEffect(() => {
    const g = pinLayer.current
    if (!g) return
    g.clearLayers()
    for (const p of pins) {
      L.marker([p.lat, p.lon], {
        icon: pinIcon(p),
        keyboard: true,
        title: `${p.name} — ${p.where}`,
        alt: `${p.name} at ${p.where}`,
        // The one you are on sits above the ones you have already put down.
        zIndexOffset: p.state === 'current' ? 400 : p.state === 'cleared' ? 0 : 200,
      })
        .on('click', () => pick.current?.(p.id))
        .addTo(g)
    }
  }, [pins])

  // Frame whatever there is to look at, once. Re-fitting on every change would
  // yank the map back to the start the moment you panned away from it, and the
  // move is deliberately not animated — this is where the map opens, not
  // somewhere it travels to.
  useEffect(() => {
    const m = map.current
    if (!m || framed.current) return
    const points = routes.flatMap((r) => r.points ?? [])
    if (points.length > 1) {
      frame(m, L.latLngBounds(points), 16)
      return
    }
    if (ground?.size) {
      frame(m, L.latLngBounds(groundRuns(ground).flat()), 14)
      return
    }
    // Nothing recorded yet: open where the person holding the phone is, rather
    // than on a default city nobody chose.
    if (!navigator.geolocation) return
    let live = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!live) return
        framed.current = true
        map.current?.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate: false })
      },
      () => {},
      { maximumAge: 60000, timeout: 8000 },
    )
    return () => {
      live = false
    }

    function frame(mp, bounds, maxZoom) {
      fit.current = { bounds, maxZoom }
      framed.current = true
      fitting.current = true
      mp.fitBounds(bounds, { padding: [26, 26], maxZoom, animate: false })
      fitting.current = false
    }
  }, [routes, ground])

  // The container has to be told when it changes size, or Leaflet keeps
  // rendering at whatever it measured on the first frame.
  useEffect(() => {
    const el = host.current
    if (!el) return
    // A sheet animates open, so the first measurement Leaflet takes is of a
    // box that is not its final size — and a fit against that box leaves half
    // the route off the edge. Re-fit once the size settles, unless the map has
    // been moved by hand since.
    const ro = new ResizeObserver(() => {
      const m = map.current
      if (!m) return
      m.invalidateSize({ animate: false })
      if (touched.current || !fit.current) return
      fitting.current = true
      m.fitBounds(fit.current.bounds, { padding: [26, 26], maxZoom: fit.current.maxZoom, animate: false })
      fitting.current = false
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // "Where am I" — the button every map app has in the same corner. It is the
  // only thing here that asks for your location without a session running.
  const [locating, setLocating] = useState(false)
  const locate = useCallback(() => {
    const m = map.current
    if (!m || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const at = [pos.coords.latitude, pos.coords.longitude]
        touched.current = true
        m.setView(at, Math.max(m.getZoom(), 15))
        if (me.current) m.removeLayer(me.current)
        me.current = L.circleMarker(at, {
          radius: 7,
          color: '#ffffff',
          weight: 3,
          fillColor: '#2563eb',
          fillOpacity: 1,
        }).addTo(m)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
    )
  }, [])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* The ground, on its own element. Leaflet sets a background on its
          container with a shorthand, so anything painted there is at the mercy
          of which stylesheet the bundler happens to emit last. */}
      <div className="absolute inset-0 route-ground" aria-hidden="true" />
      <div ref={host} className="absolute inset-0 route-map" />

      <button
        type="button"
        onClick={locate}
        aria-label="Centre the map on me"
        className="map-locate"
        data-busy={locating ? '' : undefined}
      >
        <span className="map-locate-ring" aria-hidden="true" />
      </button>

      {/* One line, out of the way. The map still works without streets — your
          line and your ground are drawn either way — so this is a note, not an
          error screen sat on top of the thing it is describing. */}
      {tiles === 'blocked' && (
        <div className="absolute left-2 bottom-2 max-w-[250px] pointer-events-none z-[500]">
          <span className="block bg-panel/95 border border-line rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] text-ink-dim leading-snug">
            No street tiles here — this page can&rsquo;t reach the map servers.
          </span>
        </div>
      )}
    </div>
  )
}
