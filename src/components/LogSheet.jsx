import { useMemo, useState } from 'react'
import { Btn, Chip, Modal } from './ui'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { ACTIVITIES, STATS, UNVERIFIED_XP_MULT } from '../game/config'
import { minutesOf, resolveActivity } from '../game/engine'

/**
 * The one logging surface in the app. It is always opened for a specific job
 * ("fill the MOVE slot", "hit the boss"), so it only ever offers the handful of
 * activities that actually count for that job.
 */
export default function LogSheet({ title, accepts, accent = 'var(--color-cyan)', minMinutes = 0, onClose }) {
  const { state, log } = useGame()
  const options = useMemo(() => ACTIVITIES.filter((a) => accepts.includes(a.id)), [accepts])
  const [activity, setActivity] = useState(options[0])
  const [amount, setAmount] = useState(options[0].default)
  const linked = state.links.health.length > 0
  const [verified, setVerified] = useState(linked)

  const preview = useMemo(
    () => resolveActivity(state.player, { activityId: activity.id, amount, verified }),
    [state.player, activity.id, amount, verified],
  )

  const pick = (a) => {
    setActivity(a)
    setAmount(a.default)
  }

  const mins = minutesOf(activity, amount)
  const short = minMinutes > 0 && mins < minMinutes

  return (
    <Modal open onClose={onClose} title={title} accent={accent}>
      {options.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {options.map((a) => {
            const on = a.id === activity.id
            return (
              <button
                key={a.id}
                onClick={() => pick(a)}
                className="font-pixel text-[7px] px-2.5 min-h-[44px] border transition-colors active:brightness-125"
                style={{
                  color: on ? '#0b0715' : 'var(--color-ink-dim)',
                  background: on ? accent : 'transparent',
                  borderColor: on ? accent : 'var(--color-line)',
                }}
              >
                {a.name.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => setAmount((v) => Math.max(activity.step, +(v - activity.step).toFixed(2)))}
          aria-label={`Less ${activity.unit}`}
          className="font-pixel text-[14px] w-11 h-11 border border-line-hot text-ink hover:border-cyan active:brightness-125"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <div className="font-pixel text-[20px] tabular-nums" style={{ color: accent }}>
            {amount}
          </div>
          <div className="font-pixel text-[7px] text-ink-faint mt-1.5">{activity.unit.toUpperCase()}</div>
        </div>
        <button
          onClick={() => setAmount((v) => +(v + activity.step).toFixed(2))}
          aria-label={`More ${activity.unit}`}
          className="font-pixel text-[14px] w-11 h-11 border border-line-hot text-ink hover:border-cyan active:brightness-125"
        >
          +
        </button>
      </div>

      <input
        type="range"
        min={activity.step}
        max={activity.default * 3}
        step={activity.step}
        value={Math.min(amount, activity.default * 3)}
        onChange={(e) => setAmount(+e.target.value)}
        className="w-full mt-3"
        style={{ accentColor: accent }}
        aria-label={`${activity.name} amount`}
      />

      {minMinutes > 0 && (
        <div
          className="mt-3 border p-2.5 flex items-center gap-2.5"
          style={{ borderColor: short ? 'var(--color-line)' : 'var(--color-lime)' }}
        >
          <Icon name={short ? 'lock' : 'check'} size={12} color={short ? 'var(--color-ink-faint)' : 'var(--color-lime)'} />
          <span className="text-[11px]" style={{ color: short ? 'var(--color-ink-dim)' : 'var(--color-lime)' }}>
            {short
              ? `That is ${Math.round(mins)} min of the ${minMinutes} min needed to tick this off`
              : `${Math.round(mins)} min — clears the ${minMinutes} min minimum`}
          </span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => linked && setVerified(true)}
          disabled={!linked}
          className="border p-2.5 text-left min-h-[44px] disabled:opacity-45"
          style={{ borderColor: verified ? 'var(--color-lime)' : 'var(--color-line)' }}
        >
          <span className="font-pixel text-[7px]" style={{ color: verified ? 'var(--color-lime)' : 'var(--color-ink-dim)' }}>
            VERIFIED
          </span>
          <span className="block text-[10px] text-ink-faint mt-1">{linked ? 'Full XP' : 'Link a health app'}</span>
        </button>
        <button
          onClick={() => setVerified(false)}
          className="border p-2.5 text-left min-h-[44px]"
          style={{ borderColor: !verified ? 'var(--color-ink-faint)' : 'var(--color-line)' }}
        >
          <span className="font-pixel text-[7px] text-ink-dim">MANUAL</span>
          <span className="block text-[10px] text-ink-faint mt-1">{UNVERIFIED_XP_MULT * 100}% XP, unranked</span>
        </button>
      </div>

      <div className="mt-3 border border-line bg-panel-2 p-3">
        <div className="flex items-baseline gap-2">
          <span className="font-pixel text-[15px]" style={{ color: accent }}>
            +{preview.xp}
          </span>
          <span className="font-pixel text-[8px] text-ink-faint">XP</span>
          <span className="ml-auto font-mono text-[11px] text-gold">+{preview.cores} cores</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {Object.entries(preview.statGains).map(([k, v]) => (
            <Chip key={k} color={STATS.find((s) => s.key === k).color}>
              +{v} {k}
            </Chip>
          ))}
          {preview.bossDamage > 0 && <Chip color="var(--color-danger)">{preview.bossDamage} BOSS DMG</Chip>}
        </div>
      </div>

      <Btn
        full
        className="mt-3.5"
        style={{ background: accent, borderColor: accent, color: '#0b0715' }}
        onClick={() => {
          log({ activityId: activity.id, amount, verified, source: verified ? 'Health app' : 'Manual' })
          onClose()
        }}
      >
        LOG IT
      </Btn>
    </Modal>
  )
}
