import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Reveal from './Reveal'
import { useSpineNode } from './SpineContext'

const QUOTES = [
  {
    quote:
      "We ripped out four Zapier chains and a duct-taped script. Relay replaced all of it, and the ops team stopped getting paged at 2am.",
    name: 'Priya Nair',
    role: 'Head of Operations, Corsair Labs',
  },
  {
    quote:
      "The replay log is the killer feature. When something looks off, I can see the exact input that triggered it instead of guessing.",
    name: 'Marcus Ude',
    role: 'Platform Lead, Meridian',
  },
  {
    quote:
      "Handoffs used to get lost in Slack. Now the context rides along with the task, so nothing falls through by the third relay.",
    name: 'Elena Vos',
    role: 'RevOps Manager, Harborline',
  },
]

export default function Testimonials() {
  const ref = useSpineNode('testimonials', 'Feedback')
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const t = setInterval(() => setIndex((i) => (i + 1) % QUOTES.length), 5200)
    return () => clearInterval(t)
  }, [paused])

  const active = QUOTES[index]

  return (
    <section ref={ref} className="border-t border-panel-line bg-panel-raised/30 py-28">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
        <Reveal>
          <p className="mb-10 font-mono text-[13px] uppercase tracking-[0.2em] text-signal">In the field</p>
        </Reveal>

        <div
          className="relative min-h-[220px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <blockquote className="font-display text-2xl uppercase leading-snug tracking-tight text-ink sm:text-3xl">
                “{active.quote}”
              </blockquote>
              <figcaption className="mt-6 font-mono text-[13px] uppercase tracking-wider text-ink-faint">
                {active.name} — {active.role}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {QUOTES.map((q, i) => (
            <button
              key={q.name}
              type="button"
              aria-label={`Show testimonial from ${q.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-signal' : 'w-1.5 bg-panel-line hover:bg-ink-faint'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
