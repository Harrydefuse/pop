import { useMemo } from 'react'
import { Modal, Panel } from './ui'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { ACTIVITIES } from '../game/config'

/**
 * How a workout gets into the game. It used to be a slider you dragged to
 * whatever number you fancied, which meant ten kilometres was two seconds of
 * work — so it is a starting gun now. Pick the thing, the app runs the clock,
 * and the amount is measured rather than claimed.
 *
 * Opened for a specific job ("fill the ACTIVE slot", "hit the boss"), so it
 * only ever offers the activities that count for that job.
 */
export default function LogSheet({ title, accepts, accent = 'var(--color-cyan)', minMinutes = 0, onClose }) {
  const { state, startSession } = useGame()
  // The caller's order is preserved, so a boss can float its weakness to the
  // front of the list instead of burying it in catalogue order.
  const options = useMemo(
    () => (accepts ? accepts.map((id) => ACTIVITIES.find((a) => a.id === id)).filter(Boolean) : ACTIVITIES),
    [accepts],
  )
  const busy = Boolean(state.session)

  return (
    <Modal open onClose={onClose} title={title} accent={accent}>
      {busy ? (
        <Panel corners={false} className="p-3">
          <div className="text-[12px] text-ink">A session is already running.</div>
          <div className="text-[11px] text-ink-dim mt-2 leading-snug">
            Finish it from the bar at the bottom of the screen, then start the next one.
          </div>
        </Panel>
      ) : (
        <>
          <div className="text-[11px] text-ink-dim leading-snug">
            {minMinutes > 0
              ? `Pick one and the clock starts. ${minMinutes} minutes ticks this off.`
              : 'Pick one and the clock starts. Stop it when you are done.'}
          </div>

          <div className="mt-3 space-y-1.5">
            {options.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  startSession(a.id)
                  onClose()
                }}
                className="w-full flex items-center gap-2.5 border border-line p-2.5 text-left min-h-[44px] active:brightness-125"
              >
                <Icon name={a.icon} size={16} color={accent} />
                <span className="font-pixel text-[8px] text-ink flex-1">{a.name.toUpperCase()}</span>
                <span className="font-mono text-[11px] text-ink-faint">
                  {a.xp} XP / {a.per} {a.unit}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[10px] text-ink-faint mt-3 leading-relaxed">
            The app counts it, so nothing can be typed in and nothing can be made up. Lock your phone and go — the clock
            keeps its own time.
          </div>
        </>
      )}
    </Modal>
  )
}
