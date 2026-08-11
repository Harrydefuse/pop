import { useEffect, useState } from 'react'

import { fetchPine } from '../useIdeas.js'
import { pct, usd } from '../format.js'
import IdeaChart from './IdeaChart.jsx'

/**
 * Ranked trade setups, with the chart and the argument side by side.
 *
 * The ordering of this panel is deliberate: the numbers that decide whether to
 * take the trade come first, the reasoning second. Reading the thesis before
 * the reward-to-risk is how people talk themselves into 0.8R trades.
 */
export default function TradeIdeas({ result, loading, error, onRescan }) {
  const ideas = result?.ideas ?? []
  const [selected, setSelected] = useState(0)

  // A rescan reorders the list, and holding index 3 of a two-item list would
  // blank the panel.
  useEffect(() => {
    if (selected >= ideas.length) setSelected(0)
  }, [ideas.length, selected])

  if (loading && !result) {
    return <p className="py-6 text-center font-mono text-sm text-ink-faint">Scanning for setups…</p>
  }

  const idea = ideas[selected]

  return (
    <div className="space-y-3">
      <Header result={result} error={error} onRescan={onRescan} />

      {ideas.length === 0 ? (
        <EmptyState result={result} />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {ideas.map((entry, index) => (
              <button
                key={entry.symbol}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={index === selected}
                className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors ${
                  index === selected
                    ? 'border-signal/60 bg-signal/15 text-signal'
                    : 'border-panel-line text-ink-dim hover:border-ink-faint'
                }`}
              >
                {entry.symbol}
                <span className={entry.setup.side === 'long' ? 'ml-1.5 text-gain' : 'ml-1.5 text-loss'}>
                  {entry.setup.side === 'long' ? '▲' : '▼'}
                </span>
                <span className="ml-1.5 text-ink-faint">{entry.setup.riskReward.toFixed(1)}R</span>
              </button>
            ))}
          </div>

          {idea ? <IdeaDetail idea={idea} /> : null}
        </>
      )}
    </div>
  )
}

function Header({ result, error, onRescan }) {
  const running = result?.running
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="font-mono text-[11px] text-ink-faint">
        {result
          ? `${result.scanned} symbols scanned · ${result.ideas?.length ?? 0} setups qualified · ${
              result.belowThreshold ?? 0
            } ranked too low`
          : 'no scan yet'}
        {result?.ageMs != null ? ` · ${age(result.ageMs)}` : ''}
        {result?.stale ? ' (refreshing)' : ''}
      </p>
      <button
        type="button"
        onClick={onRescan}
        disabled={running}
        className="ml-auto rounded border border-panel-line px-2 py-1 font-mono text-[11px] text-ink-dim transition-colors hover:border-ink-faint disabled:opacity-40"
      >
        {running ? 'scanning…' : 'rescan'}
      </button>
      {error ? <p className="w-full text-xs text-loss">{error}</p> : null}
    </div>
  )
}

function EmptyState({ result }) {
  // Group the rejection reasons: "nothing today" is much more convincing when
  // it comes with the count of what was thrown away and why.
  const reasons = new Map()
  for (const entry of result?.rejected ?? []) reasons.set(entry.reason, (reasons.get(entry.reason) ?? 0) + 1)
  const ranked = [...reasons].sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="rounded border border-dashed border-panel-line px-4 py-6">
      <p className="text-sm text-ink-dim">
        No setups qualified. That is the normal outcome — most symbols have no level worth trading against.
      </p>
      {ranked.length ? (
        <ul className="mt-3 space-y-1">
          {ranked.map(([reason, count]) => (
            <li key={reason} className="font-mono text-[11px] text-ink-faint">
              <span className="tabular mr-2 inline-block w-8 text-right text-ink-dim">{count}</span>
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function IdeaDetail({ idea }) {
  const { setup, structure, confluence, rationale } = idea

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-lg leading-none font-semibold text-ink">{idea.symbol}</h3>
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
            setup.side === 'long' ? 'border-gain/40 bg-gain/10 text-gain' : 'border-loss/40 bg-loss/10 text-loss'
          }`}
        >
          {setup.side.toUpperCase()}
        </span>
        <span className="font-mono text-[11px] text-ink-faint">
          {idea.interval} · rank {idea.rank.toFixed(2)} · {confluence.supporting}/{confluence.total} factors agree
        </span>
      </div>

      <IdeaChart idea={idea} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Entry" value={sig(setup.entry)} hint={`${(setup.entryDistanceAtr ?? 0).toFixed(1)} ATR from spot`} />
        <Figure label="Stop" value={sig(setup.stop)} hint={`risking ${sig(setup.riskPerUnit)} per unit`} tone="text-loss" />
        <Figure
          label="Targets"
          value={setup.targets.map(sig).join(' → ')}
          hint={`${setup.riskReward.toFixed(2)}R on the first`}
          tone="text-gain"
        />
        <Figure
          label="Break-even win rate"
          value={pct(setup.breakEvenWinRate, 0)}
          hint={`size ${Number(setup.positionSize.quantity).toPrecision(4)} · ${usd(setup.positionSize.notionalUsd)}`}
        />
      </div>

      <p className="rounded border border-panel-line bg-panel px-3 py-2 text-xs text-ink-dim">
        Sized so a stop-out costs {usd(setup.positionSize.riskUsd)}. At {setup.riskReward.toFixed(2)}R this needs
        to win {pct(setup.breakEvenWinRate, 0)} of the time just to break even before fees — the setup is the
        edge, not the story.
      </p>

      {rationale ? <Rationale rationale={rationale} /> : null}

      <Factors confluence={confluence} />

      <details className="rounded border border-panel-line">
        <summary className="cursor-pointer px-3 py-2 font-mono text-[11px] text-ink-dim">
          Levels this idea is drawn from
        </summary>
        <ul className="space-y-1 px-3 pb-3">
          {(structure.levels ?? []).map((level) => (
            <li key={level.price} className="font-mono text-[11px] text-ink-faint">
              <span className="tabular text-ink-dim">{sig(level.price)}</span>
              <span className="ml-2">
                touched {level.touches}× · strength {level.strength.toFixed(1)} ·{' '}
                {level.price < structure.price ? 'support' : 'resistance'}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <PineButton symbol={idea.symbol} />
    </div>
  )
}

function Rationale({ rationale }) {
  return (
    <div className="space-y-2 rounded border border-panel-line bg-panel px-3 py-3">
      <p className="text-sm text-ink">{rationale.thesis}</p>
      <ul className="space-y-1">
        {(rationale.supporting ?? []).map((point) => (
          <li key={point} className="text-xs text-ink-dim">
            <span aria-hidden className="mr-1.5 text-gain">+</span>
            {point}
          </li>
        ))}
        {(rationale.against ?? []).map((point) => (
          <li key={point} className="text-xs text-ink-dim">
            <span aria-hidden className="mr-1.5 text-loss">−</span>
            {point}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-faint">Invalidated if: {rationale.invalidation}</p>
      <p className="font-mono text-[10px] text-ink-faint">
        Conviction: {rationale.conviction}
        {rationale.generated ? '' : ` · ${rationale.note}`}
      </p>
    </div>
  )
}

function Factors({ confluence }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {confluence.factors.map((factor) => (
        <li
          key={factor.id}
          className={`rounded border px-2.5 py-1.5 text-xs ${
            factor.supports ? 'border-gain/30 bg-gain/5' : 'border-panel-line bg-panel'
          }`}
        >
          {/* The glyph, not the colour, is what says agree/disagree. */}
          <span aria-hidden className={`mr-1.5 font-mono ${factor.supports ? 'text-gain' : 'text-ink-faint'}`}>
            {factor.supports ? '✓' : '✕'}
          </span>
          <span className={factor.supports ? 'text-ink' : 'text-ink-dim'}>{factor.label}</span>
          <span className="ml-1 text-ink-faint">— {factor.detail}</span>
        </li>
      ))}
    </ul>
  )
}

/** Hands the user the Pine script for this exact idea, to paste into TradingView. */
function PineButton({ symbol }) {
  const [status, setStatus] = useState('idle')

  const copy = async () => {
    setStatus('working')
    try {
      const script = await fetchPine(symbol)
      await navigator.clipboard.writeText(script)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        disabled={status === 'working'}
        className="rounded border border-signal/50 bg-signal/10 px-3 py-1.5 font-mono text-[11px] text-signal transition-colors hover:bg-signal/20 disabled:opacity-40"
      >
        {status === 'copied' ? 'copied ✓' : status === 'failed' ? 'copy failed' : 'copy Pine script'}
      </button>
      <p className="text-[11px] text-ink-faint">
        Paste into TradingView → Pine Editor → Add to chart. It draws these exact levels, entry, stop and
        targets.
      </p>
    </div>
  )
}

function Figure({ label, value, hint, tone = 'text-ink' }) {
  return (
    <div className="rounded border border-panel-line bg-panel px-3 py-2">
      <p className="font-mono text-[10px] tracking-wide text-ink-faint uppercase">{label}</p>
      <p className={`tabular mt-0.5 font-mono text-sm ${tone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-ink-faint">{hint}</p> : null}
    </div>
  )
}

function sig(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n >= 1000 ? n.toFixed(0) : n.toPrecision(5)
}

function age(ms) {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}
