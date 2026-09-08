import Icon from './Icon'

// Sentence case, not caps. Five shouted words along the bottom of every screen
// was the loudest thing in the app and the least important.
const TABS = [
  { key: 'home', label: 'Today', icon: 'home' },
  { key: 'train', label: 'Train', icon: 'bolt' },
  { key: 'bosses', label: 'Battle', icon: 'skull' },
  { key: 'friends', label: 'Guild', icon: 'trophy' },
  { key: 'hero', label: 'Hero', icon: 'person' },
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
        className="tab-marker absolute top-0 h-[3px] w-10 -translate-x-1/2 rounded-b-full"
        style={{ left: `${(index + 0.5) * 20}%`, background: 'var(--color-neon)' }}
      />
      {TABS.map((t) => {
        const active = tab === t.key
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative py-2 min-h-[56px] flex flex-col items-center justify-center gap-1 transition-colors active:bg-panel-2"
            aria-current={active ? 'page' : undefined}
          >
            <span key={active ? 'on' : 'off'} className={active ? 'tick-pop' : undefined}>
              <Icon name={t.icon} size={20} color={active ? 'var(--color-neon)' : 'var(--color-ink-faint)'} />
            </span>
            <span
              className="font-display text-[12px] leading-none"
              style={{ color: active ? 'var(--color-neon)' : 'var(--color-ink-faint)', fontWeight: active ? 700 : 500 }}
            >
              {t.label}
            </span>
            {badges[t.key] > 0 && (
              <span className="absolute top-2 right-[22%] w-2 h-2 rounded-full bg-danger ring-2 ring-[var(--color-panel)]" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
