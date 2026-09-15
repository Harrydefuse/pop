import { useEffect, useState } from 'react'
import { applyUpdate, subscribeUpdate, updateReady } from '../pwa'

/**
 * A new build has downloaded and is waiting its turn.
 *
 * It waits rather than taking over on its own because swapping the bundle
 * mid-session would throw away a running timer. So this is the offer: one line,
 * above the tab bar, out of the way until it is wanted.
 */
export default function UpdateBar() {
  const [ready, setReady] = useState(updateReady)
  useEffect(() => subscribeUpdate(() => setReady(updateReady())), [])
  if (!ready) return null

  return (
    <div className="absolute inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 px-3 pb-2 pointer-events-none">
      <div className="toast-in pointer-events-auto flex items-center gap-3 bg-panel border border-line-hot rounded-[var(--radius-md)] px-3 py-2.5 raise">
        <span className="text-[13px] text-ink-dim leading-snug flex-1">
          A new version is ready.
        </span>
        <button
          onClick={applyUpdate}
          className="font-display text-[13px] text-neon px-3 min-h-[44px] active:brightness-125"
        >
          RESTART
        </button>
      </div>
    </div>
  )
}
