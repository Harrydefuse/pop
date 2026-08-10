import { useEffect, useState } from 'react'

import { useBotStream } from './useBotStream.js'
import { caret, clockTime, pct, pnlClass, signedPct, signedUsd, STAGE_LABELS, usd } from './format.js'
import Panel from './components/Panel.jsx'
import StatTile from './components/StatTile.jsx'
import EquityChart from './components/EquityChart.jsx'
import PositionsPanel from './components/PositionsPanel.jsx'
import DecisionFeed from './components/DecisionFeed.jsx'
import ActivityLog from './components/ActivityLog.jsx'
import ClosedTrades from './components/ClosedTrades.jsx'

function Offline({ error }) {
  return (
    <main className="grid-schematic min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-lg rounded border border-panel-line bg-panel-raised p-6">
        <h1 className="font-display text-2xl font-semibold tracking-wide text-ink">Bot not reachable</h1>
        <p className="mt-2 text-sm text-ink-dim">
          The dashboard reads a local API that the bot exposes. Start it, then this page connects on its own.
        </p>
        <pre className="mt-4 overflow-x-auto rounded border border-panel-line bg-panel p-3 font-mono text-xs text-relay">
          cd bot{'\n'}npm install{'\n'}node src/cli.js serve
        </pre>
        <p className="mt-3 text-xs text-ink-faint">
          Retrying every few seconds. {error ? <span className="text-loss">Last error: {error}</span> : null}
        </p>
      </div>
    </main>
  )
}

function StatusPill({ connected, stage, running }) {
  const live = connected && running && stage !== 'idle'
  const tone = !connected
    ? { dot: 'bg-loss', text: 'text-loss', label: 'Disconnected' }
    : live
      ? { dot: 'bg-signal live-dot', text: 'text-signal', label: STAGE_LABELS[stage] ?? stage }
      : running
        ? { dot: 'bg-relay', text: 'text-relay', label: 'Idle — waiting' }
        : { dot: 'bg-ink-faint', text: 'text-ink-dim', label: 'Stopped' }

  return (
    <span className="inline-flex items-center gap-2 rounded border border-panel-line bg-panel px-2.5 py-1">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      <span className={`font-mono text-[11px] tracking-wide ${tone.text}`}>{tone.label}</span>
    </span>
  )
}

/** Counts down to the next cycle so the page never looks frozen between runs. */
function NextCycle({ nextCycleAt }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!nextCycleAt) return null
  const seconds = Math.max(0, Math.round((new Date(nextCycleAt).getTime() - now) / 1000))
  return (
    <span className="tabular font-mono text-[11px] text-ink-faint">
      next in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
    </span>
  )
}

export default function Dashboard() {
  const { connected, loading, error, state, feed, activity, equity, scanNow } = useBotStream()
  const [scanning, setScanning] = useState(false)

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-ink-faint">Connecting to the bot…</p>
      </main>
    )
  }

  if (!state) return <Offline error={error} />

  const portfolio = state.portfolio ?? {}
  const openCount = (state.positions ?? []).length

  const handleScan = async () => {
    setScanning(true)
    try {
      await scanNow()
    } finally {
      // The button reflects the request, not the cycle; the stage pill tracks the run.
      setTimeout(() => setScanning(false), 1200)
    }
  }

  return (
    <div className="min-h-screen bg-panel">
      <header className="sticky top-0 z-10 border-b border-panel-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-5 w-1 rounded-full bg-signal" />
            <h1 className="font-display text-xl leading-none font-bold tracking-wide text-ink">
              memebot
              <span className="ml-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                control panel
              </span>
            </h1>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="rounded border border-panel-line bg-panel px-2 py-1 font-mono text-[11px] text-ink-dim">
              {state.chain}
            </span>
            <span
              className={`rounded border px-2 py-1 font-mono text-[11px] ${
                state.dryRun
                  ? 'border-panel-line text-ink-faint'
                  : 'border-relay/40 bg-relay/10 text-relay'
              }`}
              title={state.dryRun ? 'Analysing only — no positions opened' : 'Simulated money only'}
            >
              {state.dryRun ? 'dry run' : 'paper'}
            </span>
            <StatusPill connected={connected} stage={state.stage} running={state.running} />
            <NextCycle nextCycleAt={state.nextCycleAt} />
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning || !connected}
              className="rounded border border-signal/50 bg-signal/10 px-3 py-1 font-mono text-[11px] text-signal transition-colors hover:bg-signal/20 disabled:opacity-40"
            >
              {scanning ? 'scanning…' : 'scan now'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[92rem] space-y-4 px-4 py-5 sm:px-6">
        {state.lastError ? (
          <p className="rounded border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
            Last cycle failed: {state.lastError}
          </p>
        ) : null}

        <section aria-label="Portfolio summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Equity"
            value={usd(portfolio.equityUsd)}
            delta={
              <>
                <span aria-hidden className="mr-1">{caret(portfolio.totalPnlPct)}</span>
                {signedPct(portfolio.totalPnlPct)} · {signedUsd(portfolio.totalPnlUsd)}
              </>
            }
            deltaClass={pnlClass(portfolio.totalPnlPct)}
            hint={`${usd(portfolio.cashUsd)} cash of ${usd(portfolio.startingCashUsd)} start`}
            accent="var(--color-chart-momentum)"
          />
          <StatTile
            label="Open positions"
            value={openCount}
            hint={`${portfolio.closedTrades ?? 0} closed all-time`}
            accent="var(--color-chart-safety)"
          />
          <StatTile
            label="Win rate"
            value={pct(portfolio.winRate ?? 0, 0)}
            delta={`avg ${signedPct(portfolio.avgPnlPct ?? 0)} per trade`}
            deltaClass={pnlClass(portfolio.avgPnlPct)}
            hint={`best ${signedPct(portfolio.bestPnlPct ?? 0)} · worst ${signedPct(portfolio.worstPnlPct ?? 0)}`}
            accent="var(--color-chart-narrative)"
          />
          <StatTile
            label="Cycles run"
            value={state.cycleCount ?? 0}
            delta={state.lastCycleAt ? `last ${clockTime(state.lastCycleAt)}` : 'not started'}
            hint={
              state.narrativeEnabled
                ? `narrative via ${state.narrativeModel}`
                : 'narrative scoring off — no API key'
            }
          />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Panel
              title="Equity"
              subtitle="Paper portfolio marked at live prices, one sample per cycle"
            >
              <EquityChart samples={equity} startingCashUsd={portfolio.startingCashUsd} />
            </Panel>

            <Panel title="Open positions" subtitle="Marked against the live quote, not our own fill">
              <PositionsPanel positions={state.positions} risk={state.risk} />
            </Panel>

            <Panel
              title="Decisions"
              subtitle="Every token the bot scored, and why it acted or passed"
            >
              <DecisionFeed decisions={feed} />
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Activity" subtitle={`Cycle every ${state.intervalSeconds}s`}>
              <ActivityLog entries={activity} />
            </Panel>

            <Panel title="Closed trades">
              <ClosedTrades trades={state.recentTrades} />
            </Panel>
          </div>
        </div>

        <footer className="pb-8 text-xs text-ink-faint">
          Paper trading only — no keys, no signers, no real orders. Scores are heuristics over public
          data, not a contract audit.
        </footer>
      </main>
    </div>
  )
}
