import Icon from './Icon'

const TABS = [
  { key: 'home', label: 'TODAY', icon: 'home' },
  { key: 'train', label: 'TRAIN', icon: 'bolt' },
  { key: 'map', label: 'MAP', icon: 'boot' },
  { key: 'hero', label: 'HERO', icon: 'person' },
  { key: 'friends', label: 'FRIENDS', icon: 'trophy' },
]

export default function TabBar({ tab, setTab, badges = {} }) {
  return (
    <nav className="relative z-20 border-t border-line bg-[#0d0918]/95 backdrop-blur grid grid-cols-5 pad-safe-bottom">
      {TABS.map((t) => {
        const active = tab === t.key
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative py-2.5 min-h-[52px] flex flex-col items-center justify-center gap-1.5 transition-colors active:bg-[#1a1230]"
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8"
                style={{ background: 'var(--color-neon)', boxShadow: '0 0 10px var(--color-neon)' }}
              />
            )}
            <Icon name={t.icon} size={14} color={active ? 'var(--color-neon)' : 'var(--color-ink-faint)'} />
            <span
              className="font-pixel text-[6px] leading-none"
              style={{ color: active ? 'var(--color-neon)' : 'var(--color-ink-faint)' }}
            >
              {t.label}
            </span>
            {badges[t.key] > 0 && (
              <span className="absolute top-1.5 right-[18%] w-1.5 h-1.5 bg-danger" style={{ boxShadow: '0 0 8px var(--color-danger)' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
