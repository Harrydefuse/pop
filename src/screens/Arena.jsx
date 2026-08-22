import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import LogSheet from '../components/LogSheet'
import { BossArt, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { BOSS, FRIENDS } from '../game/data'
import { fmtFull } from '../game/engine'

/** Distance is the only thing that damages the boss, so these are the only options. */
const DAMAGE_ACTIVITIES = ['walk', 'run', 'ride']

export default function Arena() {
  const { state } = useGame()
  const [logging, setLogging] = useState(false)
  const p = state.player
  const km = state.world.bossKm
  const pct = km / BOSS.goalKm
  const mine = p.lifetime.bossKm
  const daysLeft = Math.max(0, Math.round((BOSS.endsAt - Date.now()) / 86400000))
  const nextTier = BOSS.personalTiers.find((t) => t.km > mine)
  const petReward = BOSS.rewards.find((r) => r.kind === 'pet')

  const damageBoard = useMemo(
    () =>
      [...FRIENDS.map((f) => ({ id: f.id, name: f.name, avatar: f.avatar, km: f.bossKm })), { id: 'me', name: p.name, avatar: p.avatar, km: mine }].sort(
        (a, b) => b.km - a.km,
      ),
    [p.name, p.avatar, mine],
  )

  return (
    <div className="p-3 space-y-3.5">
      {/* ------------------------------------------------------- the boss */}
      <Panel accent="var(--color-danger)" className="p-3.5 text-center">
        <Chip color="var(--color-danger)" className="mb-3">
          {BOSS.subtitle} · {daysLeft} DAYS LEFT
        </Chip>
        <BossArt sprite={BOSS.sprite} size={168} className="mx-auto" />
        <div className="font-pixel text-[12px] text-danger mt-2">{BOSS.name}</div>

        <div className="mt-3.5">
          <Bar pct={pct} color="var(--color-danger)" height={12} shine />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[10px] text-ink-dim">{fmtFull(km)} km</span>
            <span className="font-mono text-[10px] text-ink-faint">{fmtFull(BOSS.goalKm)} km</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <span className="w-1.5 h-1.5 bg-danger pulse-ring" />
          <span className="font-mono text-[10px] text-ink-faint">everyone is hitting this one · {(pct * 100).toFixed(1)}%</span>
        </div>
      </Panel>

      {/* ---------------------------------------------------- how to hit it */}
      <Panel className="p-3.5" accent="var(--color-lime)">
        <div className="flex items-start gap-3">
          <div className="grid place-items-center w-12 h-12 border border-lime shrink-0">
            <Icon name="boot" size={22} color="var(--color-lime)" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[10px] text-lime">GO FOR A RUN OR A WALK</div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              Every kilometre you cover is a kilometre off {BOSS.name}. A walk counts the same as a
              run — it just takes longer.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="border border-line p-2">
            <div className="font-pixel text-[9px] text-lime">1 km</div>
            <div className="text-[10px] text-ink-faint mt-1">walk or run</div>
          </div>
          <div className="border border-line p-2">
            <div className="font-pixel text-[9px] text-lime">= 1</div>
            <div className="text-[10px] text-ink-faint mt-1">damage</div>
          </div>
          <div className="border border-line p-2">
            <div className="font-pixel text-[9px] text-lime">3 km</div>
            <div className="text-[10px] text-ink-faint mt-1">on a bike</div>
          </div>
        </div>
        <Btn full variant="danger" className="mt-3" onClick={() => setLogging(true)}>
          LOG DISTANCE
        </Btn>
      </Panel>

      {/* -------------------------------------------------- what you're for */}
      <Panel className="p-3.5" accent="var(--color-gold)">
        <SectionTitle color="var(--color-gold)">WHAT YOU&apos;RE PLAYING FOR</SectionTitle>
        <div className="flex items-center gap-3">
          <PetView refId={petReward?.ref ?? 'zeus'} level={100} size={64} float />
          <div className="min-w-0">
            <div className="font-pixel text-[9px] text-gold">{petReward?.name ?? 'SEASON REWARD'}</div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              A banner and a pet handed only to players who put damage on {BOSS.name} before the season
              closes. They never come back, and there is no other way to get them.
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {BOSS.rewards.map((r) => {
            const unlocked = pct >= r.at
            return (
              <div key={r.at} className="flex items-center gap-2.5 border border-line p-2.5">
                <span
                  className="font-pixel text-[8px] w-9 shrink-0 text-center"
                  style={{ color: unlocked ? 'var(--color-gold)' : 'var(--color-ink-faint)' }}
                >
                  {r.at * 100}%
                </span>
                <span className="text-[11px] flex-1" style={{ color: unlocked ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}>
                  {r.name}
                </span>
                <Icon name={unlocked ? 'check' : 'lock'} size={11} color={unlocked ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
              </div>
            )
          })}
        </div>
      </Panel>

      {/* ------------------------------------------------------ your damage */}
      <Panel className="p-3.5">
        <SectionTitle color="var(--color-danger)">YOUR DAMAGE</SectionTitle>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-pixel text-[20px] text-danger">{mine}</div>
            <div className="font-pixel text-[7px] text-ink-faint mt-1.5">KM DEALT</div>
          </div>
          {nextTier && (
            <div className="text-right">
              <div className="font-mono text-[11px] text-gold">{(nextTier.km - mine).toFixed(1)} km to go</div>
              <div className="text-[11px] text-ink-dim mt-1">{nextTier.reward}</div>
            </div>
          )}
        </div>
      </Panel>

      {/* --------------------------------------------- friends damage board */}
      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">your friends only</span>}>
          SQUAD DAMAGE
        </SectionTitle>
        <Panel className="p-1">
          {damageBoard.map((f, i) => {
            const isMe = f.id === 'me'
            const top = damageBoard[0].km
            return (
              <div
                key={f.id}
                className="flex items-center gap-2.5 px-2.5 py-2.5 border-b border-line last:border-0"
                style={isMe ? { background: 'rgba(168, 85, 247, 0.10)' } : undefined}
              >
                <span
                  className="font-pixel text-[9px] w-5 text-center shrink-0"
                  style={{ color: isMe ? 'var(--color-neon-bright)' : 'var(--color-ink-faint)' }}
                >
                  {i + 1}
                </span>
                <Avatar av={f.avatar} size={28} ring={isMe ? 'var(--color-neon)' : undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[8px] truncate">{f.name}</span>
                    {isMe && <span className="font-pixel text-[6px] text-neon-bright">YOU</span>}
                  </div>
                  <Bar pct={f.km / top} color="var(--color-danger)" height={4} className="mt-1.5" />
                </div>
                <span className="font-mono text-[11px] text-danger shrink-0">{f.km} km</span>
              </div>
            )
          })}
        </Panel>
      </div>

      {logging && (
        <LogSheet
          title="HIT THE BOSS"
          accepts={DAMAGE_ACTIVITIES}
          accent="var(--color-danger)"
          onClose={() => setLogging(false)}
        />
      )}
    </div>
  )
}
