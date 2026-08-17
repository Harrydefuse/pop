import { useMemo, useState } from 'react'
import { Btn, Chip, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { useGame } from '../game/useGame'
import { ACTIVITIES, STATS, UNVERIFIED_XP_MULT } from '../game/config'
import { HEALTH_PROVIDERS } from '../game/data'
import { activityById, classById, fmt, relTime, resolveActivity, streakTier } from '../game/engine'

const ACT_ICON = {
  lift: 'dumbbell',
  run: 'bolt',
  ride: 'core',
  hiit: 'flame',
  sport: 'shield',
  mobility: 'heart',
  steps: 'person',
  sleep: 'spark',
  aim: 'crosshair',
}

function LogSheet({ activity, onClose }) {
  const { state, log } = useGame()
  const linked = state.links.health.length > 0
  const [amount, setAmount] = useState(activity.default)
  const [verified, setVerified] = useState(linked)

  const preview = useMemo(
    () => resolveActivity(state.player, { activityId: activity.id, amount, verified }),
    [state.player, activity.id, amount, verified],
  )

  const step = activity.step
  const dec = () => setAmount((a) => Math.max(step, +(a - step).toFixed(2)))
  const inc = () => setAmount((a) => +(a + step).toFixed(2))

  return (
    <Modal open onClose={onClose} title={activity.name.toUpperCase()} accent="var(--color-cyan)">
      <div className="flex items-center gap-3">
        <button onClick={dec} className="font-pixel text-[14px] w-11 h-11 border border-line-hot text-ink hover:border-cyan hover:text-cyan">
          −
        </button>
        <div className="flex-1 text-center">
          <div className="font-pixel text-[20px] text-cyan tabular-nums">{amount}</div>
          <div className="font-pixel text-[7px] text-ink-faint mt-1.5">{activity.unit.toUpperCase()}</div>
        </div>
        <button onClick={inc} className="font-pixel text-[14px] w-11 h-11 border border-line-hot text-ink hover:border-cyan hover:text-cyan">
          +
        </button>
      </div>

      <input
        type="range"
        min={step}
        max={activity.default * 3}
        step={step}
        value={Math.min(amount, activity.default * 3)}
        onChange={(e) => setAmount(+e.target.value)}
        className="w-full mt-3 accent-[var(--color-cyan)]"
        aria-label={`${activity.name} amount`}
      />

      {/* Source toggle — this is the anti-cheat surface, so it says out loud
          what a manual entry costs you. */}
      <div className="mt-4 space-y-1.5">
        <button
          onClick={() => linked && setVerified(true)}
          disabled={!linked}
          className="w-full flex items-center gap-2.5 border p-2.5 text-left disabled:opacity-45"
          style={{ borderColor: verified ? 'var(--color-lime)' : 'var(--color-line)' }}
        >
          <Icon name="check" size={12} color={verified ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[8px]" style={{ color: verified ? 'var(--color-lime)' : 'var(--color-ink-dim)' }}>
              VERIFIED
            </div>
            <div className="text-[10px] text-ink-faint mt-1">
              {linked ? 'Pulled from your health app · full XP · ranked' : 'Link a health app first'}
            </div>
          </div>
        </button>
        <button
          onClick={() => setVerified(false)}
          className="w-full flex items-center gap-2.5 border p-2.5 text-left"
          style={{ borderColor: !verified ? 'var(--color-ink-faint)' : 'var(--color-line)' }}
        >
          <Icon name="bolt" size={12} color="var(--color-ink-faint)" />
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[8px] text-ink-dim">MANUAL</div>
            <div className="text-[10px] text-ink-faint mt-1">
              {UNVERIFIED_XP_MULT * 100}% XP · never counts for leaderboards or the raid
            </div>
          </div>
        </button>
      </div>

      <div className="mt-4 border border-line bg-panel-2 p-3">
        <div className="font-pixel text-[7px] text-ink-faint mb-2.5">YOU WILL EARN</div>
        <div className="flex items-baseline gap-2">
          <span className="font-pixel text-[15px] text-cyan">+{preview.xp}</span>
          <span className="font-pixel text-[8px] text-ink-faint">XP</span>
          <span className="ml-auto font-mono text-[11px] text-gold">+{preview.cores} cores</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {Object.entries(preview.statGains).map(([k, v]) => (
            <Chip key={k} color={STATS.find((s) => s.key === k).color}>
              +{v} {k}
            </Chip>
          ))}
          {preview.bossDamage > 0 && <Chip color="var(--color-danger)">{preview.bossDamage} RAID DMG</Chip>}
        </div>
      </div>

      <Btn
        full
        variant="cyan"
        className="mt-3.5"
        onClick={() => {
          log({ activityId: activity.id, amount, verified, source: verified ? 'Health app' : 'Manual' })
          onClose()
        }}
      >
        LOG SESSION
      </Btn>
    </Modal>
  )
}

export default function Train({ setTab }) {
  const { state, sync } = useGame()
  const [sheet, setSheet] = useState(null)
  const p = state.player
  const cls = classById(p.classId)
  const linked = state.links.health.length > 0
  const streak = streakTier(p.streak)

  const weekBars = useMemo(() => {
    const byDay = Array.from({ length: 7 }, () => 0)
    const now = Date.now()
    for (const e of state.log) {
      const daysAgo = Math.floor((now - e.at) / 86400000)
      if (daysAgo < 7) byDay[6 - daysAgo] += e.xp
    }
    return byDay
  }, [state.log])

  const maxDay = Math.max(1, ...weekBars)

  return (
    <div className="p-3 space-y-3.5">
      {/* ---------------------------------------------------------------- sync */}
      <Panel accent={linked ? 'var(--color-lime)' : 'var(--color-danger)'} className="p-3.5">
        <div className="flex items-start gap-3">
          <Icon name={linked ? 'check' : 'lock'} size={22} color={linked ? 'var(--color-lime)' : 'var(--color-danger)'} />
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[9px]" style={{ color: linked ? 'var(--color-lime)' : 'var(--color-danger)' }}>
              {linked ? 'HEALTH LINKED' : 'NOT VERIFIED'}
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              {linked
                ? `Reading from ${state.links.health.map((h) => HEALTH_PROVIDERS.find((x) => x.id === h)?.name).join(', ')}. Sessions arrive signed — nobody can type their way up the ladder.`
                : 'Link a health app to earn full XP and appear on ranked boards. Manual entries still count for you, just at half rate.'}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Btn variant={linked ? 'primary' : 'dim'} disabled={!linked} onClick={sync} className="flex-1">
            PULL NEW SESSIONS
          </Btn>
          <Btn variant="ghost" onClick={() => setTab('hero')}>
            {linked ? 'MANAGE' : 'LINK'}
          </Btn>
        </div>
      </Panel>

      {/* ----------------------------------------------------------- quick log */}
      <div>
        <SectionTitle
          color="var(--color-cyan)"
          right={<span className="font-mono text-[10px] text-lime">×{streak.mult.toFixed(2)} streak</span>}
        >
          LOG A SESSION
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITIES.map((a) => {
            const boosted = cls.passive.tags.includes('*') || cls.passive.tags.includes(a.tag)
            return (
              <button key={a.id} onClick={() => setSheet(a)} className="text-left">
                <Panel className="p-2.5 h-full hover:border-line-hot transition-colors" corners={false}>
                  <div className="flex items-start justify-between">
                    <Icon name={ACT_ICON[a.id]} size={15} color={boosted ? cls.color : 'var(--color-ink-dim)'} />
                    {boosted && <span className="font-pixel text-[6px]" style={{ color: cls.color }}>+{Math.round(cls.passive.value * 100)}%</span>}
                  </div>
                  <div className="font-pixel text-[7px] mt-2.5 leading-[1.5]">{a.name.toUpperCase()}</div>
                  <div className="text-[10px] text-ink-faint mt-1">{a.unit}</div>
                </Panel>
              </button>
            )
          })}
        </div>
      </div>

      {/* --------------------------------------------------------- week volume */}
      <Panel className="p-3.5">
        <SectionTitle color="var(--color-ink-dim)">XP THIS WEEK</SectionTitle>
        <div className="flex items-end gap-1.5 h-20">
          {weekBars.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full transition-all duration-500"
                style={{
                  height: `${Math.max(3, (v / maxDay) * 68)}px`,
                  background: v ? 'linear-gradient(180deg, var(--color-neon), var(--color-neon-dim))' : 'var(--color-panel-2)',
                  boxShadow: v ? '0 0 12px -4px var(--color-neon)' : undefined,
                }}
              />
              <span className="font-mono text-[9px] text-ink-faint">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-line">
          <div>
            <div className="font-pixel text-[7px] text-ink-faint">SESSIONS</div>
            <div className="font-pixel text-[11px] text-ink mt-1.5">{p.week.sessions}</div>
          </div>
          <div>
            <div className="font-pixel text-[7px] text-ink-faint">KM</div>
            <div className="font-pixel text-[11px] text-cyan mt-1.5">{p.week.km}</div>
          </div>
          <div>
            <div className="font-pixel text-[7px] text-ink-faint">ACTIVE</div>
            <div className="font-pixel text-[11px] text-lime mt-1.5">{Math.round(p.week.activeMinutes)}m</div>
          </div>
        </div>
      </Panel>

      {/* -------------------------------------------------------------- history */}
      <div>
        <SectionTitle color="var(--color-ink-dim)">HISTORY</SectionTitle>
        <Panel className="p-1">
          {state.log.map((e) => {
            const act = activityById(e.activityId)
            return (
              <div key={e.id} className="flex items-center gap-2.5 px-2.5 py-2.5 border-b border-line last:border-0">
                <Icon name={ACT_ICON[act.id]} size={13} color="var(--color-ink-dim)" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] truncate">
                    {act.name} <span className="text-ink-faint">· {e.amount} {act.unit.replace(' volume', '')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="font-pixel text-[6px] px-1 py-0.5 border"
                      style={{
                        color: e.verified ? 'var(--color-lime)' : 'var(--color-ink-faint)',
                        borderColor: e.verified ? 'var(--color-lime)' : 'var(--color-ink-faint)',
                      }}
                    >
                      {e.verified ? 'VERIFIED' : 'MANUAL'}
                    </span>
                    <span className="text-[10px] text-ink-faint">{e.source}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-cyan">+{fmt(e.xp)}</div>
                  <div className="font-mono text-[10px] text-ink-faint mt-0.5">{relTime(e.at)} ago</div>
                </div>
              </div>
            )
          })}
        </Panel>
      </div>

      {sheet && <LogSheet activity={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
