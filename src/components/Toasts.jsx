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
      className="loot-pop flex items-start gap-2.5 border bg-[#0f0a1c]/97 px-3 py-2.5 backdrop-blur"
      style={{ borderColor: color, boxShadow: `0 0 24px -10px ${color}` }}
      role="status"
    >
      <span className="mt-0.5 shrink-0">
        <Icon name={meta.icon} size={13} color={color} />
      </span>
      <div className="min-w-0">
        <div className="font-pixel text-[9px]" style={{ color }}>
          {t.title}
        </div>
        {t.body && <div className="text-[11px] text-ink-dim mt-1 leading-snug">{t.body}</div>}
        {t.stats && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(t.stats).map(([k, v]) => (
              <span key={k} className="font-mono text-[10px] text-lime">
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
    <div className="pointer-events-none absolute inset-x-0 top-[96px] z-40 flex flex-col gap-1.5 px-2.5">
      {shown.map((t) => (
        <Toast key={t.id} t={t} onDone={() => dismissToast(t.id)} />
      ))}
    </div>
  )
}
