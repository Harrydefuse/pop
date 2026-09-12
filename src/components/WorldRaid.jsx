import { useState } from 'react'
import { Bar, Btn, Panel } from './ui'
import Icon from './Icon'
import LogSheet from './LogSheet'
import { BossArt } from './Sprites'
import { useGame } from '../game/useGame'
import { BOSS } from '../game/data'
import { fmtFull } from '../game/engine'

/** Distance is the only thing that moves a world raid. */
const RAID_ACTIVITIES = ['walk', 'run', 'ride']

/**
 * The one fight everybody is in at once.
 *
 * It used to be three panels and its own tab: the boss, a table of every reward
 * threshold, and a "squad damage" ladder built out of invented friends — the
 * last of the fake-social fixtures, and the same reason the leaderboard went
 * before it. A raid nobody can really join is a screensaver with a progress
 * bar on it.
 *
 * What is actually true reduces to one card. Everyone is chipping at the same
 * number, kilometres are the only thing that moves it, you have put in this
 * much, and there is a date. That belongs under the story you are already
 * fighting, not in a tab of its own.
 */
export default function WorldRaid() {
  const { state } = useGame()
  const [logging, setLogging] = useState(false)
  const km = state.world.bossKm
  const pct = km / BOSS.goalKm
  const mine = state.player.lifetime.bossKm
  const daysLeft = Math.max(0, Math.round((BOSS.endsAt - Date.now()) / 86400000))
  const next = BOSS.rewards.find((r) => pct < r.at)

  return (
    <>
      <Panel accent="var(--color-danger)" className="p-3.5">
        <div className="flex items-center gap-3">
          <BossArt sprite={BOSS.sprite} size={52} className="shrink-0 float-soft" />
          <div className="min-w-0 flex-1">
            <div className="label text-ink-faint">Everyone, at once</div>
            <div className="font-display text-[17px] text-danger mt-1 truncate">{BOSS.name}</div>
            <div className="text-[14px] text-ink-faint mt-0.5">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left · kilometres only
            </div>
          </div>
        </div>

        <Bar pct={pct} color="var(--color-danger)" height={10} shine className="mt-3" />
        <div className="flex justify-between mt-1.5">
          <span className="text-[14px] text-danger tabular-nums">{fmtFull(km)} km</span>
          <span className="text-[14px] text-ink-faint tabular-nums">{fmtFull(BOSS.goalKm)} km</span>
        </div>

        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-line">
          <Icon name={next ? 'lock' : 'check'} size={13} color={next ? 'var(--color-gold)' : 'var(--color-lime)'} />
          <span className="text-[14px] text-ink-dim leading-snug min-w-0 flex-1">
            {next ? `${next.name} at ${Math.round(next.at * 100)}%.` : 'Every reward unlocked.'}
            {mine > 0 && <span className="text-ink"> You have put in {fmtFull(mine)} km.</span>}
          </span>
        </div>

        <Btn full variant="danger" size="sm" className="mt-3" onClick={() => setLogging(true)}>
          Log distance
        </Btn>
      </Panel>

      {logging && (
        <LogSheet title="HIT THE RAID" accepts={RAID_ACTIVITIES} accent="var(--color-danger)" onClose={() => setLogging(false)} />
      )}
    </>
  )
}
