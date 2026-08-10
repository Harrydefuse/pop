/** Card shell. Keeps every section on the same rule, spacing and title style. */
export default function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded border border-panel-line bg-panel-raised ${className}`}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-panel-line px-4 py-3">
          <div>
            <h2 className="font-display text-lg leading-none font-semibold tracking-wide text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 text-xs text-ink-faint">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}
