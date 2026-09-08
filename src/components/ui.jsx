import { useEffect, useRef, useState } from 'react'
import { RARITY } from '../game/config'
import { alpha } from '../game/color'

/** Someone who has asked their system to stop moving things gets no roll. */
const prefersStill = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ surfaces */

/**
 * A number that travels to its new value instead of cutting to it.
 *
 * Cores, power and XP are the app's whole feedback loop, and they used to jump:
 * you logged a session, looked up, and the number was simply different. Rolling
 * it puts the gain on screen as something that happened rather than something
 * that is now true. Short — a quarter of a second — because a counter that
 * takes a full second to settle is a counter you are waiting on.
 *
 * Steps rather than a smooth ramp, to sit with the rest of the art, and no
 * roll at all on the first render or for a drop: an opening balance has not
 * gone up, and watching a currency tick downwards is a different feeling
 * altogether.
 */
export function Num({ value, format = (n) => String(n), className = '', style }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      from.current = value
      setShown(value)
      return
    }
    const start = from.current
    from.current = value
    if (value <= start || prefersStill()) {
      setShown(value)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / 260)
      // Ease out, then quantise, so it lands in visible increments.
      const eased = 1 - (1 - t) ** 3
      setShown(Math.round(start + (value - start) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span key={value} className={`${shown !== value ? '' : 'tick-pop'} inline-block ${className}`} style={style}>
      {format(shown)}
    </span>
  )
}

/**
 * One card, everywhere.
 *
 * Every panel used to be able to take an accent, and the screens took them up
 * on it: violet, teal, green, gold and crimson borders all on one screen, plus
 * four corner brackets and a hard offset drop shadow on each. `accent` is still
 * accepted, but it now moves a hairline at the top of the card rather than
 * repainting its whole outline — a card can say "this one is different" without
 * five of them shouting it at once.
 */
export function Panel({ children, className = '', accent, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`relative border border-line bg-panel rounded-[var(--radius-md)] raise ${className}`}
      {...rest}
    >
      {accent && (
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-0 h-[3px] rounded-t-[var(--radius-md)]"
          style={{ background: accent }}
        />
      )}
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <h2 className="font-display text-[19px] text-ink">{children}</h2>
      {right}
    </div>
  )
}

/* ------------------------------------------------------------------- controls */

const BTN_VARIANTS = {
  primary: 'bg-neon text-[var(--color-on-accent)] border-transparent hover:brightness-110',
  gold: 'bg-gold text-[var(--color-on-accent)] border-transparent hover:brightness-110',
  cyan: 'bg-cyan text-[var(--color-on-accent)] border-transparent hover:brightness-110',
  danger: 'bg-danger text-[var(--color-on-accent)] border-transparent hover:brightness-110',
  ghost: 'bg-transparent text-ink border-line-hot hover:border-neon hover:text-neon',
  dim: 'bg-panel-2 text-ink-dim border-transparent hover:text-ink',
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', full, ...rest }) {
  // Every size clears the 44px touch minimum; only type scale and padding vary.
  const sizes = {
    sm: 'text-[14px] px-3 py-2 min-h-[44px]',
    md: 'text-[15px] px-4 py-2.5 min-h-[48px]',
    lg: 'text-[17px] px-5 py-3.5 min-h-[52px]',
  }
  return (
    <button
      className={`font-display border rounded-[var(--radius-sm)] transition-[transform,filter,background-color,border-color] duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${
        BTN_VARIANTS[variant]
      } ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Chip({ children, color = 'var(--color-ink-dim)', filled, className = '' }) {
  return (
    <span
      // Unfilled chips sit on the raised surface rather than on a wash of their
      // own colour: a tint pulls the ground towards the text, and the quieter
      // hues — bronze, slate — lost their own chip to it.
      className={`label px-2 py-1 rounded-full leading-none inline-flex items-center gap-1 ${className}`}
      style={{
        color: filled ? 'var(--color-on-accent)' : color,
        background: filled ? color : 'var(--color-panel-2)',
      }}
    >
      {children}
    </span>
  )
}

/* --------------------------------------------------------------------- meters */

/**
 * A meter.
 *
 * It used to quantise to fortieths, snap between them in twenty steps and carry
 * a repeating tick overlay, so that a bar reading 63% drew at 62.5% behind a
 * grid of notches. It is a plain rounded bar that moves smoothly to the value
 * it actually has.
 */
export function Bar({ pct, color = 'var(--color-neon)', height = 8, shine, track = 'var(--color-panel-2)', className = '' }) {
  const clamped = Math.min(1, Math.max(0, pct || 0))
  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ height, background: track }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`relative h-full rounded-full ${shine ? 'xp-shine' : ''}`}
        style={{
          width: `${clamped * 100}%`,
          background: color,
          transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  )
}
/* -------------------------------------------------------------------- rarity */

export function RarityTag({ rarity, className = '' }) {
  const r = RARITY[rarity]
  return (
    <Chip color={r.color} className={className}>
      {r.label}
    </Chip>
  )
}

export function RarityFrame({ rarity, children, size = 56, className = '', onClick, active }) {
  const color = RARITY[rarity].color
  return (
    <div
      onClick={onClick}
      className={`relative grid place-items-center rounded-[var(--radius-sm)] transition-transform ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, var(--color-panel-2), ${alpha(color, 14)})`,
        boxShadow: active ? `0 0 0 2px ${color}` : `inset 0 0 0 1px ${alpha(color, 28)}`,
      }}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="scrim-in absolute inset-0 backdrop-blur-[2px] cursor-default"
        style={{ background: 'var(--scrim)' }}
      />
      <div
        className={`sheet-in relative w-full ${wide ? 'max-w-[420px]' : 'max-w-[360px]'} m-3 border border-line bg-panel rounded-[var(--radius-lg)] max-h-[85%] flex flex-col overflow-hidden`}
        style={{ boxShadow: 'var(--elev-lift)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pl-4 pr-2 py-3 border-b border-line shrink-0">
          <span className="font-display text-[17px] text-ink">{title}</span>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[18px] text-ink-faint hover:text-ink grid place-items-center w-11 h-11 rounded-[var(--radius-sm)]"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto scroll-thin">{children}</div>
      </div>
    </div>
  )
}

