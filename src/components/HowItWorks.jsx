import { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import Reveal from './Reveal'
import { useSpineNode } from './SpineContext'

const STEPS = [
  {
    n: '01',
    title: 'Connect your tools',
    body: 'Link the systems you already use — inbox, CRM, spreadsheets, chat. Relay reads and writes to them directly, no middleware to host.',
  },
  {
    n: '02',
    title: 'Define the trigger',
    body: 'Pick the event that should start the workflow: a form submission, a status change, a time of day. One trigger per workflow, always precise.',
  },
  {
    n: '03',
    title: 'Add conditions and actions',
    body: 'Stack the logic — branch, filter, transform — then choose what happens when it passes. Preview the exact output before you turn it on.',
  },
  {
    n: '04',
    title: 'Turn it on and step back',
    body: 'Relay takes it from there. Every run is logged and replayable, so you can trust it without watching it.',
  },
]

export default function HowItWorks() {
  const spineRef = useSpineNode('how-it-works', 'Sequence')
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 70%', 'end 40%'],
  })

  return (
    <section
      id="how-it-works"
      ref={(node) => {
        sectionRef.current = node
        spineRef.current = node
      }}
      className="border-t border-panel-line bg-panel-raised/30 py-28"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="max-w-xl">
          <p className="mb-4 font-mono text-[13px] uppercase tracking-[0.2em] text-signal">How it runs</p>
          <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
            Four steps. Then it's off your plate.
          </h2>
        </Reveal>

        <div className="relative mt-16 grid grid-cols-1 gap-x-12 lg:grid-cols-[auto_1fr]">
          <div className="relative hidden w-2 lg:block">
            <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-panel-line" />
            <motion.div
              className="absolute left-1/2 top-2 w-px -translate-x-1/2 origin-top bg-signal"
              style={{ scaleY: scrollYProgress, height: 'calc(100% - 1rem)' }}
            />
          </div>

          <div className="flex flex-col gap-14">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.05} className="grid grid-cols-[3.5rem_1fr] gap-6 lg:grid-cols-[4.5rem_1fr]">
                <span className="font-display text-3xl leading-none text-brass sm:text-4xl">{step.n}</span>
                <div>
                  <h3 className="font-display text-2xl uppercase tracking-tight text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-dim">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
