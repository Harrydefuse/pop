import Icon from './Icon'

const TABS = [
  { key: 'home', label: 'TODAY', icon: 'home' },
  { key: 'train', label: 'TRAIN', icon: 'bolt' },
  { key: 'friends', label: 'FRIENDS', icon: 'trophy' },
  { key: 'hero', label: 'HERO', icon: 'person' },
]

export default function TabBar({ tab, setTab, badges = {} }) {
  return (
    <nav className="relative z-20 border-t border-line bg-panel/95 backdrop-blur grid grid-cols-4 pad-safe-bottom">
      {TABS.map((t) => {
        const active = tab === t.key
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative py-2.5 min-h-[52px] flex flex-col items-center justify-center gap-1.5 transition-colors active:bg-panel-2"
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
              className="font-pixel text-[7px] leading-none"
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
