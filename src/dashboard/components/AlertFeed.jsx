import { clockTime } from '../format.js'

/**
 * Alerts arriving from TradingView.
 *
 * The empty state does the real work here. A webhook that is wired up but
 * silent looks exactly like one that was never configured, and the difference
 * matters — so the panel says which of the three states it is in rather than
 * showing an empty list and letting you guess.
 */
const EVENT_STYLES = {
  'idea.entry': { label: 'ENTRY', className: 'border-gain/40 bg-gain/10 text-gain' },
  'idea.target': { label: 'TARGET', className: 'border-gain/40 bg-gain/10 text-gain' },
  'idea.stop': { label: 'STOP', className: 'border-loss/40 bg-loss/10 text-loss' },
  'screener.hit': { label: 'SCREEN', className: 'border-chart-narrative/40 bg-chart-narrative/10 text-chart-narrative' },
  custom: { label: 'ALERT', className: 'border-panel-line bg-panel text-ink-dim' },
}

export default function AlertFeed({ alerts, stats }) {
  if (!alerts?.length) return <Empty stats={stats} />

  return (
    <ul className="space-y-1.5">
      {alerts.map((alert) => {
        const style = EVENT_STYLES[alert.event] ?? EVENT_STYLES.custom
        return (
          <li
            key={`${alert.id ?? alert.firedAt}-${alert.symbol}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-panel-line/60 pb-1.5 last:border-0"
          >
            <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${style.className}`}>
              {style.label}
            </span>
            <span className="font-mono text-sm text-ink">{alert.symbol}</span>
            {alert.price ? (
              <span className="tabular font-mono text-xs text-ink-dim">@ {alert.price}</span>
            ) : null}
            {alert.interval ? <span className="font-mono text-[10px] text-ink-faint">{alert.interval}</span> : null}
            <span className="ml-auto font-mono text-[10px] text-ink-faint">{clockTime(alert.firedAt)}</span>
            {alert.note ? <p className="w-full text-xs text-ink-faint">{alert.note}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}

function Empty({ stats }) {
  const message = !stats?.enabled
    ? 'Webhook off. Set MEMEBOT_TRADINGVIEW_ENABLED=true to accept alerts.'
    : !stats?.configured
      ? 'No secret set — the webhook refuses every request. Run `cli.js tradingview --secret`.'
      : 'Listening. Nothing has fired yet.'

  return (
    <div className="rounded border border-dashed border-panel-line px-3 py-5">
      <p className="text-xs text-ink-dim">{message}</p>
      {stats?.enabled && stats?.configured ? (
        <p className="mt-2 font-mono text-[10px] text-ink-faint">
          {stats.accepted} accepted · {stats.duplicates} duplicate · {stats.rejected} rejected
        </p>
      ) : (
        <p className="mt-2 font-mono text-[10px] text-ink-faint">node src/cli.js tradingview</p>
      )}
    </div>
  )
}
