import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useSpineNodes } from './SpineContext'

function SpineNodeDot({ label, scrollYProgress, ratio }) {
  const lit = useTransform(scrollYProgress, [Math.max(0, ratio - 0.03), ratio], [0, 1])
  const scale = useTransform(lit, [0, 1], [0.7, 1.3])
  const backgroundColor = useTransform(lit, [0, 1], ['#232a3d', '#ff7a33'])
  const boxShadow = useTransform(
    lit,
    [0, 1],
    ['0 0 0 rgba(255,122,51,0)', '0 0 10px 2px rgba(255,122,51,0.55)']
  )

  return (
    <div className="group relative flex items-center">
      <motion.span className="block h-2.5 w-2.5 rounded-full" style={{ scale, backgroundColor, boxShadow }} />
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

export default function SignalRail() {
  const { scrollYProgress } = useScroll()
  const nodes = useSpineNodes()
  const [ratios, setRatios] = useState({})

  useEffect(() => {
    function measure() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const next = {}
      nodes.forEach(({ id, ref }) => {
        if (ref.current) {
          const top = ref.current.getBoundingClientRect().top + window.scrollY
          next[id] = Math.min(1, Math.max(0, top / docHeight))
        }
      })
      setRatios(next)
    }
    measure()
    window.addEventListener('resize', measure)
    const t = setTimeout(measure, 400)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(t)
    }
  }, [nodes])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-8 top-0 z-40 hidden h-screen w-px lg:block"
    >
      <div className="relative mt-[15vh] h-[70vh] w-px bg-panel-line">
        <motion.div
          className="absolute left-0 top-0 w-px origin-top bg-signal"
          style={{ scaleY: scrollYProgress, height: '100%', boxShadow: '0 0 8px 1px rgba(255,122,51,0.5)' }}
        />
        <div className="signal-pulse-travel absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-relay" />
        {nodes.map((node) => (
          <div key={node.id} className="pointer-events-auto absolute -left-[3px]" style={{ top: `${(ratios[node.id] ?? 0) * 100}%` }}>
            <SpineNodeDot label={node.label} scrollYProgress={scrollYProgress} ratio={ratios[node.id] ?? 0} />
          </div>
        ))}
      </div>
    </div>
  )
}
