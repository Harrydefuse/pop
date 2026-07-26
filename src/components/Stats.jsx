import CountUp from './CountUp'
import Reveal from './Reveal'
import { useSpineNode } from './SpineContext'

const STATS = [
  { to: 2.4, decimals: 1, suffix: 'M', label: 'Tasks relayed / month' },
  { to: 118, suffix: 'K', label: 'Hours handed back to teams' },
  { to: 99.98, decimals: 2, suffix: '%', label: 'Uptime, trailing 12 months' },
  { to: 40, suffix: 's', label: 'Median time-to-fire' },
]

export default function Stats() {
  const ref = useSpineNode('stats', 'Throughput')

  return (
    <section ref={ref} className="border-t border-panel-line py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <p className="font-display text-5xl tracking-tight text-ink sm:text-6xl">
                <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
              </p>
              <p className="mt-2 font-mono text-[12px] uppercase tracking-wider text-ink-faint">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
