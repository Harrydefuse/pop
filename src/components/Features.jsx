import Reveal from './Reveal'
import { useSpineNode } from './SpineContext'

const FEATURES = [
  {
    code: 'TRG',
    title: 'Triggers on anything',
    body: 'A new row, an inbound email, a webhook, a calendar event, a Slack message — Relay listens for it and fires within seconds.',
  },
  {
    code: 'CND',
    title: 'Conditions with real logic',
    body: 'Branch on scores, thresholds, and history — not just if/then. Dedupe, throttle, and route without writing a rules engine.',
  },
  {
    code: 'ACT',
    title: '200+ actions, zero glue code',
    body: 'Send, update, create, file, notify. Relay speaks to the tools you already run — no custom integration to maintain.',
  },
  {
    code: 'HND',
    title: 'Human handoff, in context',
    body: 'When a step needs judgment, Relay hands it to the right person with the full trail attached — not a bare notification.',
  },
  {
    code: 'LOG',
    title: 'Every run, replayable',
    body: 'Nothing automates in the dark. Inspect, diff, and replay any run from the exact input that triggered it.',
  },
  {
    code: 'VER',
    title: 'Versioned like code',
    body: 'Every workflow change is a commit. Roll back a bad edit in one click, or branch a workflow to test safely.',
  },
]

export default function Features() {
  const ref = useSpineNode('features', 'Capabilities')

  return (
    <section id="features" ref={ref} className="mx-auto max-w-6xl px-6 py-28 lg:px-10">
      <Reveal className="max-w-xl">
        <p className="mb-4 font-mono text-[13px] uppercase tracking-[0.2em] text-signal">Capabilities</p>
        <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
          Everything a workflow needs, nothing it doesn't.
        </h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-panel-line bg-panel-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.code} delay={(i % 3) * 0.08} className="group relative bg-panel p-8 transition-colors hover:bg-panel-raised">
            <span className="font-mono text-xs tracking-widest text-ink-faint transition-colors group-hover:text-signal">
              {f.code}
            </span>
            <h3 className="font-display mt-4 text-xl uppercase tracking-tight text-ink">{f.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">{f.body}</p>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-signal transition-transform duration-300 group-hover:scale-x-100" />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
