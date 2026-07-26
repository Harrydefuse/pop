import Reveal from './Reveal'
import { useSpineNode } from './SpineContext'

const TIERS = [
  {
    name: 'Single Line',
    price: '$0',
    unit: '/ mo',
    tagline: 'One workflow, wired up right.',
    features: ['1 active workflow', '500 runs / month', '7-day run history', 'Community support'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Switchboard',
    price: '$49',
    unit: '/ mo',
    tagline: 'For the team running ops on it.',
    features: ['Unlimited workflows', '50,000 runs / month', 'Full replayable history', 'Human handoff steps', 'Priority support'],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Substation',
    price: 'Custom',
    unit: '',
    tagline: 'For volume, security, and scale.',
    features: ['Everything in Switchboard', 'SSO + audit log', 'Dedicated throughput', 'Uptime SLA', 'Solutions engineer'],
    cta: 'Talk to sales',
    highlight: false,
  },
]

export default function Pricing() {
  const ref = useSpineNode('pricing', 'Pricing')

  return (
    <section id="pricing" ref={ref} className="mx-auto max-w-6xl px-6 py-28 lg:px-10">
      <Reveal className="max-w-xl">
        <p className="mb-4 font-mono text-[13px] uppercase tracking-[0.2em] text-signal">Pricing</p>
        <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
          Sized to how much you're running.
        </h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 0.08}>
            <div
              className={`flex h-full flex-col rounded-md border p-8 ${
                tier.highlight
                  ? 'border-signal bg-panel-raised shadow-[0_0_40px_-12px_rgba(255,122,51,0.35)]'
                  : 'border-panel-line bg-panel-raised/40'
              }`}
            >
              {tier.highlight && (
                <span className="mb-4 w-fit rounded-full bg-signal/15 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-signal">
                  Most wired-up
                </span>
              )}
              <h3 className="font-display text-2xl uppercase tracking-tight text-ink">{tier.name}</h3>
              <p className="mt-1 text-sm text-ink-dim">{tier.tagline}</p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl text-ink">{tier.price}</span>
                <span className="font-mono text-sm text-ink-faint">{tier.unit}</span>
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-dim">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-relay" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#top"
                className={`mt-8 rounded-sm px-5 py-3 text-center font-mono text-sm uppercase tracking-wider transition-colors ${
                  tier.highlight
                    ? 'bg-signal text-panel hover:bg-signal-dim'
                    : 'border border-panel-line text-ink-dim hover:border-ink-dim hover:text-ink'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
