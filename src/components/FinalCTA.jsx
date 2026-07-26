import Reveal from './Reveal'
import { useSpineNode } from './SpineContext'

export default function FinalCTA() {
  const ref = useSpineNode('cta', 'Close')

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-panel-line py-28">
      <div className="grid-schematic pointer-events-none absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_50%_60%_at_50%_50%,black,transparent)]" />
      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-10">
        <Reveal>
          <span className="relative mx-auto mb-8 flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-signal" />
          </span>
          <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl">
            Stop running it by hand.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-ink-dim">
            Wire your first relay in about ten minutes. No credit card, no engineer required.
          </p>
          <a
            href="#top"
            className="mt-9 inline-block rounded-sm bg-signal px-8 py-4 font-mono text-sm uppercase tracking-wider text-panel transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(255,122,51,0.5)]"
          >
            Start automating — it's free
          </a>
        </Reveal>
      </div>
    </section>
  )
}
