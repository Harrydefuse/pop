import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Panel, SectionTitle } from './ui'
import Icon from './Icon'
import Avatar from './Avatar'
import LogSheet from './LogSheet'
import { BossArt, PetView } from './Sprites'
import { useGame } from '../game/useGame'
import { BOSS, FRIENDS } from '../game/data'
import { fmtFull } from '../game/engine'

/** Distance is the only thing that moves a world raid. */
const RAID_ACTIVITIES = ['walk', 'run', 'ride']

/**
 * The community boss. It lives with your friends rather than with your story,
 * because that is what it is for — the one fight everybody is in at once.
 */
export default function WorldRaid() {
  const { state } = useGame()
  const [logging, setLogging] = useState(false)
  const p = state.player
  const km = state.world.bossKm
  const pct = km / BOSS.goalKm
  const mine = p.lifetime.bossKm
  const daysLeft = Math.max(0, Math.round((BOSS.endsAt - Date.now()) / 86400000))
  const petReward = BOSS.rewards.find((r) => r.kind === 'pet')

  const board = useMemo(
    () =>
      [
        ...FRIENDS.map((f) => ({ id: f.id, name: f.name, avatar: f.avatar, km: f.bossKm })),
        { id: 'me', name: p.name, avatar: p.avatar, km: mine },
      ].sort((a, b) => b.km - a.km),
    [p.name, p.avatar, mine],
  )

  return (
    <div className="space-y-3">
      <Panel accent="var(--color-danger)" className="p-4 text-center">
        <Chip color="var(--color-danger)" className="mb-3">
          {BOSS.subtitle} · {daysLeft} DAYS LEFT
        </Chip>
        <BossArt sprite={BOSS.sprite} size={128} className="mx-auto" />
        <div className="font-display text-[22px] text-danger mt-2">{BOSS.name}</div>
        <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
          Everyone in LVL100 is hitting this one at the same time. Kilometres are the only thing that moves it.
        </div>

        <div className="mt-4">
          <Bar pct={pct} color="var(--color-danger)" height={12} shine />
          <div className="flex justify-between mt-1.5">
            <span className="text-[14px] text-ink-dim">{fmtFull(km)} km</span>
            <span className="text-[14px] text-ink-faint">{fmtFull(BOSS.goalKm)} km</span>
          </div>
        </div>

        <Btn full variant="danger" className="mt-3.5" onClick={() => setLogging(true)}>
          Log distance
        </Btn>
      </Panel>

      <Panel className="p-3.5" accent="var(--color-gold)">
        <SectionTitle color="var(--color-gold)">Season rewards</SectionTitle>
        <div className="flex items-center gap-3">
          <PetView refId={petReward?.ref ?? 'zeus'} level={100} size={56} float />
          <div className="min-w-0">
            <div className="font-display text-[15px] text-gold">{petReward?.name ?? 'SEASON REWARD'}</div>
            <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
              Handed only to players who put damage on {BOSS.name} before the season closes. They never come back.
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {BOSS.rewards.map((r) => {
            const unlocked = pct >= r.at
            return (
              <div key={r.at} className="flex items-center gap-2.5 border border-line p-2.5">
                <span
                  className="font-display text-[13px] w-9 shrink-0 text-center"
                  style={{ color: unlocked ? 'var(--color-gold)' : 'var(--color-ink-faint)' }}
                >
                  {r.at * 100}%
                </span>
                <span className="text-[14px] flex-1" style={{ color: unlocked ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}>
                  {r.name}
                </span>
                <Icon name={unlocked ? 'check' : 'lock'} size={11} color={unlocked ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
              </div>
            )
          })}
        </div>
      </Panel>

      <div>
        <SectionTitle right={<span className="text-[14px] text-ink-faint">your friends only</span>}>
          Squad damage
        </SectionTitle>
        <Panel className="p-1">
          {board.map((f, i) => {
            const isMe = f.id === 'me'
            const top = board[0].km
            return (
              <div
                key={f.id}
                className="flex items-center gap-2.5 px-2.5 py-2.5 border-b border-line last:border-0"
                style={isMe ? { background: 'rgba(168, 85, 247, 0.10)' } : undefined}
              >
                <span
                  className="font-display text-[15px] w-5 text-center shrink-0"
                  style={{ color: isMe ? 'var(--color-neon-bright)' : 'var(--color-ink-faint)' }}
                >
                  {i + 1}
                </span>
                <Avatar av={f.avatar} size={28} ring={isMe ? 'var(--color-neon)' : undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-[13px] truncate">{f.name}</span>
                    {isMe && <span className="font-display text-[11px] text-neon-bright">YOU</span>}
                  </div>
                  <Bar pct={f.km / top} color="var(--color-danger)" height={4} className="mt-1.5" />
                </div>
                <span className="text-[14px] text-danger shrink-0">{f.km} km</span>
              </div>
            )
          })}
        </Panel>
      </div>

      {logging && (
        <LogSheet title="HIT THE RAID" accepts={RAID_ACTIVITIES} accent="var(--color-danger)" onClose={() => setLogging(false)} />
      )}
    </div>
  )
}
