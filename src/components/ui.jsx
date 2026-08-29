import { useEffect } from 'react'
import { RARITY } from '../game/config'
import { alpha } from '../game/color'

/* ------------------------------------------------------------------ surfaces */

export function Panel({ children, className = '', accent, corners = true, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`relative border border-line bg-panel pixel-drop ${className}`}
      style={accent ? { borderColor: accent, boxShadow: `3px 3px 0 0 ${alpha(accent, 18)}, 3px 3px 0 1px rgba(0,0,0,0.5)` } : undefined}
      {...rest}
    >
      {corners && <Corners color={accent} />}
      {children}
    </Tag>
  )
}

function Corners({ color = 'var(--color-line-hot)' }) {
  const base = 'absolute w-[5px] h-[5px] pointer-events-none'
  return (
    <>
      <span className={`${base} -top-px -left-px`} style={{ borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className={`${base} -top-px -right-px`} style={{ borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <span className={`${base} -bottom-px -left-px`} style={{ borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className={`${base} -bottom-px -right-px`} style={{ borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  )
}

export function SectionTitle({ children, right, color = 'var(--color-neon)' }) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="font-pixel text-[9px] shrink-0" style={{ color }}>
        {children}
      </span>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${alpha(color, 35)}, transparent)` }} />
      {right}
    </div>
  )
}

/* ------------------------------------------------------------------- controls */

const BTN_VARIANTS = {
  primary: 'bg-neon text-[#12081f] border-neon hover:bg-[#bd7bfa]',
  gold: 'bg-gold text-[#20160a] border-gold hover:brightness-110',
  cyan: 'bg-cyan text-[#04222a] border-cyan hover:brightness-110',
  danger: 'bg-danger text-[#2a060f] border-danger hover:brightness-110',
  ghost: 'bg-transparent text-ink border-line-hot hover:border-neon hover:text-neon',
  dim: 'bg-panel-2 text-ink-dim border-line hover:text-ink hover:border-line-hot',
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', full, ...rest }) {
  // Every size clears the 44px touch minimum; only type scale and padding vary.
  const sizes = {
    sm: 'text-[8px] px-2.5 py-2 min-h-[44px]',
    md: 'text-[9px] px-3.5 py-2.5 min-h-[44px]',
    lg: 'text-[10px] px-4 py-3.5 min-h-[48px]',
  }
  return (
    <button
      className={`font-pixel border transition-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 disabled:active:translate-x-0 disabled:active:translate-y-0 ${
        variant === 'ghost' || variant === 'dim' ? 'bevel-ghost' : 'bevel'
      } ${BTN_VARIANTS[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Chip({ children, color = 'var(--color-ink-dim)', filled, className = '' }) {
  return (
    <span
      className={`font-pixel text-[7px] px-1.5 py-1 border leading-none inline-flex items-center gap-1 ${className}`}
      style={{
        color: filled ? '#0b0715' : color,
        borderColor: color,
        background: filled ? color : alpha(color, 10),
      }}
    >
      {children}
    </span>
  )
}

/* --------------------------------------------------------------------- meters */

export function Bar({ pct, color = 'var(--color-neon)', height = 8, shine, track = 'var(--color-panel-2)', className = '' }) {
  const clamped = Math.min(1, Math.max(0, pct || 0))
  return (
    <div
      className={`relative overflow-hidden border border-line ${className}`}
      style={{ height, background: track }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`relative h-full ${shine ? 'xp-shine' : ''}`}
        style={{
          width: `${Math.ceil(clamped * 40) * 2.5}%`,
          background: color,
          boxShadow: `inset 0 1px 0 0 ${alpha('#ffffff', 30)}, inset 0 -1px 0 0 ${alpha('#000000', 35)}`,
          transition: 'width 600ms steps(20, end)',
        }}
      />
      {/* segment ticks give the bar an arcade read rather than a web read */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 9px, rgba(0,0,0,0.55) 9px 10px)',
        }}
      />
    </div>
  )
}

export function StatNum({ label, value, color = 'var(--color-ink)', sub }) {
  return (
    <div className="min-w-0">
      <div className="font-pixel text-[7px] text-ink-faint truncate">{label}</div>
      <div className="font-pixel text-[13px] mt-1.5 truncate" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-dim mt-1 truncate">{sub}</div>}
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
      className={`relative grid place-items-center border transition-transform ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: color,
        background: `radial-gradient(circle at 50% 120%, ${alpha(color, 22)}, var(--color-panel-2) 70%)`,
        boxShadow: active ? `0 0 0 2px ${color}, 0 0 20px -6px ${color}` : `inset 0 0 12px -6px ${color}`,
      }}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, children, accent = 'var(--color-neon)', wide }) {
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
        className="absolute inset-0 bg-[#05030a]/85 backdrop-blur-[2px] cursor-default"
      />
      <div
        className={`relative w-full ${wide ? 'max-w-[400px]' : 'max-w-[340px]'} m-3 border bg-panel max-h-[85%] flex flex-col`}
        style={{ borderColor: accent, boxShadow: `0 0 40px -12px ${accent}` }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-line shrink-0">
          <span className="font-pixel text-[9px]" style={{ color: accent }}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="font-pixel text-[9px] text-ink-faint hover:text-danger active:brightness-125 grid place-items-center w-11 h-11 -mr-3 -my-3"
          >
            ✕
          </button>
        </div>
        <div className="p-3.5 overflow-y-auto scroll-thin">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- empties */

export function Empty({ children }) {
  return (
    <div className="border border-dashed border-line px-4 py-8 text-center">
      <div className="text-[12px] text-ink-faint">{children}</div>
    </div>
  )
}
