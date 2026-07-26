const COLUMNS = [
  {
    title: 'Product',
    links: ['Capabilities', 'How it works', 'Pricing', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Blog', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Docs', 'API reference', 'Status', 'Community'],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-panel-line">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-signal" />
              <span className="font-display text-xl font-semibold uppercase tracking-wide text-ink">Relay</span>
            </div>
            <p className="mt-4 max-w-[26ch] text-sm text-ink-dim">The switchboard for your busywork.</p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#top" className="text-sm text-ink-dim transition-colors hover:text-ink">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-panel-line pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-ink-faint">© 2026 Relay Systems, Inc.</p>
          <p className="font-mono text-xs text-ink-faint">
            <span className="text-relay">●</span> signal: idle — all relays nominal
          </p>
        </div>
      </div>
    </footer>
  )
}
