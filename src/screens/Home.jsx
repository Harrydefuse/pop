import { Bar, Btn, Chip, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { BossArt, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { BOSS } from '../game/data'
import { CHEST_TIERS } from '../game/config'
import {
  activePet,
  activityById,
  balanceRatio,
  balanceVerdict,
  chestTier,
  classById,
  fmt,
  fmtFull,
  nextStreakTier,
  powerScore,
  rankFor,
  relTime,
  streakTier,
} from '../game/engine'

export default function Home({ setTab, setArenaTab }) {
  const { state, sync, openChest } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank, next: nextRank, pct: rankPct } = rankFor(power)
  const pet = activePet(p)
  const streak = streakTier(p.streak)
  const nextTier = nextStreakTier(p.streak)
  const doneCount = state.dailies.filter((q) => q.progress >= q.goal).length
  const tier = chestTier(Math.max(1, state.chest.sealedDays))
  const bossPct = state.world.bossKm / BOSS.goalKm
  const ratio = balanceRatio(p.week.activeMinutes, p.week.gamingHours)
  const verdict = balanceVerdict(ratio)

  return (
    <div className="p-3 space-y-3.5">
      {/* ---------------------------------------------------------- character */}
      <Panel accent={cls.color} className="p-3.5 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.16] pointer-events-none"
          style={{ background: `radial-gradient(circle at 85% 15%, ${cls.color}, transparent 60%)` }}
        />
        <div className="relative flex items-start gap-3">
          <Avatar av={p.avatar} size={56} ring={cls.color} />
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[11px] truncate">{p.name}</div>
            <div className="text-[11px] text-ink-dim mt-1">@{p.handle}</div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Chip color={cls.color}>{cls.name}</Chip>
              <Chip color={rank.color}>{rank.name}</Chip>
            </div>
          </div>
          {pet && (
            <div className="text-center shrink-0">
              <PetView refId={pet.ref} level={pet.level} size={58} float />
              <div className="font-pixel text-[7px] text-ink-faint mt-1">
                {pet.name} · {pet.level}
              </div>
            </div>
          )}
        </div>

        <div className="relative mt-3.5">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-pixel text-[8px] text-ink-faint">POWER</span>
            <span className="font-pixel text-[14px]" style={{ color: rank.color }}>
              {fmtFull(power)}
            </span>
          </div>
          <Bar pct={rankPct} color={rank.color} height={9} />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[10px] text-ink-faint">{rank.name}</span>
            <span className="font-mono text-[10px] text-ink-faint">
              {nextRank ? `${fmt(nextRank.min - power)} to ${nextRank.name}` : 'MAX RANK'}
            </span>
          </div>
        </div>
      </Panel>

      {/* -------------------------------------------------------------- streak */}
      <Panel className="p-3.5" accent={p.streak > 0 ? '#fb923c' : undefined}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 grid place-items-center w-[52px] h-[52px] border border-line bg-panel-2">
            <Icon name="flame" size={26} color="#fb923c" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-pixel text-[16px] text-[#fb923c]">{p.streak}</span>
              <span className="font-pixel text-[8px] text-ink-faint">DAY STREAK</span>
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5">
              {streak.label} · <span className="text-lime">×{streak.mult.toFixed(2)} XP</span>
              {p.shields > 0 && <span className="text-ink-faint"> · {p.shields} shield</span>}
            </div>
            {nextTier && (
              <div className="mt-2">
                <Bar pct={p.streak / nextTier.days} color="#fb923c" height={5} />
                <div className="font-mono text-[10px] text-ink-faint mt-1">
                  {nextTier.days - p.streak} days to ×{nextTier.mult.toFixed(2)} — {nextTier.label}
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------------------------ dailies */}
      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">{doneCount}/3</span>}>
          DAILY QUESTS
        </SectionTitle>
        <Panel className="p-1">
          {state.dailies.map((q) => {
            const done = q.progress >= q.goal
            return (
              <div key={q.id} className="flex items-center gap-3 px-2.5 py-2.5 border-b border-line last:border-0">
                <span
                  className="grid place-items-center w-6 h-6 border shrink-0"
                  style={{
                    borderColor: done ? 'var(--color-lime)' : 'var(--color-line-hot)',
                    background: done ? 'rgba(163, 230, 53, 0.12)' : 'transparent',
                  }}
                >
                  {done ? <Icon name="check" size={12} color="var(--color-lime)" /> : <span className="w-1.5 h-1.5 bg-line-hot" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-[8px]" style={{ color: done ? 'var(--color-lime)' : 'var(--color-ink)' }}>
                      {q.name}
                    </span>
                    <span className="font-mono text-[10px] text-ink-faint shrink-0">
                      {fmt(Math.min(q.progress, q.goal))}/{fmt(q.goal)}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-dim mt-1 mb-1.5">{q.desc}</div>
                  <Bar pct={q.progress / q.goal} color={done ? 'var(--color-lime)' : 'var(--color-cyan)'} height={4} />
                </div>
                <span className="font-pixel text-[8px] text-cyan shrink-0">+{q.xp}</span>
              </div>
            )
          })}
        </Panel>
      </div>

      {/* -------------------------------------------------------- sealed chest */}
      <Panel className="p-3.5" accent={tier.color}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 grid place-items-center w-14 h-14 border border-line bg-panel-2">
            <Icon name="chest" size={30} color={tier.color} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[9px]" style={{ color: tier.color }}>
              {state.chest.sealedDays > 0 ? tier.name : 'NO CHEST SEALED'}
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              {state.chest.sealedDays > 0
                ? `Sealed ${state.chest.sealedDays} day${state.chest.sealedDays > 1 ? 's' : ''}. Every day you clear your quests and leave it shut, it climbs a tier.`
                : 'Clear all three dailies to seal a chest. The longer you wait, the better it gets.'}
            </div>
          </div>
        </div>

        {/* tier ladder — the whole delayed-gratification pitch in one strip */}
        <div className="flex gap-1 mt-3">
          {CHEST_TIERS.map((t) => {
            const reached = state.chest.sealedDays >= t.day
            return (
              <div key={t.day} className="flex-1 text-center" title={`${t.name} · ${t.cores} cores`}>
                <div
                  className="h-1.5 mb-1"
                  style={{ background: reached ? t.color : 'var(--color-panel-2)', boxShadow: reached ? `0 0 8px -2px ${t.color}` : undefined }}
                />
                <span className="font-mono text-[9px]" style={{ color: reached ? t.color : 'var(--color-ink-faint)' }}>
                  {t.day}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Btn
            variant={state.chest.sealedDays > 0 ? 'gold' : 'dim'}
            disabled={state.chest.sealedDays === 0}
            onClick={openChest}
            className="flex-1"
          >
            OPEN NOW · {fmt(tier.cores)} CORES
          </Btn>
        </div>
        {state.chest.sealedDays > 0 && state.chest.sealedDays < 7 && (
          <div className="font-mono text-[10px] text-ink-faint mt-2 text-center">
            Wait {7 - state.chest.sealedDays} more day{7 - state.chest.sealedDays > 1 ? 's' : ''} for the Mythic Vault
          </div>
        )}
      </Panel>

      {/* ---------------------------------------------------------- world boss */}
      <button className="block w-full text-left" onClick={() => { setArenaTab('boss'); setTab('arena') }}>
        <Panel accent="var(--color-danger)" className="p-3.5 overflow-hidden">
          <div className="flex items-center gap-3">
            <BossArt size={68} className="shrink-0 opacity-90" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-danger pulse-ring" />
                <span className="font-pixel text-[7px] text-danger">LIVE WORLD RAID</span>
              </div>
              <div className="font-pixel text-[9px] mt-1.5 truncate">{BOSS.name}</div>
              <Bar pct={bossPct} color="var(--color-danger)" height={7} className="mt-2" />
              <div className="flex justify-between mt-1.5">
                <span className="font-mono text-[10px] text-ink-dim">{fmtFull(state.world.bossKm)} km</span>
                <span className="font-mono text-[10px] text-ink-faint">{(bossPct * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-ink-dim mt-2.5">
            Your damage: <span className="text-danger font-mono">{p.lifetime.bossKm} km</span> — everyone&apos;s kilometres
            stack against the same health bar.
          </div>
        </Panel>
      </button>

      {/* ------------------------------------------------------------- balance */}
      <Panel className="p-3.5">
        <SectionTitle color="var(--color-cyan)">WEEKLY BALANCE</SectionTitle>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="font-pixel text-[13px]" style={{ color: verdict.color }}>
              {verdict.label}
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5">{verdict.note}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-[11px] text-lime">{Math.round(p.week.activeMinutes)} min active</div>
            <div className="font-mono text-[11px] text-neon mt-1">{p.week.gamingHours} h played</div>
          </div>
        </div>
        <div className="flex h-2.5 mt-3 border border-line">
          <div className="bg-lime" style={{ width: `${Math.min(90, (p.week.activeMinutes / 60 / (p.week.gamingHours + p.week.activeMinutes / 60)) * 100)}%` }} />
          <div className="flex-1 bg-neon-dim" />
        </div>
        <div className="text-[11px] text-ink-faint mt-2 leading-snug">
          We are not asking you to quit games. Keep both bars alive and you win the week.
        </div>
      </Panel>

      {/* -------------------------------------------------------------- recent */}
      <div>
        <SectionTitle
          color="var(--color-ink-dim)"
          right={
            <Btn size="sm" variant="ghost" onClick={sync} disabled={!state.links.health.length}>
              SYNC
            </Btn>
          }
        >
          RECENT
        </SectionTitle>
        <Panel className="p-1">
          {state.log.slice(0, 4).map((entry) => {
            const act = activityById(entry.activityId)
            return (
              <div key={entry.id} className="flex items-center gap-2.5 px-2.5 py-2 border-b border-line last:border-0">
                <Icon name={entry.verified ? 'check' : 'bolt'} size={11} color={entry.verified ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
                <span className="text-[12px] flex-1 min-w-0 truncate">
                  {act.name} <span className="text-ink-faint">· {entry.amount} {act.unit.replace(' volume', '')}</span>
                </span>
                <span className="font-mono text-[10px] text-cyan shrink-0">+{entry.xp}</span>
                <span className="font-mono text-[10px] text-ink-faint shrink-0 w-6 text-right">{relTime(entry.at)}</span>
              </div>
            )
          })}
          {!state.log.length && <div className="px-3 py-6 text-center text-[11px] text-ink-faint">Nothing logged yet</div>}
        </Panel>
      </div>
    </div>
  )
}
