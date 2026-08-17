import { useMemo } from 'react'
import { Bar, Btn, Chip, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { BossArt, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { BOSS, CHALLENGES, FRIENDS, GLOBAL_TOP } from '../game/data'
import { classById, fmt, fmtFull, powerScore, rankFor } from '../game/engine'

const SEGMENTS = [
  { key: 'friends', label: 'FRIENDS' },
  { key: 'global', label: 'GLOBAL' },
  { key: 'events', label: 'EVENTS' },
  { key: 'boss', label: 'RAID' },
]

function Segments({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 border border-line bg-panel">
      {SEGMENTS.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className="font-pixel text-[7px] py-2.5 min-h-[44px] transition-colors border-r border-line last:border-0 active:brightness-125"
          style={{
            color: value === s.key ? '#12081f' : 'var(--color-ink-faint)',
            background: value === s.key ? 'var(--color-neon)' : 'transparent',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

function Row({ entry, place, me }) {
  const cls = classById(entry.classId)
  const { rank } = rankFor(entry.power)
  const medal = ['#fbbf24', '#c5cdd8', '#b07a4a'][place - 1]

  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2.5 border-b border-line last:border-0"
      style={me ? { background: 'rgba(168, 85, 247, 0.10)' } : undefined}
    >
      <span
        className="font-pixel text-[9px] w-6 text-center shrink-0"
        style={{ color: medal ?? (me ? 'var(--color-neon)' : 'var(--color-ink-faint)') }}
      >
        {place}
      </span>
      <Avatar av={entry.avatar} size={30} ring={me ? 'var(--color-neon)' : cls.color} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[8px] truncate">{entry.name}</span>
          {me && <span className="font-pixel text-[6px] text-neon">YOU</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-pixel text-[6px]" style={{ color: rank.color }}>
            {rank.name}
          </span>
          <span className="text-[10px] text-ink-faint">·</span>
          <span className="font-mono text-[10px] text-ink-faint">LV {entry.level}</span>
          {entry.status === 'in-game' && <span className="font-mono text-[10px] text-cyan truncate">· {entry.game}</span>}
          {entry.status === 'training' && <span className="font-mono text-[10px] text-lime">· training</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-pixel text-[9px]" style={{ color: rank.color }}>
          {fmt(entry.power)}
        </div>
        <div className="flex items-center gap-1 justify-end mt-1">
          <Icon name="flame" size={8} color="#fb923c" />
          <span className="font-mono text-[10px] text-ink-faint">{entry.streak}</span>
        </div>
      </div>
    </div>
  )
}

function ChallengeCard({ c }) {
  const pct = c.progress / c.goal
  const color = c.scope === 'DUO' ? 'var(--color-cyan)' : c.scope === 'MONTHLY' ? 'var(--color-gold)' : 'var(--color-neon)'
  return (
    <Panel className="p-3" accent={color} corners={false}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Chip color={color}>{c.scope}</Chip>
          <div className="font-pixel text-[9px] mt-2">{c.name}</div>
          <div className="text-[11px] text-ink-dim mt-1.5">{c.desc}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[10px] text-ink-faint">ENDS</div>
          <div className="font-pixel text-[8px] text-ink mt-1">{c.endsIn}</div>
        </div>
      </div>
      <Bar pct={pct} color={color} height={7} className="mt-3" />
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[10px] text-ink-dim">
          {fmt(c.progress)} / {fmt(c.goal)} {c.unit}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">{fmt(c.entrants)} entered</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-line">
        <Icon name="chest" size={11} color="var(--color-gold)" />
        <span className="text-[11px] text-gold">{c.reward}</span>
      </div>
    </Panel>
  )
}

function Raid() {
  const { state } = useGame()
  const km = state.world.bossKm
  const pct = km / BOSS.goalKm
  const mine = state.player.lifetime.bossKm
  const daysLeft = Math.max(0, Math.round((BOSS.endsAt - Date.now()) / 86400000))
  const nextTier = BOSS.personalTiers.find((t) => t.km > mine)

  return (
    <div className="space-y-3.5">
      <Panel accent="var(--color-danger)" className="p-3.5 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 30%, rgba(244,63,94,0.5), transparent 65%)' }}
        />
        <div className="relative">
          <Chip color="var(--color-danger)" className="mb-3">
            {BOSS.subtitle}
          </Chip>
          <BossArt size={190} className="mx-auto" />
          <div className="font-pixel text-[12px] text-danger mt-2">{BOSS.name}</div>
          <div className="text-[11px] text-ink-dim mt-2 leading-snug px-2">{BOSS.lore}</div>

          <div className="mt-3.5">
            <Bar pct={pct} color="var(--color-danger)" height={12} shine />
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[10px] text-ink-dim">{fmtFull(km)} km</span>
              <span className="font-mono text-[10px] text-ink-faint">{fmtFull(BOSS.goalKm)} km</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            <span className="w-1.5 h-1.5 bg-danger pulse-ring" />
            <span className="font-mono text-[10px] text-ink-faint">
              live · {(pct * 100).toFixed(2)}% · {daysLeft}d left
            </span>
          </div>
        </div>
      </Panel>

      <Panel className="p-3.5">
        <SectionTitle color="var(--color-danger)">YOUR CONTRIBUTION</SectionTitle>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-pixel text-[18px] text-danger">{mine}</div>
            <div className="font-pixel text-[7px] text-ink-faint mt-1.5">KM DEALT</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] text-ink-dim">
              {((mine / km) * 100).toFixed(4)}% of the damage
            </div>
            {nextTier && (
              <div className="font-mono text-[11px] text-gold mt-1">
                {(nextTier.km - mine).toFixed(1)} km to {nextTier.reward}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {BOSS.personalTiers.map((t) => {
            const done = mine >= t.km
            return (
              <div key={t.km} className="flex items-center gap-2.5">
                <Icon name={done ? 'check' : 'lock'} size={11} color={done ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
                <span className="font-mono text-[11px] w-12 shrink-0" style={{ color: done ? 'var(--color-lime)' : 'var(--color-ink-faint)' }}>
                  {t.km} km
                </span>
                <span className="text-[11px]" style={{ color: done ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}>
                  {t.reward}
                </span>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel className="p-3.5">
        <SectionTitle color="var(--color-gold)">COMMUNITY UNLOCKS</SectionTitle>
        <div className="space-y-2">
          {BOSS.rewards.map((r) => {
            const unlocked = pct >= r.at
            return (
              <div key={r.at} className="flex items-center gap-2.5 border border-line bg-panel-2 p-2.5">
                <span
                  className="font-pixel text-[8px] w-8 shrink-0 text-center"
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
        <div className="text-[11px] text-ink-faint mt-3 leading-snug">
          Everyone chips at the same health bar. Miss the deadline and the last tier is gone for the season — that is the
          point.
        </div>
      </Panel>
    </div>
  )
}

export default function Arena({ tab, setTab }) {
  const { state } = useGame()
  const p = state.player
  const power = powerScore(p)

  const me = useMemo(
    () => ({
      id: 'me',
      name: p.name,
      handle: p.handle,
      level: p.level,
      power,
      classId: p.classId,
      streak: p.streak,
      avatar: p.avatar,
      status: 'training',
      game: '',
    }),
    [p, power],
  )

  const friendBoard = useMemo(() => [...FRIENDS, me].sort((a, b) => b.power - a.power), [me])

  return (
    <div className="p-3 space-y-3.5">
      <Segments value={tab} onChange={setTab} />

      {tab === 'friends' && (
        <>
          <Panel className="p-1">
            {friendBoard.map((f, i) => (
              <Row key={f.id} entry={f} place={i + 1} me={f.id === 'me'} />
            ))}
          </Panel>
          <div className="flex gap-2">
            <Btn variant="ghost" full>
              + ADD FRIEND
            </Btn>
            <Btn variant="ghost" full>
              INVITE LINK
            </Btn>
          </div>
          <Panel className="p-3.5">
            <SectionTitle color="var(--color-cyan)">ONLINE NOW</SectionTitle>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {FRIENDS.filter((f) => f.status !== 'offline').map((f) => (
                <div key={f.id} className="text-center shrink-0 w-14">
                  <div className="relative inline-block">
                    <Avatar av={f.avatar} size={40} ring={f.status === 'in-game' ? 'var(--color-cyan)' : 'var(--color-lime)'} />
                    <span
                      className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border border-void"
                      style={{ background: f.status === 'in-game' ? 'var(--color-cyan)' : 'var(--color-lime)' }}
                    />
                  </div>
                  <div className="font-pixel text-[6px] mt-1.5 truncate">{f.name}</div>
                  <div className="text-[9px] text-ink-faint truncate">{f.status === 'in-game' ? f.game : 'training'}</div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {tab === 'global' && (
        <>
          <SectionTitle color="var(--color-gold)">TOP 5 WORLDWIDE</SectionTitle>
          <Panel className="p-1">
            {GLOBAL_TOP.map((f, i) => (
              <Row key={`${f.id}-${i}`} entry={f} place={i + 1} />
            ))}
          </Panel>
          <Panel className="p-3.5" accent="var(--color-neon)">
            <div className="flex items-center gap-3">
              <Avatar av={p.avatar} size={40} ring="var(--color-neon)" />
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[9px]">{p.name}</div>
                <div className="font-mono text-[10px] text-ink-faint mt-1">Global rank #48,203 · top 12%</div>
              </div>
              <div className="font-pixel text-[11px] text-neon">{fmt(power)}</div>
            </div>
            <div className="text-[11px] text-ink-dim mt-3 leading-snug">
              Ranked boards only count verified sessions. Manual logs still build your character — they just do not
              climb.
            </div>
          </Panel>
        </>
      )}

      {tab === 'events' && (
        <div className="space-y-2.5">
          {CHALLENGES.map((c) => (
            <ChallengeCard key={c.id} c={c} />
          ))}
          <Panel className="p-3.5">
            <div className="flex items-center gap-3">
              <PetView refId="zeus" level={100} size={54} float />
              <div className="min-w-0">
                <div className="font-pixel text-[8px] text-gold">SEASON REWARD</div>
                <div className="text-[11px] text-ink-dim mt-1.5">
                  Clear every monthly challenge in a season to guarantee a legendary companion. No purchase path. Only
                  time.
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'boss' && <Raid />}
    </div>
  )
}
