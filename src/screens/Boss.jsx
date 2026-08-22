import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import LogSheet from '../components/LogSheet'
import { BossArt, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { BOSS, FRIENDS } from '../game/data'
import { ACTIVITIES, RARITY } from '../game/config'
import { ACTS, CAMPAIGN, actById } from '../game/campaign'
import { campaignState, fmtFull } from '../game/engine'
import { alpha } from '../game/color'

/** Distance is the only thing that moves a world raid, so it gets its own list. */
const RAID_ACTIVITIES = ['walk', 'run', 'ride']

/**
 * Opening the log from a boss puts whatever it is weak to at the front, so the
 * double-damage option is the first thing under your thumb.
 */
function fightOrder(boss) {
  const ids = ACTIVITIES.filter((a) => !a.gaming || boss.weak === 'aim').map((a) => a.id)
  if (!boss.weak) return ids
  const weak = ACTIVITIES.filter((a) => a.tag === boss.weak).map((a) => a.id)
  return [...weak, ...ids.filter((id) => !weak.includes(id))]
}

// ------------------------------------------------------------------ story mode

/** The boss you are standing in front of. One screen, one target, one action. */
function CurrentBoss({ boss, damage, onFight, onOpen }) {
  const act = actById(boss.act)
  const pct = damage / boss.hp

  return (
    <Panel accent={act.color} className="p-4 text-center">
      <Chip color={act.color} className="mb-3">
        ACT {act.numeral} · {act.name}
      </Chip>

      <button onClick={onOpen} className="block mx-auto" aria-label={`${boss.name} details`}>
        <BossArt sprite={boss.sprite} size={132} className="mx-auto float-soft" />
      </button>

      <div className="font-pixel text-[13px] mt-2" style={{ color: act.color }}>
        {boss.name}
      </div>
      <div className="text-[11px] text-ink-dim mt-1">{boss.title}</div>

      <div className="mt-4">
        <Bar pct={pct} color="var(--color-danger)" height={12} shine />
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[11px] text-danger">{fmtFull(Math.round(damage))}</span>
          <span className="font-mono text-[11px] text-ink-faint">{fmtFull(boss.hp)} HP</span>
        </div>
      </div>

      <div className="mt-3.5 border p-3 text-left" style={{ borderColor: alpha(act.color, 40), background: alpha(act.color, 8) }}>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[7px] text-ink-faint">WEAK TO</span>
          {boss.weak && (
            <span className="font-pixel text-[7px] px-1.5 py-0.5" style={{ background: act.color, color: '#0b0715' }}>
              x2 DMG
            </span>
          )}
        </div>
        <div className="text-[12px] mt-1.5" style={{ color: act.color }}>
          {boss.weakLabel}
        </div>
        <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">{boss.beat}</div>
      </div>

      <Btn full variant="danger" className="mt-3" onClick={onFight}>
        FIGHT IT
      </Btn>
    </Panel>
  )
}

/** Shown when you have cleared everything your level allows. */
function Gated({ boss, levels }) {
  const act = actById(boss.act)
  return (
    <Panel accent="var(--color-gold)" className="p-4 text-center">
      <Chip color="var(--color-gold)" className="mb-3">
        ROAD CLEAR
      </Chip>
      <BossArt sprite={boss.sprite} size={110} className="mx-auto" style={{ filter: 'grayscale(1) brightness(0.5)', opacity: 0.6 }} />
      <div className="font-pixel text-[11px] text-gold mt-2.5">{boss.name} IS WAITING</div>
      <div className="text-[12px] text-ink-dim mt-2 leading-snug">
        You have beaten everything on this stretch of road. {levels === 1 ? 'One more level' : `${levels} more levels`} and
        it opens.
      </div>
      <div className="font-pixel text-[8px] mt-3" style={{ color: act.color }}>
        ACT {act.numeral} · {act.name}
      </div>
    </Panel>
  )
}

/** One rung of the ladder. State is carried by colour, art and one right-hand tag. */
function PathRow({ boss, status, damage, onOpen }) {
  const act = actById(boss.act)
  const cleared = status === 'cleared'
  const fighting = status === 'fighting'
  const locked = status === 'locked'

  const art = locked
    ? { filter: 'grayscale(1) brightness(0.45)', opacity: 0.7 }
    : cleared
      ? { filter: 'grayscale(0.85)', opacity: 0.45 }
      : undefined

  return (
    <button onClick={onOpen} className="w-full text-left active:brightness-125">
      <div
        className="flex items-center gap-3 px-2.5 py-2 border-b border-line last:border-0 min-h-[52px]"
        style={fighting ? { background: alpha(act.color, 14) } : undefined}
      >
        <div
          className="w-10 h-10 grid place-items-center shrink-0 border"
          style={{ borderColor: fighting ? act.color : 'var(--color-line)' }}
        >
          <BossArt sprite={boss.sprite} size={26} style={art} />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="font-pixel text-[8px] truncate"
            style={{ color: fighting ? act.color : cleared ? 'var(--color-ink-faint)' : 'var(--color-ink)' }}
          >
            {boss.name}
          </div>
          {fighting ? (
            <Bar pct={damage / boss.hp} color="var(--color-danger)" height={3} className="mt-1.5" />
          ) : (
            <div className="text-[10px] text-ink-faint mt-1">{cleared ? boss.title : `Opens at level ${boss.level}`}</div>
          )}
        </div>

        {cleared && <Icon name="check" size={13} color="var(--color-lime)" />}
        {fighting && (
          // Danger red lands at 3.99:1 on the act-tinted row, so the live figure
          // takes the act colour — which also ties the row together.
          <span className="font-mono text-[11px] shrink-0" style={{ color: act.color }}>
            {Math.round((damage / boss.hp) * 100)}%
          </span>
        )}
        {locked && <Icon name="lock" size={12} color="var(--color-ink-faint)" />}
        {status === 'ahead' && <span className="font-pixel text-[7px] text-ink-faint shrink-0">LV {boss.level}</span>}
      </div>
    </button>
  )
}

/** Everything about one boss, including the ones you have not met yet. */
function BossSheet({ boss, status, damage, onClose, onFight }) {
  const act = actById(boss.act)
  const cleared = status === 'cleared'
  const fighting = status === 'fighting'
  const r = boss.reward

  return (
    <Modal open onClose={onClose} title={boss.name} accent={act.color}>
      <div className="text-center">
        <BossArt
          sprite={boss.sprite}
          size={120}
          className="mx-auto"
          style={status === 'locked' ? { filter: 'grayscale(1) brightness(0.45)', opacity: 0.7 } : undefined}
        />
        <div className="text-[12px] text-ink-dim mt-2">{boss.title}</div>
        <div className="font-pixel text-[7px] mt-2.5" style={{ color: act.color }}>
          ACT {act.numeral} · OPENS AT LEVEL {boss.level}
        </div>
      </div>

      <p className="text-[12px] text-ink-dim mt-3.5 leading-relaxed">{boss.lore}</p>

      {fighting && (
        <div className="mt-3.5">
          <Bar pct={damage / boss.hp} color="var(--color-danger)" height={8} />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[11px] text-danger">{fmtFull(Math.round(damage))}</span>
            <span className="font-mono text-[11px] text-ink-faint">{fmtFull(boss.hp)} HP</span>
          </div>
        </div>
      )}
      {cleared && (
        <div className="flex items-center gap-2 mt-3.5 border border-lime p-2.5">
          <Icon name="check" size={13} color="var(--color-lime)" />
          <span className="font-pixel text-[8px] text-lime">CLEARED</span>
        </div>
      )}

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-pixel text-[7px] text-ink-faint">WEAK TO {boss.weak && '· x2 DAMAGE'}</div>
        <div className="text-[12px] mt-1.5" style={{ color: act.color }}>
          {boss.weakLabel}
        </div>
        <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">{boss.beat}</div>
      </div>

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-pixel text-[7px] text-ink-faint">DROPS</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
          <span className="flex items-center gap-1.5">
            <Icon name="core" size={12} color="var(--color-gold)" />
            <span className="font-mono text-[11px] text-gold">{fmtFull(r.cores)}</span>
          </span>
          {r.gear && (
            <span className="font-pixel text-[7px]" style={{ color: RARITY[r.gear].color }}>
              {RARITY[r.gear].label} GEAR
            </span>
          )}
          {r.pet && (
            <span className="flex items-center gap-1.5">
              <PetView refId={r.pet} level={1} size={24} />
              <span className="font-pixel text-[7px] text-cyan">COMPANION</span>
            </span>
          )}
          {r.title && <span className="text-[11px] text-ink-dim">Title · {r.title}</span>}
        </div>
      </div>

      {fighting && (
        <Btn full variant="danger" className="mt-3.5" onClick={onFight}>
          FIGHT IT
        </Btn>
      )}
    </Modal>
  )
}

function Story({ onFight, onOpen }) {
  const { state } = useGame()
  const c = campaignState(state.player, state.campaign)

  return (
    <>
      {c.current ? (
        <CurrentBoss boss={c.current} damage={c.damage} onFight={() => onFight(c.current)} onOpen={() => onOpen(c.current)} />
      ) : c.locked ? (
        <Gated boss={c.locked} levels={c.gatedBy} />
      ) : (
        <Panel accent="var(--color-gold)" className="p-4 text-center">
          <div className="font-pixel text-[13px] text-gold">STORY COMPLETE</div>
          <div className="text-[12px] text-ink-dim mt-2">Every boss down. You are the thing on the box.</div>
        </Panel>
      )}

      <Panel corners={false} className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[8px] text-ink-faint">BOSSES DOWN</span>
          <span className="font-mono text-[12px] text-neon-bright">
            {c.cleared} / {c.total}
          </span>
        </div>
        <Bar pct={c.cleared / c.total} color="var(--color-neon)" height={6} className="mt-2" />
      </Panel>

      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">your road</span>}>THE PATH</SectionTitle>
        <div className="space-y-2.5">
          {ACTS.map((act) => {
            const bosses = CAMPAIGN.filter((b) => b.act === act.id)
            const done = bosses.filter((b) => c.defeated.includes(b.id)).length
            return (
              <div key={act.id}>
                <div className="flex items-center gap-2 px-0.5 mb-1.5">
                  <span className="font-pixel text-[8px]" style={{ color: act.color }}>
                    ACT {act.numeral}
                  </span>
                  <span className="font-pixel text-[7px] text-ink-faint truncate">{act.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-ink-faint shrink-0">
                    {done}/{bosses.length}
                  </span>
                </div>
                <Panel corners={false} className="p-0.5">
                  {bosses.map((b) => (
                    <PathRow
                      key={b.id}
                      boss={b}
                      status={
                        c.defeated.includes(b.id)
                          ? 'cleared'
                          : c.current && c.current.id === b.id
                            ? 'fighting'
                            : state.player.level >= b.level
                              ? 'ahead'
                              : 'locked'
                      }
                      damage={c.damage}
                      onOpen={() => onOpen(b)}
                    />
                  ))}
                </Panel>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ------------------------------------------------------------------ world raid

function WorldRaid({ onLog }) {
  const { state } = useGame()
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
    <>
      <Panel accent="var(--color-danger)" className="p-4 text-center">
        <Chip color="var(--color-danger)" className="mb-3">
          {BOSS.subtitle} · {daysLeft} DAYS LEFT
        </Chip>
        <BossArt sprite={BOSS.sprite} size={132} className="mx-auto" />
        <div className="font-pixel text-[13px] text-danger mt-2">{BOSS.name}</div>
        <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
          Everyone in LVL100 is hitting this one at the same time. Kilometres are the only thing that moves it.
        </div>

        <div className="mt-4">
          <Bar pct={pct} color="var(--color-danger)" height={12} shine />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[10px] text-ink-dim">{fmtFull(km)} km</span>
            <span className="font-mono text-[10px] text-ink-faint">{fmtFull(BOSS.goalKm)} km</span>
          </div>
        </div>

        <Btn full variant="danger" className="mt-3.5" onClick={onLog}>
          LOG DISTANCE
        </Btn>
      </Panel>

      <Panel className="p-3.5" accent="var(--color-gold)">
        <SectionTitle color="var(--color-gold)">SEASON REWARDS</SectionTitle>
        <div className="flex items-center gap-3">
          <PetView refId={petReward?.ref ?? 'zeus'} level={100} size={56} float />
          <div className="min-w-0">
            <div className="font-pixel text-[9px] text-gold">{petReward?.name ?? 'SEASON REWARD'}</div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
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

      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">your friends only</span>}>
          SQUAD DAMAGE
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
    </>
  )
}

// ----------------------------------------------------------------------- shell

export default function Boss() {
  const { state } = useGame()
  const [mode, setMode] = useState('story')
  const [sheet, setSheet] = useState(null)
  const [fighting, setFighting] = useState(null)
  const [raidLog, setRaidLog] = useState(false)
  const c = campaignState(state.player, state.campaign)

  const status = (b) =>
    c.defeated.includes(b.id)
      ? 'cleared'
      : c.current && c.current.id === b.id
        ? 'fighting'
        : state.player.level >= b.level
          ? 'ahead'
          : 'locked'

  return (
    <div className="p-3 space-y-3">
      {/* Two modes, one job each — the old page tried to be both at once. */}
      <div className="grid grid-cols-2 gap-2">
        {[
          ['story', 'YOUR STORY'],
          ['world', 'WORLD RAID'],
        ].map(([id, label]) => {
          const on = mode === id
          return (
            <button
              key={id}
              onClick={() => setMode(id)}
              aria-pressed={on}
              className="font-pixel text-[8px] min-h-[44px] border transition-colors active:brightness-125"
              style={{
                borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
                background: on ? 'var(--color-neon)' : 'transparent',
                color: on ? '#0b0715' : 'var(--color-ink-faint)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {mode === 'story' ? (
        <Story onFight={setFighting} onOpen={setSheet} />
      ) : (
        <WorldRaid onLog={() => setRaidLog(true)} />
      )}

      {sheet && (
        <BossSheet
          boss={sheet}
          status={status(sheet)}
          damage={c.damage}
          onClose={() => setSheet(null)}
          onFight={() => {
            setFighting(sheet)
            setSheet(null)
          }}
        />
      )}

      {fighting && (
        <LogSheet
          title={fighting.name}
          accepts={fightOrder(fighting)}
          accent={actById(fighting.act).color}
          onClose={() => setFighting(null)}
        />
      )}

      {raidLog && (
        <LogSheet title="HIT THE RAID" accepts={RAID_ACTIVITIES} accent="var(--color-danger)" onClose={() => setRaidLog(false)} />
      )}
    </div>
  )
}
