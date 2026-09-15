import { useEffect, useRef } from 'react'
import Icon from './Icon'
import { useGame } from '../game/useGame'

const KIND = {
  xp: { icon: 'bolt', color: 'var(--color-cyan)' },
  level: { icon: 'spark', color: 'var(--color-neon)' },
  pet: { icon: 'heart', color: 'var(--color-r-uncommon)' },
  chest: { icon: 'chest', color: 'var(--color-gold)' },
  stone: { icon: 'spark', color: 'var(--color-neon)' },
  gear: { icon: 'shield', color: 'var(--color-r-rare)' },
  pr: { icon: 'trophy', color: 'var(--color-gold)' },
}

function Toast({ t, onDone }) {
  // `onDone` is a fresh closure on every parent render, and the world-boss tick
  // re-renders this tree every 3.2s — keying the effect on it restarted the
  // dismiss timer forever, so toasts never expired. Key on the id instead and
  // reach the latest callback through a ref.
  const latest = useRef(onDone)
  latest.current = onDone

  useEffect(() => {
    const id = setTimeout(() => latest.current(), 3400)
    return () => clearTimeout(id)
  }, [t.id])

  const meta = KIND[t.kind] ?? KIND.xp
  const color = t.color ?? meta.color

  return (
    // Never interactive: a toast must not swallow a tap meant for the screen behind it.
    <div
      className="toast-in flex items-start gap-3 border border-line bg-panel px-3.5 py-3 rounded-[var(--radius-md)]"
      style={{ boxShadow: 'var(--elev-lift)' }}
      role="status"
    >
      {/* The colour is the badge. It used to be the border, the glow and the
          title all at once, on a panel that ignored the theme — three dark
          boxes stacked over a light screen. */}
      <span
        className="mt-0.5 shrink-0 grid place-items-center w-7 h-7 rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
      >
        <Icon name={meta.icon} size={15} color={color} />
      </span>
      <div className="min-w-0">
        <div className="font-display text-[15px] text-ink">{t.title}</div>
        {t.body && <div className="text-[14px] text-ink-dim mt-0.5 leading-snug">{t.body}</div>}
        {t.stats && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {/* A stat that did not move is not news. Rounding meant short
                sessions reported "+0 VIT" alongside the ones that counted. */}
            {Object.entries(t.stats)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <span key={k} className="text-[14px] text-lime">
                  +{v} {k}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Toasts() {
  const { state, dismissToast } = useGame()
  const shown = state.toasts.slice(-3)
  return (
    // Above the tab bar rather than under the header: the header's height moves
    // with the name and the meters in it, and a toast pinned to a guessed
    // offset landed on top of the first card on the screen.
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 px-3">
      {shown.map((t) => (
        <Toast key={t.id} t={t} onDone={() => dismissToast(t.id)} />
      ))}
    </div>
  )
}
