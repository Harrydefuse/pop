import { useEffect, useState } from 'react'

const NODES = [
  { id: 'trigger', x: 20, label: 'TRIGGER', sub: 'new lead' },
  { id: 'condition', x: 220, label: 'CONDITION', sub: 'score > 80' },
  { id: 'action', x: 420, label: 'ACTION', sub: 'notify + draft' },
  { id: 'relay', x: 620, label: 'RELAY', sub: 'to closer' },
]

const Y = 90

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const listener = (e) => setReduced(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])
  return reduced
}

export default function RelaySchematic() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <>
      <div className="flex flex-col sm:hidden">
        {NODES.map((node, i) => (
          <div key={node.id}>
            <div
              className={`rounded-sm border p-4 ${
                i === NODES.length - 1 ? 'border-signal' : 'border-panel-line'
              } bg-panel-raised`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${i === NODES.length - 1 ? 'bg-signal' : 'bg-relay'}`} />
                <span className="font-mono text-xs tracking-wide text-ink">{node.label}</span>
              </div>
              <p className="mt-1 pl-4 font-mono text-[11px] text-ink-faint">{node.sub}</p>
            </div>
            {i < NODES.length - 1 && (
              <div className="relative mx-auto h-6 w-px bg-panel-line">
                {!reducedMotion && (
                  <div className="signal-pulse-travel absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-relay" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <svg
        viewBox="0 0 760 180"
        className="hidden w-full max-w-3xl sm:block"
        role="img"
        aria-label="Diagram of an automation: a new lead trigger flows through a condition check into an action, then relays to a closer."
      >
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {NODES.slice(0, -1).map((node, i) => {
        const next = NODES[i + 1]
        const pathId = `path-${node.id}`
        return (
          <g key={node.id}>
            <path
              id={pathId}
              d={`M ${node.x + 130} ${Y} H ${next.x - 10}`}
              stroke="#232a3d"
              strokeWidth="1.5"
              fill="none"
            />
            {!reducedMotion && (
              <circle r="3.5" fill="#5fd4c4" filter="url(#glow)">
                <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${i * 0.5}s`}>
                  <mpath href={`#${pathId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.85;1"
                  dur="2.6s"
                  repeatCount="indefinite"
                  begin={`${i * 0.5}s`}
                />
              </circle>
            )}
          </g>
        )
      })}

      {NODES.map((node, i) => (
        <g key={node.id} transform={`translate(${node.x}, ${Y - 34})`}>
          <rect
            width="130"
            height="68"
            rx="4"
            fill="#131826"
            stroke={i === NODES.length - 1 ? '#ff7a33' : '#232a3d'}
            strokeWidth="1.2"
          />
          <circle cx="16" cy="18" r="3" fill={i === NODES.length - 1 ? '#ff7a33' : '#5fd4c4'} />
          <text x="16" y="42" fontFamily="IBM Plex Mono, monospace" fontSize="12" letterSpacing="0.5" fill="#f4f1ea">
            {node.label}
          </text>
          <text x="16" y="58" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#5a6178">
            {node.sub}
          </text>
        </g>
      ))}
      </svg>
    </>
  )
}
