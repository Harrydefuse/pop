import { useMemo, useRef, useState } from 'react'
import { clockTime, signedPct, usd } from '../format.js'

/**
 * Equity curve. One series, so no legend — the title names it. The dashed
 * reference line at the starting bankroll carries the up/down read, which is
 * why the line itself keeps one fixed hue instead of recolouring by outcome.
 *
 * Hover gives a crosshair and a tooltip; the last point is direct-labelled.
 */
const PAD = { top: 16, right: 64, bottom: 26, left: 52 }

export default function EquityChart({ samples, startingCashUsd, height = 220 }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [width, setWidth] = useState(720)

  const points = useMemo(
    () => (samples ?? []).filter((sample) => Number.isFinite(Number(sample.equityUsd))),
    [samples],
  )

  const geometry = useMemo(() => {
    if (points.length === 0) return null

    const values = points.map((point) => Number(point.equityUsd))
    const baseline = Number(startingCashUsd) || values[0]
    // Always keep the baseline in frame, and pad so the line never touches the edge.
    const min = Math.min(...values, baseline)
    const max = Math.max(...values, baseline)
    const span = max - min || Math.max(Math.abs(max) * 0.02, 1)
    const lo = min - span * 0.12
    const hi = max + span * 0.12

    const plotWidth = Math.max(width - PAD.left - PAD.right, 10)
    const plotHeight = height - PAD.top - PAD.bottom
    const x = (index) =>
      PAD.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
    const y = (value) => PAD.top + plotHeight - ((value - lo) / (hi - lo)) * plotHeight

    return {
      x,
      y,
      lo,
      hi,
      baseline,
      baselineY: y(baseline),
      plotWidth,
      plotHeight,
      path: points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(Number(point.equityUsd))}`).join(' '),
      areaPath: [
        `M${x(0)},${y(baseline)}`,
        ...points.map((point, index) => `L${x(index)},${y(Number(point.equityUsd))}`),
        `L${x(points.length - 1)},${y(baseline)}`,
        'Z',
      ].join(' '),
    }
  }, [points, startingCashUsd, width, height])

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded border border-panel-line border-dashed text-sm text-ink-faint"
        style={{ height }}
      >
        No equity samples yet — the curve starts after the first cycle.
      </div>
    )
  }

  const last = points[points.length - 1]
  const lastValue = Number(last.equityUsd)
  const change = geometry.baseline > 0 ? (lastValue - geometry.baseline) / geometry.baseline : 0
  const active = hoverIndex === null ? null : points[hoverIndex]

  const handleMove = (event) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    if (box.width !== width) setWidth(box.width)
    const ratio = (event.clientX - box.left - PAD.left) / Math.max(geometry.plotWidth, 1)
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)))
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`Paper portfolio equity over ${points.length} cycles, currently ${usd(lastValue)}, ${signedPct(change)} against the starting bankroll.`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        onFocus={() => setHoverIndex(points.length - 1)}
        onBlur={() => setHoverIndex(null)}
        tabIndex={0}
        className="overflow-visible focus-visible:outline-none"
      >
        <defs>
          <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-momentum)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-chart-momentum)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive y grid: three ticks, enough to read magnitude without noise. */}
        {[0, 0.5, 1].map((fraction) => {
          const value = geometry.lo + (geometry.hi - geometry.lo) * fraction
          const ty = geometry.y(value)
          return (
            <g key={fraction}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={ty}
                y2={ty}
                stroke="var(--color-panel-line)"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              <text x={PAD.left - 8} y={ty + 3} textAnchor="end" className="fill-ink-faint font-mono text-[10px]">
                {/* Whole dollars only — mixing $1,146 with $982.98 reads as noise. */}
                {usd(Math.round(value))}
              </text>
            </g>
          )
        })}

        {/* x range: first and last sample only — never a label on every point. */}
        <text x={PAD.left} y={height - 6} className="fill-ink-faint font-mono text-[10px]">
          {clockTime(points[0].at)}
        </text>
        <text
          x={width - PAD.right}
          y={height - 6}
          textAnchor="end"
          className="fill-ink-faint font-mono text-[10px]"
        >
          {clockTime(points[points.length - 1].at)}
        </text>

        {/* Reference: the starting bankroll. Recessive, but labelled. */}
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={geometry.baselineY}
          y2={geometry.baselineY}
          stroke="var(--color-panel-line)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text
          x={width - PAD.right + 6}
          y={geometry.baselineY + 3}
          className="fill-ink-faint font-mono text-[10px]"
        >
          start
        </text>

        <path d={geometry.areaPath} fill="url(#equity-fill)" />
        <path
          d={geometry.path}
          fill="none"
          stroke="var(--color-chart-momentum)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active ? (
          <g>
            <line
              x1={geometry.x(hoverIndex)}
              x2={geometry.x(hoverIndex)}
              y1={PAD.top}
              y2={PAD.top + geometry.plotHeight}
              stroke="var(--color-ink-faint)"
              strokeWidth="1"
            />
            <circle
              cx={geometry.x(hoverIndex)}
              cy={geometry.y(Number(active.equityUsd))}
              r="5"
              fill="var(--color-chart-momentum)"
              stroke="var(--color-panel-raised)"
              strokeWidth="2"
            />
          </g>
        ) : null}

        {/* Direct label on the final point — never a number on every point. */}
        <circle
          cx={geometry.x(points.length - 1)}
          cy={geometry.y(lastValue)}
          r="4"
          fill="var(--color-chart-momentum)"
          stroke="var(--color-panel-raised)"
          strokeWidth="2"
        />
        <text
          x={width - PAD.right + 6}
          y={geometry.y(lastValue) + 4}
          className="fill-ink font-mono text-[11px]"
        >
          {usd(lastValue)}
        </text>
      </svg>

      {active ? (
        <div
          className="pointer-events-none absolute top-2 rounded border border-panel-line bg-panel/95 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-ink shadow-lg"
          style={{
            left: `min(calc(100% - 11rem), max(0px, ${geometry.x(hoverIndex)}px - 4rem))`,
          }}
        >
          <div className="tabular">{usd(Number(active.equityUsd))}</div>
          <div className="text-ink-faint">
            {clockTime(active.at)} · {active.openPositions ?? 0} open
          </div>
        </div>
      ) : null}
    </div>
  )
}
