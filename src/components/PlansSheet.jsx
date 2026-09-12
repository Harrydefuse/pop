import { Btn, Chip, Modal } from './ui'
import Icon from './Icon'
import { PLANS, PLUS_PERKS, PLUS_PROMISE } from '../game/plans'

/**
 * LVL100 PLUS.
 *
 * Deliberately not a checkout. There is no server behind this app and no
 * payment provider wired to it, so a form that asked for a card would be a
 * form that lies. The page states the offer, the price and the promise, and
 * the button says plainly that it does not take money yet.
 */
export default function PlansSheet({ onClose }) {
  return (
    <Modal open onClose={onClose} title="LVL100 PLUS">
      <div className="text-center">
        <div className="loot-pop inline-grid place-items-center w-14 h-14 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-gold) 16%, transparent)' }}>
          <Icon name="shield" size={28} color="var(--color-gold)" />
        </div>
        <div className="text-[15px] text-ink-dim mt-3 leading-relaxed">
          The game is free and stays free. This pays for it.
        </div>
        <Chip color="var(--color-lime)" className="mt-3">
          {PLUS_PROMISE}
        </Chip>
      </div>

      <div className="mt-4 space-y-2">
        {PLUS_PERKS.map((perk) => (
          <div key={perk.id} className="flex items-start gap-3 border border-line p-2.5">
            <span className="grid place-items-center w-8 h-8 shrink-0 rounded-[var(--radius-sm)] mt-0.5" style={{ background: 'color-mix(in srgb, var(--color-gold) 12%, transparent)' }}>
              <Icon name={perk.icon} size={15} color="var(--color-gold)" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] text-ink">{perk.name}</div>
              <div className="text-[14px] text-ink-dim mt-0.5 leading-snug">{perk.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="border p-3 text-center"
            style={{
              borderColor: plan.best ? 'var(--color-gold)' : 'var(--color-line)',
              background: plan.best ? 'color-mix(in srgb, var(--color-gold) 8%, transparent)' : 'transparent',
            }}
          >
            <div className="label text-ink-faint">{plan.name}</div>
            <div className="figure text-[22px] text-ink mt-1.5">{plan.price}</div>
            <div className="label text-ink-faint mt-1">{plan.per}</div>
            <div className="text-[13px] text-ink-dim mt-2 leading-snug">{plan.note}</div>
          </div>
        ))}
      </div>

      {/* The honest button. It does not open a card form, because there is
          nothing behind one. */}
      <Btn full disabled className="mt-4">
        Not taking payments yet
      </Btn>
      <div className="text-[13px] text-ink-faint text-center mt-2.5 leading-snug">
        Pricing here is a placeholder and nothing is connected to a payment provider. Nothing in the app is behind this
        today.
      </div>
    </Modal>
  )
}
