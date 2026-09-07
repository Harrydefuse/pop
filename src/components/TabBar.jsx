import Icon from './Icon'

const TABS = [
  { key: 'home', label: 'TODAY', icon: 'home' },
  { key: 'train', label: 'TRAIN', icon: 'bolt' },
  { key: 'bosses', label: 'BATTLE', icon: 'skull' },
  { key: 'friends', label: 'FRIENDS', icon: 'trophy' },
  { key: 'hero', label: 'HERO', icon: 'person' },
]

export default function TabBar({ tab, setTab, badges = {} }) {
  // One marker for the whole bar rather than one per tab: a marker that belongs
  // to the active tab can only appear and disappear, where a single marker
  // positioned by percentage travels, and the travel is what tells you which
  // way you moved.
  const index = Math.max(0, TABS.findIndex((t) => t.key === tab))
  return (
    <nav className="relative z-20 border-t border-line bg-panel/95 backdrop-blur grid grid-cols-5 pad-safe-bottom">
      <span
        aria-hidden="true"
        className="tab-marker absolute top-0 h-0.5 w-8 -translate-x-1/2"
        style={{
          left: `${(index + 0.5) * 20}%`,
          background: 'var(--color-neon)',
          boxShadow: '0 0 10px var(--color-neon)',
        }}
      />
      {TABS.map((t) => {
        const active = tab === t.key
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative py-2.5 min-h-[52px] flex flex-col items-center justify-center gap-1.5 transition-colors active:bg-panel-2"
            aria-current={active ? 'page' : undefined}
          >
            <span key={active ? 'on' : 'off'} className={active ? 'tick-pop' : undefined}>
              <Icon name={t.icon} size={14} color={active ? 'var(--color-neon)' : 'var(--color-ink-faint)'} />
            </span>
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
