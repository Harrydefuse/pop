import { useLayoutEffect, useMemo, useRef, useState } from 'react'

/**
 * The idea, drawn.
 *
 * Candles plus the four things that make it a trade rather than a chart: the
 * structural levels, the entry, the stop, and the targets. Risk and reward are
 * shaded bands rather than bare lines, because the honest comparison is
 * *areas* — how far you are risking against how far you are playing for — and a
 * pair of lines lets the eye skip that.
 *
 * Colour carries direction only where it is redundant with position: the risk
 * band is always on the losing side of entry, the reward band always on the
 * winning side, in both a long and a short. Every band is also labelled.
 */

/**
 * The left gutter holds the R multiples, so those labels never sit on top of a
 * candle; the right one holds the price labels for every horizontal line.
 */
const GUTTERS = { top: 14, right: 96, bottom: 22, left: 78 }

/**
 * Fixed gutters would eat two thirds of a phone-width chart, so they shrink
 * with the frame — but never below the point where a price label is clipped.
 */
function padding(width) {
  return {
    ...GUTTERS,
    left: Math.max(Math.min(GUTTERS.left, width * 0.14), 44),
    right: Math.max(Math.min(GUTTERS.right, width * 0.2), 62),
  }
}

export default function IdeaChart({ idea, height = 280 }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(760)
  const [hoverIndex, setHoverIndex] = useState(null)

  // Measured, not assumed. An SVG with a viewBox wider or narrower than its box
  // letterboxes itself, which silently inset the whole chart before this.
  useLayoutEffect(() => {
    const element = wrapRef.current
    if (!element) return undefined
    const apply = () => setWidth(Math.max(element.clientWidth, 320))
    apply()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(apply)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const { setup, drawings } = idea ?? {}
  const pad = useMemo(() => padding(width), [width])

  // Below ~3px a candle is a coloured tick with no readable body, so a narrow
  // chart shows fewer bars rather than an unreadable smear of all of them.
  const candles = useMemo(() => {
    const all = idea?.candles ?? []
    const fits = Math.floor((width - pad.left - pad.right) / 3)
    return fits > 0 && all.length > fits ? all.slice(-fits) : all
  }, [idea, width, pad])

  const geometry = useMemo(() => {
    if (candles.length === 0 || !setup) return null

    // The price scale must contain the whole idea, not just the candles: a stop
    // drawn outside the frame is the one number a reader most needs to see.
    const anchors = [
      ...candles.map((candle) => candle.high),
      ...candles.map((candle) => candle.low),
      setup.entry,
      setup.stop,
      ...setup.targets,
      ...(drawings?.levels ?? []).map((level) => level.price),
    ].filter((value) => Number.isFinite(value))

    const min = Math.min(...anchors)
    const max = Math.max(...anchors)
    const span = max - min || Math.max(Math.abs(max) * 0.02, 1e-9)
    const lo = min - span * 0.06
    const hi = max + span * 0.06

    const plotWidth = Math.max(width - pad.left - pad.right, 10)
    const plotHeight = height - pad.top - pad.bottom
    const step = plotWidth / candles.length
    const x = (index) => pad.left + index * step + step / 2
    const y = (value) => pad.top + plotHeight - ((value - lo) / (hi - lo)) * plotHeight

    return { x, y, lo, hi, step, plotWidth, plotHeight, bodyWidth: Math.max(step * 0.62, 1) }
  }, [candles, setup, drawings, width, height, pad])

  if (!geometry) {
    return (
      <div
        className="flex items-center justify-center rounded border border-dashed border-panel-line text-sm text-ink-faint"
        style={{ height }}
      >
        No candles for this idea.
      </div>
    )
  }

  const { x, y, bodyWidth, plotWidth, plotHeight } = geometry
  const long = setup.side === 'long'
  const target1 = setup.targets[0]
  const lastTarget = setup.targets[setup.targets.length - 1]

  const band = (from, to) => {
    const top = Math.min(y(from), y(to))
    const bottom = Math.max(y(from), y(to))
    return { y: top, height: Math.max(bottom - top, 1) }
  }
  const riskBand = band(setup.entry, setup.stop)
  const rewardBand = band(setup.entry, target1)

  const handleMove = (event) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    const index = Math.floor((event.clientX - box.left - pad.left) / Math.max(geometry.step, 1))
    setHoverIndex(index >= 0 && index < candles.length ? index : null)
  }

  const active = hoverIndex === null ? null : candles[hoverIndex]

  // Every horizontal line wants a label in the right gutter, and two lines a few
  // pixels apart would overprint. Trade lines win; a level that collides with
  // one keeps its line and loses its text.
  const tradeLines = [
    { value: setup.stop, label: 'Stop', colour: 'var(--color-loss)', dash: '5 3', weight: 1.25 },
    { value: setup.entry, label: 'Entry', colour: 'var(--color-ink)', dash: null, weight: 1.5 },
    ...setup.targets.map((target, index) => ({
      value: target,
      label: `T${index + 1}`,
      colour: 'var(--color-gain)',
      dash: '5 3',
      weight: 1.25,
    })),
  ]
  const occupied = tradeLines.map((line) => y(line.value))
  const clear = (value) => occupied.every((taken) => Math.abs(taken - y(value)) > 9)

  return (
    <div className="relative" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={
          `${idea.symbol} ${idea.interval} ${setup.side} setup: entry ${price(setup.entry)}, ` +
          `stop ${price(setup.stop)}, first target ${price(target1)}, ` +
          `reward-to-risk ${setup.riskReward.toFixed(2)} to 1.`
        }
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="overflow-visible"
      >
        {/* Reward first, then risk: the later paint wins any overlap, and the
            stop is the line that must never be obscured. */}
        <rect
          x={pad.left}
          y={rewardBand.y}
          width={plotWidth}
          height={rewardBand.height}
          fill="var(--color-gain)"
          fillOpacity="0.09"
        />
        <rect
          x={pad.left}
          y={riskBand.y}
          width={plotWidth}
          height={riskBand.height}
          fill="var(--color-loss)"
          fillOpacity="0.12"
        />

        {/* Structural levels: recessive, but each labelled with its touch count,
            which is the whole reason it is on the chart. */}
        {(drawings?.levels ?? []).map((level) => (
          <g key={`level-${level.price}`}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(level.price)}
              y2={y(level.price)}
              stroke="var(--color-chart-narrative)"
              strokeWidth="1"
              strokeOpacity="0.45"
              strokeDasharray="2 4"
            />
            {clear(level.price) ? (
              <text
                x={width - pad.right + 5}
                y={y(level.price) + 3}
                className="fill-ink-faint font-mono text-[9px]"
              >
                {level.touches}× {price(level.price)}
              </text>
            ) : null}
          </g>
        ))}

        {candles.map((candle, index) => {
          const up = candle.close >= candle.open
          const colour = up ? 'var(--color-gain)' : 'var(--color-loss)'
          const bodyTop = y(Math.max(candle.open, candle.close))
          const bodyBottom = y(Math.min(candle.open, candle.close))
          return (
            <g key={candle.openTime ?? index} opacity={hoverIndex === null || hoverIndex === index ? 1 : 0.55}>
              <line
                x1={x(index)}
                x2={x(index)}
                y1={y(candle.high)}
                y2={y(candle.low)}
                stroke={colour}
                strokeWidth="1"
                strokeOpacity="0.8"
              />
              <rect
                x={x(index) - bodyWidth / 2}
                y={bodyTop}
                width={bodyWidth}
                // A doji has zero body height and would vanish entirely.
                height={Math.max(bodyBottom - bodyTop, 1)}
                fill={colour}
                fillOpacity={up ? 0.75 : 0.9}
              />
            </g>
          )
        })}

        {tradeLines.map((line) => (
          <g key={`${line.label}-${line.value}`}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(line.value)}
              y2={y(line.value)}
              stroke={line.colour}
              strokeWidth={line.weight}
              strokeDasharray={line.dash ?? undefined}
            />
            <text
              x={width - pad.right + 5}
              y={y(line.value) + 3}
              className="font-mono text-[10px]"
              fill={line.colour}
            >
              {line.label} {price(line.value)}
            </text>
          </g>
        ))}

        {/* R multiples in the left gutter, vertically centred on the band each
            one names — never over the candles, where they compete with price. */}
        {[
          { y: rewardBand.y + rewardBand.height / 2, text: `${setup.riskReward.toFixed(2)}R`, colour: 'var(--color-gain)', caption: 'reward' },
          { y: riskBand.y + riskBand.height / 2, text: '1R', colour: 'var(--color-loss)', caption: 'risk' },
        ].map((mark) => (
          <g key={mark.caption}>
            <text x={pad.left - 8} y={mark.y} textAnchor="end" className="font-mono text-[11px]" fill={mark.colour}>
              {mark.text}
            </text>
            <text x={pad.left - 8} y={mark.y + 11} textAnchor="end" className="fill-ink-faint font-mono text-[9px]">
              {mark.caption}
            </text>
          </g>
        ))}

        {active ? (
          <line
            x1={x(hoverIndex)}
            x2={x(hoverIndex)}
            y1={pad.top}
            y2={pad.top + plotHeight}
            stroke="var(--color-ink-faint)"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        ) : null}
      </svg>

      <p className="mt-1 font-mono text-[10px] text-ink-faint">
        {candles.length} × {idea.interval} candles · dotted lines are structural levels, labelled with how many
        times price turned there · {long ? 'long' : 'short'} plays from {price(setup.entry)} to{' '}
        {price(lastTarget)}
      </p>

      {active ? (
        <div
          className="pointer-events-none absolute top-1 rounded border border-panel-line bg-panel/95 px-2 py-1 font-mono text-[10px] whitespace-nowrap text-ink shadow-lg"
          style={{ left: `min(calc(100% - 12rem), max(0px, ${x(hoverIndex)}px - 4rem))` }}
        >
          O {price(active.open)} H {price(active.high)} L {price(active.low)} C {price(active.close)}
        </div>
      ) : null}
    </div>
  )
}

/** Prices here span many orders of magnitude, so significant digits beat decimals. */
function price(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n >= 1000 ? n.toFixed(0) : n.toPrecision(5)
}
