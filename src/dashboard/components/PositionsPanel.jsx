import { caret, duration, pnlClass, signedPct, usd } from '../format.js'
import { RiskTrack } from './ScoreMeter.jsx'

/**
 * Open paper positions. The risk track is the point of this panel: it shows at
 * a glance how close each position is to its stop or its target, which the raw
 * entry/current prices do not.
 */
export default function PositionsPanel({ positions, risk }) {
  if (!positions || positions.length === 0) {
    return (
      <p className="rounded border border-dashed border-panel-line p-6 text-center text-sm text-ink-faint">
        No open positions. The bot opens one when a token clears the safety screen with confirmed momentum.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">Open paper-trading positions with live profit and loss</caption>
        <thead>
          <tr className="border-b border-panel-line text-left font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
            <th scope="col" className="py-2 pr-3 font-medium">Token</th>
            <th scope="col" className="py-2 pr-3 font-medium">Size</th>
            <th scope="col" className="py-2 pr-3 font-medium">Entry</th>
            <th scope="col" className="py-2 pr-3 font-medium">Now</th>
            <th scope="col" className="py-2 pr-3 font-medium">P&amp;L</th>
            <th scope="col" className="w-40 py-2 pr-3 font-medium">Stop / target</th>
            <th scope="col" className="py-2 pr-3 font-medium">Held</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const change = (position.lastPriceUsd - position.entryPriceUsd) / position.entryPriceUsd
            return (
              <tr key={position.address} className="border-b border-panel-line/60 last:border-0">
                <td className="py-2.5 pr-3">
                  <a
                    href={position.pairUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-ink hover:text-signal"
                  >
                    {position.symbol || '—'}
                  </a>
                  <div className="max-w-[10rem] truncate text-xs text-ink-faint">{position.name}</div>
                </td>
                <td className="tabular py-2.5 pr-3 font-mono text-ink-dim">{usd(position.costUsd)}</td>
                <td className="tabular py-2.5 pr-3 font-mono text-ink-dim">
                  ${Number(position.entryPriceUsd).toPrecision(4)}
                </td>
                <td className="tabular py-2.5 pr-3 font-mono text-ink">
                  ${Number(position.lastPriceUsd).toPrecision(4)}
                </td>
                <td className={`tabular py-2.5 pr-3 font-mono ${pnlClass(change)}`}>
                  <span aria-hidden className="mr-1">{caret(change)}</span>
                  {signedPct(change)}
                </td>
                <td className="py-2.5 pr-3">
                  <RiskTrack changePct={change} stopPct={risk?.stopLossPct ?? 0.3} targetPct={risk?.takeProfitPct ?? 0.8} />
                </td>
                <td className="tabular py-2.5 pr-3 font-mono text-xs text-ink-faint">
                  {duration(Date.now() - new Date(position.openedAt).getTime())}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
