import { motion } from 'framer-motion'
import RelaySchematic from './RelaySchematic'
import { useSpineNode } from './SpineContext'

const easeOut = [0.16, 1, 0.3, 1]

export default function Hero() {
  const ref = useSpineNode('hero', 'Signal')

  return (
    <section id="top" ref={ref} className="relative overflow-hidden pb-24 pt-40 lg:pt-48">
      <div className="grid-schematic pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,black,transparent)]" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mb-6 flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.2em] text-relay"
        >
          <span className="h-px w-8 bg-relay/60" />
          Status: 12,406 relays active
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
          className="font-display max-w-4xl text-[clamp(2.4rem,10vw,5.5rem)] font-semibold uppercase leading-[0.95] tracking-tight text-ink"
        >
          Wire the work,
          <br />
          not the workaround.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: easeOut }}
          className="mt-7 max-w-xl text-lg leading-relaxed text-ink-dim"
        >
          Relay is the switchboard for your busywork. Set a trigger, a condition, an action — it
          runs itself from there, every time, without a script you have to babysit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: easeOut }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <a
            href="#pricing"
            className="rounded-sm bg-signal px-6 py-3 font-mono text-sm uppercase tracking-wider text-panel transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(255,122,51,0.5)]"
          >
            Start automating
          </a>
          <a
            href="#how-it-works"
            className="rounded-sm border border-panel-line px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink-dim transition-colors hover:border-ink-dim hover:text-ink"
          >
            See how it runs
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: easeOut }}
          className="mt-20 rounded-md border border-panel-line bg-panel-raised/60 p-6 lg:p-10"
        >
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            Live pipeline — sales/lead-routing
          </p>
          <RelaySchematic />
        </motion.div>
      </div>
    </section>
  )
}
