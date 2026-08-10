import { useMemo, useState } from 'react'
import { ACTION_STYLES, clockTime, duration, shortAddress, usd } from '../format.js'
import { ScoreMeter } from './ScoreMeter.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'enter', label: 'Entered' },
  { id: 'watch', label: 'Watching' },
  { id: 'reject', label: 'Rejected' },
]

/**
 * The decision log — why the bot did or didn't act on each token it scored.
 * This is the part that makes the agent auditable rather than a black box, so
 * the reason text is always visible, not hidden behind a hover.
 */
const PAGE_SIZE = 20

/**
 * Collapse the raw log to the latest verdict per token.
 *
 * The bot re-scores the same tokens every cycle, so an uncollapsed feed is the
 * same handful of names repeating down the page. Keeping the newest entry and
 * counting the rest answers "what does the bot think now" while still showing
 * how long it has been watching.
 */
function collapseByToken(decisions) {
  const latest = new Map()
  for (const decision of decisions) {
    const existing = latest.get(decision.address)
    if (existing) existing.seenCount += 1
    else latest.set(decision.address, { ...decision, seenCount: 1 })
  }
  return [...latest.values()]
}

export default function DecisionFeed({ decisions }) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const collapsed = useMemo(() => collapseByToken(decisions), [decisions])
  const matching = collapsed.filter((decision) => filter === 'all' || decision.action === filter)
  const shown = showAll ? matching : matching.slice(0, PAGE_SIZE)

  return (
    <div>
      {/* Filters live in one row above the content. */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((option) => {
          const count =
            option.id === 'all' ? collapsed.length : collapsed.filter((d) => d.action === option.id).length
          const isActive = filter === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={isActive}
              className={`rounded border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                isActive
                  ? 'border-signal/50 bg-signal/10 text-signal'
                  : 'border-panel-line text-ink-faint hover:border-ink-faint hover:text-ink-dim'
              }`}
            >
              {option.label}
              <span className="tabular ml-1.5 text-ink-faint">{count}</span>
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="rounded border border-dashed border-panel-line p-6 text-center text-sm text-ink-faint">
          {collapsed.length === 0
            ? 'Nothing scored yet. Decisions appear here as each cycle completes.'
            : 'No decisions match this filter.'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((decision) => {
            const style = ACTION_STYLES[decision.action] ?? ACTION_STYLES.skip
            const key = decision.address
            const isOpen = expanded === key
            return (
              <li key={key} className="rounded border border-panel-line bg-panel-raised">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-panel/40"
                >
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider ${style.className}`}
                  >
                    {style.label}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {decision.symbol || shortAddress(decision.address)}
                      <span className="ml-2 font-normal text-ink-faint">{decision.name}</span>
                    </span>
                    <span className="block truncate text-xs text-ink-faint">{decision.reasons?.[0]}</span>
                  </span>

                  <span className="hidden shrink-0 md:block">
                    <ScoreMeter breakdown={decision.breakdown} compact />
                  </span>

                  <span className="tabular shrink-0 text-right font-mono">
                    <span className="block text-sm text-ink">{Number(decision.score).toFixed(2)}</span>
                    <span className="block text-[10px] text-ink-faint">
                      {clockTime(decision.at)}
                      {decision.seenCount > 1 ? ` ·\u00a0${decision.seenCount}\u00d7` : ''}
                    </span>
                  </span>
                </button>

                {isOpen ? (
                  <div className="grid gap-4 border-t border-panel-line px-3 py-3 text-sm md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
                        Scores
                      </h4>
                      <ScoreMeter breakdown={decision.breakdown} />
                      <dl className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-faint">Liquidity</dt>
                          <dd className="tabular font-mono text-ink-dim">{usd(decision.liquidityUsd)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-faint">Market cap</dt>
                          <dd className="tabular font-mono text-ink-dim">{usd(decision.marketCap)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-faint">Pair age</dt>
                          <dd className="tabular font-mono text-ink-dim">{duration(decision.ageMs)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-faint">Momentum</dt>
                          <dd className="font-mono text-ink-dim">
                            {decision.momentumConfirmed ? 'confirmed' : 'unconfirmed'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
                        Reasoning
                      </h4>
                      <ul className="space-y-1 text-xs text-ink-dim">
                        {decision.reasons?.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <span aria-hidden className="text-ink-faint">·</span>
                            {reason}
                          </li>
                        ))}
                      </ul>

                      {decision.hardFails?.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-loss">
                          {decision.hardFails.map((fail) => (
                            <li key={fail} className="flex gap-2">
                              <span aria-hidden>✗</span>
                              {fail}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {decision.narrative?.rationale ? (
                        <p className="mt-3 border-l-2 border-chart-narrative/50 pl-2 text-xs text-ink-dim italic">
                          {decision.narrative.rationale}
                          {decision.narrative.unavailable ? (
                            <span className="ml-1 not-italic text-ink-faint">(model not consulted)</span>
                          ) : null}
                        </p>
                      ) : null}

                      {decision.narrative?.redFlags?.length ? (
                        <ul className="mt-2 flex flex-wrap gap-1">
                          {decision.narrative.redFlags.map((flag) => (
                            <li
                              key={flag}
                              className="rounded border border-loss/40 bg-loss/10 px-1.5 py-0.5 text-[10px] text-loss"
                            >
                              ⚑ {flag}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {decision.url ? (
                        <a
                          href={decision.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-3 inline-block font-mono text-[11px] text-signal hover:underline"
                        >
                          View pair ↗
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {matching.length > PAGE_SIZE ? (
        <button
          type="button"
          onClick={() => setShowAll((previous) => !previous)}
          className="mt-3 w-full rounded border border-panel-line py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim"
        >
          {showAll ? 'show fewer' : `show all ${matching.length}`}
        </button>
      ) : null}
    </div>
  )
}
