import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_ZOOM = 7

/**
 * A window onto something bigger than the screen. Drag to pan, pinch or scroll
 * to zoom, double tap to go in — and buttons and arrow keys for everyone who
 * cannot do any of that.
 *
 * `content` rides the transform. The children function gets the live view so
 * markers can be placed at screen positions and stay their own size no matter
 * how far in you are.
 */
export default function MapViewport({ w, h, content, children, label = 'Map', className = '' }) {
  const box = useRef(null)
  const pointers = useRef(new Map())
  const pinch = useRef(null)
  const tap = useRef(0)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = size.w && size.h ? Math.min(size.w / w, size.h / h) : 0

  /** Never let the map come off its own edges — a blank corner reads as a bug. */
  const clamp = useCallback(
    (v) => {
      const s = Math.min(Math.max(v.s, fit), fit * MAX_ZOOM)
      const span = (content, screen) => {
        const c = content * s
        return c <= screen ? [(screen - c) / 2, (screen - c) / 2] : [screen - c, 0]
      }
      const [xlo, xhi] = span(w, size.w)
      const [ylo, yhi] = span(h, size.h)
      return { s, x: Math.min(Math.max(v.x, xlo), xhi), y: Math.min(Math.max(v.y, ylo), yhi) }
    },
    [fit, w, h, size.w, size.h],
  )

  useEffect(() => {
    if (!fit) return
    setView((v) => clamp(v ?? { s: fit, x: 0, y: 0 }))
  }, [fit, clamp])

  /** Zoom keeps whatever is under your fingers under your fingers. */
  const zoomTo = useCallback(
    (factor, px, py) => {
      setView((v) => {
        if (!v) return v
        const s = Math.min(Math.max(v.s * factor, fit), fit * MAX_ZOOM)
        const k = s / v.s
        return clamp({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k })
      })
    },
    [clamp, fit],
  )

  const local = (e) => {
    const r = box.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onDown = (e) => {
    box.current.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, local(e))
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  const onMove = (e) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const now = local(e)
    pointers.current.set(e.pointerId, now)

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch.current && dist > 0) zoomTo(dist / pinch.current, (a.x + b.x) / 2, (a.y + b.y) / 2)
      pinch.current = dist
      return
    }
    setView((v) => (v ? clamp({ ...v, x: v.x + now.x - prev.x, y: v.y + now.y - prev.y }) : v))
  }

  const onUp = (e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  // Bound by hand rather than through React, which registers wheel passively —
  // and a passive listener cannot stop the page scrolling under the map.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomTo(Math.exp(-e.deltaY / 320), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomTo])

  // Double tap goes in, and goes back out again once you are all the way in, so
  // one gesture is enough to get around.
  const onTap = (e) => {
    const t = performance.now()
    if (t - tap.current < 320) {
      const p = local(e)
      zoomTo(view && view.s > fit * MAX_ZOOM - 0.01 ? fit / view.s : 1.9, p.x, p.y)
      tap.current = 0
    } else tap.current = t
  }

  const onKey = (e) => {
    const step = 60
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    if (moves[e.key]) {
      e.preventDefault()
      const [dx, dy] = moves[e.key]
      setView((v) => (v ? clamp({ ...v, x: v.x + dx, y: v.y + dy }) : v))
    } else if (e.key === '+' || e.key === '=') zoomTo(1.4, size.w / 2, size.h / 2)
    else if (e.key === '-' || e.key === '_') zoomTo(1 / 1.4, size.w / 2, size.h / 2)
  }

  const zoomed = view && fit ? view.s / fit : 1

  return (
    <div className={`relative overflow-hidden touch-none ${className}`}>
      <div
        ref={box}
        tabIndex={0}
        role="application"
        aria-label={`${label}. Drag to move, pinch or use the zoom buttons to get closer.`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
        onClick={onTap}
        onKeyDown={onKey}
        className="absolute inset-0 cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        <div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            width: w,
            height: h,
            transform: view ? `translate(${view.x}px, ${view.y}px) scale(${view.s})` : 'scale(0)',
            imageRendering: view && view.s >= 0.85 ? 'pixelated' : 'auto',
          }}
        >
          {typeof content === 'function'
            ? // On the first render there is no view yet — the container has not
              // been measured — so hand the content the fitted default.
              content(view ? { ...view, fit, zoom: fit ? view.s / fit : 1 } : { s: fit, x: 0, y: 0, fit, zoom: 1 })
            : content}
        </div>
        {view && children?.({ ...view, fit, zoom: fit ? view.s / fit : 1, box: size })}
      </div>

      <div className="absolute right-1.5 bottom-1.5 flex flex-col gap-1">
        {[
          ['+', 1.5, 'Zoom in'],
          ['-', 1 / 1.5, 'Zoom out'],
        ].map(([sign, factor, name]) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            onClick={() => zoomTo(factor, size.w / 2, size.h / 2)}
            className="w-11 h-11 grid place-items-center font-pixel text-[12px] active:brightness-125"
            style={{ background: '#2a1e12', color: '#f0e3bc', boxShadow: 'inset 0 0 0 1px #a16207' }}
          >
            {sign}
          </button>
        ))}
        {zoomed > 1.05 && (
          <button
            type="button"
            aria-label="Show the whole map"
            onClick={() => setView({ s: fit, x: (size.w - w * fit) / 2, y: (size.h - h * fit) / 2 })}
            className="w-11 h-11 grid place-items-center font-pixel text-[7px] active:brightness-125"
            style={{ background: '#2a1e12', color: '#e8d9b4', boxShadow: 'inset 0 0 0 1px #a16207' }}
          >
            ALL
          </button>
        )}
      </div>
    </div>
  )
}
