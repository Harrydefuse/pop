import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, SectionTitle } from './ui'
import Icon from './Icon'
import LogSheet from './LogSheet'
import { BossArt, PetView } from './Sprites'
import Arena from './Arena'
import WorldRaid from './WorldRaid'
import { useGame } from '../game/useGame'
import { ACTIVITIES, RARITY } from '../game/config'
import { actById } from '../game/campaign'
import { ARENAS, guardNote, guardPips } from '../game/arenas'
import { arenaLadder, campaignState, fmtFull } from '../game/engine'
import ArenaEmblem from './ArenaEmblem'
import { alpha } from '../game/color'

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

function statusOf(boss, player, c) {
  if (c.defeated.includes(boss.id)) return 'cleared'
  if (c.current && c.current.id === boss.id) return 'fighting'
  return player.level >= boss.level ? 'ahead' : 'locked'
}

const SILHOUETTE = { filter: 'grayscale(1) brightness(0.45)', opacity: 0.7 }

/** Five pips, one per step of guard. The only per-arena number on a row. */
function GuardPips({ arena, className = '' }) {
  const filled = guardPips(arena.guard)
  return (
    <span className={`flex gap-[3px] ${className}`} title={guardNote(arena.guard)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[7px] h-[7px]"
          style={{ background: i < filled ? arena.tint : 'var(--color-line)' }}
        />
      ))}
    </span>
  )
}

/** The boss you are standing in front of, in the room it stands in. */
function CurrentBoss({ boss, c, onFight, onArena }) {
  const act = actById(boss.act)
  const arena = c.arena

  return (
    <Panel accent={arena.tint} className="p-3.5 text-center">
      {/* The room first, the boss second. Which arena you are in is the rank;
          the boss is what is standing in it this time. */}
      <div
        className="-mx-3.5 -mt-3.5 px-3.5 pt-4 pb-3.5 flex items-center gap-3 text-left"
        style={{ background: alpha(arena.tint, 10) }}
      >
        <ArenaEmblem arena={arena} size={46} plate={false} />
        <div className="min-w-0">
          <div className="label" style={{ color: arena.tint }}>
            ARENA {arena.n} OF {ARENAS.length} · {arena.name.toUpperCase()}
          </div>
          <div className="font-display text-[14px] text-ink mt-1 truncate">{arena.theme}</div>
          <div className="text-[14px] text-ink-faint mt-0.5">{c.band}</div>
        </div>
        <GuardPips arena={arena} className="ml-auto shrink-0" />
      </div>

      <BossArt sprite={boss.sprite} size={116} className="mx-auto float-soft mt-3" />
      <div className="font-display text-[20px] mt-2" style={{ color: arena.tint }}>
        {boss.name}
      </div>
      <div className="text-[14px] text-ink-dim mt-1">{boss.title}</div>

      <div className="mt-3.5">
        <Bar pct={c.pct} color="var(--color-danger)" height={12} shine label="Damage done to this boss" />
        <div className="flex justify-between mt-1.5">
          <span className="text-[14px] text-danger">{fmtFull(Math.round(c.damage))}</span>
          <span className="text-[14px] text-ink-faint">{fmtFull(c.hp)} HP</span>
        </div>
        {/* Said out loud, because it is the rule the whole ladder runs on. */}
        <div className="text-[14px] text-ink-dim mt-2 leading-snug">
          Its health is the XP from level {c.from} to {c.to - 1}. Train, and it comes down as you go up.
        </div>
      </div>

      <div className="mt-3 border p-2.5 text-left" style={{ borderColor: alpha(act.color, 40), background: alpha(act.color, 8) }}>
        <div className="flex items-center gap-2">
          <span className="font-display text-[12px] text-ink-faint">Weak to</span>
          {boss.weak && (
            <span className="font-display text-[12px] px-1.5 py-0.5" style={{ background: act.color, color: 'var(--color-on-accent)' }}>
              x2 DMG
            </span>
          )}
        </div>
        <div className="text-[15px] mt-1.5" style={{ color: act.color }}>
          {boss.weakLabel}
        </div>
        <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">{boss.beat}</div>
      </div>

      {/* Sessions wear the boss down on their own; the arena is where you can
          take a swing at finishing it early, and where you can fail. Guard is
          the one thing that only bites in here, so it is said in here. */}
      <button
        onClick={onArena}
        className="w-full mt-3.5 py-4 border-2 font-display text-[22px] transition-transform active:scale-[0.98]"
        style={{
          borderColor: 'var(--color-danger)',
          background: 'var(--color-danger)',
          color: 'var(--color-on-accent)',
          boxShadow: `0 0 26px -6px var(--color-danger)`,
        }}
      >
        Battle
        <span className="block font-display text-[12px] mt-1.5 opacity-80">{boss.name}</span>
      </button>
      <div className="text-[14px] text-ink-faint mt-2 leading-snug">{guardNote(arena.guard)}</div>
      <Btn full variant="ghost" size="sm" className="mt-1.5" onClick={onFight}>
        What am I fighting?
      </Btn>
    </Panel>
  )
}

/** Shown when you have cleared everything your level allows. */
function Gated({ boss, levels }) {
  return (
    <Panel accent="var(--color-gold)" className="p-3.5 text-center">
      <Chip color="var(--color-gold)" className="mb-3">
        Road clear
      </Chip>
      <BossArt sprite={boss.sprite} size={96} className="mx-auto" style={SILHOUETTE} />
      <div className="font-display text-[18px] text-gold mt-2.5">{boss.name} IS WAITING</div>
      <div className="text-[15px] text-ink-dim mt-2 leading-snug">
        You have beaten everything your level opens. {levels === 1 ? 'One more level' : `${levels} more levels`} and it
        steps out.
      </div>
    </Panel>
  )
}

/**
 * One rung of the ladder.
 *
 * Every one of the ten shows, from the first session — which is the point of a
 * ladder, and the one thing the old act-grouped path would not do. What stays
 * hidden is the BOSS: a room ahead of you has a name, a colour, a level band
 * and a guard rating, and a question mark where the fight is. You can see how
 * far the climb goes without being told how it ends.
 */
function ArenaRow({ arena, from, to, status, c, onOpen }) {
  const cleared = status === 'cleared'
  const fighting = status === 'fighting'
  const locked = status === 'locked'
  // Tappable once you can see who is in there. The room itself is never a
  // secret — its colour, its crest and its guard show from the first session,
  // because a ladder you cannot see the length of is not a ladder. What is
  // withheld is the boss, which is the part that would give the story away.
  const known = !locked || c.arena.n + 1 >= arena.n
  const Tag = known ? 'button' : 'div'

  return (
    <Tag
      onClick={known ? onOpen : undefined}
      className={`w-full text-left block ${known ? 'active:brightness-125' : ''}`}
    >
      <div
        className="flex items-center gap-2.5 px-2 py-2 border-b border-line last:border-0 min-h-[54px]"
        style={fighting ? { background: alpha(arena.tint, 14) } : undefined}
      >
        <ArenaEmblem arena={arena} size={38} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-[13px] truncate"
              style={{ color: fighting ? arena.tint : cleared ? 'var(--color-ink-faint)' : 'var(--color-ink)' }}
            >
              {arena.name}
            </span>
            <span className="label text-ink-faint shrink-0">LV {from}–{to}</span>
          </div>
          {fighting ? (
            <Bar pct={c.pct} color="var(--color-danger)" height={3} className="mt-1.5" />
          ) : (
            <div className="text-[14px] text-ink-faint mt-1 truncate">{arena.theme}</div>
          )}
        </div>

        <GuardPips arena={arena} className="shrink-0" />
        {cleared && <Icon name="check" size={13} color="var(--color-lime)" />}
        {fighting && (
          <span className="text-[14px] shrink-0 tabular-nums" style={{ color: arena.tint }}>
            {Math.round(c.pct * 100)}%
          </span>
        )}
        {!cleared && !fighting && <Icon name="lock" size={12} color="var(--color-ink-faint)" />}
      </div>
    </Tag>
  )
}

/** Everything about one boss, including the ones you have not met yet. */
function Detail({ boss, status, c, onBack, onFight }) {
  const act = actById(boss.act)
  const r = boss.reward

  return (
    <>
      <button onClick={onBack} className="font-display text-[13px] text-ink-faint min-h-[44px] flex items-center active:brightness-125">
        ← THE PATH
      </button>

      <div className="text-center">
        <BossArt sprite={boss.sprite} size={108} className="mx-auto" style={status === 'locked' ? SILHOUETTE : undefined} />
        <div className="font-display text-[18px] mt-2" style={{ color: act.color }}>
          {boss.name}
        </div>
        <div className="text-[15px] text-ink-dim mt-1.5">{boss.title}</div>
        <div className="font-display text-[12px] mt-2.5" style={{ color: act.color }}>
          ACT {act.numeral} · FROM LEVEL {boss.level}
        </div>
      </div>

      <p className="text-[15px] text-ink-dim mt-3.5 leading-relaxed">{boss.lore}</p>

      {status === 'fighting' && (
        <div className="mt-3.5">
          <Bar pct={c.pct} color="var(--color-danger)" height={8} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[14px] text-danger">{fmtFull(Math.round(c.damage))}</span>
            <span className="text-[14px] text-ink-faint">{fmtFull(c.hp)} HP</span>
          </div>
        </div>
      )}
      {status === 'cleared' && (
        <div className="flex items-center gap-2 mt-3.5 border border-lime p-2.5">
          <Icon name="check" size={13} color="var(--color-lime)" />
          <span className="font-display text-[13px] text-lime">Cleared</span>
        </div>
      )}

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-display text-[12px] text-ink-faint">WEAK TO {boss.weak && '· x2 DAMAGE'}</div>
        <div className="text-[15px] mt-1.5" style={{ color: act.color }}>
          {boss.weakLabel}
        </div>
        <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">{boss.beat}</div>
      </div>

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-display text-[12px] text-ink-faint">DROPS</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
          <span className="flex items-center gap-1.5">
            <Icon name="core" size={12} color="var(--color-gold)" />
            <span className="text-[14px] text-gold">{fmtFull(r.cores)}</span>
          </span>
          {r.gear && (
            <span className="font-display text-[12px]" style={{ color: RARITY[r.gear].color }}>
              {RARITY[r.gear].label} GEAR
            </span>
          )}
          {r.pet && (
            <span className="flex items-center gap-1.5">
              <PetView refId={r.pet} stage={1} size={24} />
              <span className="font-display text-[12px] text-cyan">Companion</span>
            </span>
          )}
          {r.title && <span className="text-[14px] text-ink-dim">Title · {r.title}</span>}
        </div>
      </div>

      {status === 'fighting' && (
        <Btn full variant="danger" className="mt-3.5" onClick={onFight}>
          Fight it
        </Btn>
      )}
    </>
  )
}

/**
 * The whole story mode, behind one tap on the objective card.
 *
 * It had a tab of its own for a while, and a tab was the wrong shape for it:
 * your level puts you in front of a boss and your sessions wear it down, so
 * the screen was a report on work that happens on TRAIN. It opens from there
 * now — a tap away from the button that does the damage.
 */
export default function CampaignSheet({ onClose }) {
  const { state } = useGame()
  const [detail, setDetail] = useState(null)
  const [fighting, setFighting] = useState(null)
  const [arena, setArena] = useState(null)
  const c = campaignState(state.player, state.campaign)
  // The whole ladder, every time. The bands and the bosses come off the
  // campaign data rather than being written down twice.
  const ladder = useMemo(() => arenaLadder(), [])

  return (
    <>
      <Modal open onClose={onClose} wide title={detail ? 'BOSS' : 'THE LADDER'}>
        {detail ? (
          <Detail
            boss={detail}
            status={statusOf(detail, state.player, c)}
            c={c}
            onBack={() => setDetail(null)}
            onFight={() => {
              setFighting(detail)
              setDetail(null)
            }}
          />
        ) : (
          <div className="space-y-3">
            {c.current ? (
              <CurrentBoss
                boss={c.current}
                c={c}
                onFight={() => setFighting(c.current)}
                onArena={() => setArena(c.current)}
              />
            ) : c.locked ? (
              <Gated boss={c.locked} levels={c.gatedBy} />
            ) : (
              <Panel accent="var(--color-gold)" className="p-4 text-center">
                <div className="font-display text-[20px] text-gold">Story complete</div>
                <div className="text-[15px] text-ink-dim mt-2">Every boss down. You are the thing on the box.</div>
              </Panel>
            )}

            <Panel className="p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-display text-[13px] text-ink-faint">Arenas cleared</span>
                <span className="text-[15px] text-neon-bright">
                  {c.cleared} / {ARENAS.length}
                </span>
              </div>
              <Bar pct={c.cleared / ARENAS.length} color="var(--color-neon)" height={6} className="mt-2" label="Arenas cleared" />
            </Panel>

            <SectionTitle right={<span className="text-[14px] text-ink-faint">Stone to Everforge</span>}>
              The ladder
            </SectionTitle>
            {/* All ten rooms, from the first session. The climb is the thing
                you are meant to be able to see the length of — what stays
                hidden is who is standing in each one, which is the part that
                would give the story away. */}
            <Panel className="p-0.5">
              {ladder.map((row) => (
                <ArenaRow
                  key={row.arena.n}
                  arena={row.arena}
                  from={row.from}
                  to={row.to}
                  status={statusOf(row.boss, state.player, c)}
                  c={c}
                  onOpen={() => setDetail(row.boss)}
                />
              ))}
            </Panel>
            <div className="text-[14px] text-ink-dim px-0.5 leading-snug">
              Your level decides which room you are standing in. The pips are guard — how much of a swing that arena
              turns aside when you walk into the fight. Training always lands in full.
            </div>

            {/* The world raid, under the story rather than beside it. Both are
                bosses; one is yours and one is everybody's, and that is a
                section on this screen, not a tab of its own. */}
            <SectionTitle right={<span className="text-[14px] text-ink-faint">everybody at once</span>}>
              Global
            </SectionTitle>
            <WorldRaid />
          </div>
        )}
      </Modal>

      {fighting && (
        <LogSheet
          title={fighting.name}
          accepts={fightOrder(fighting)}
          accent={actById(fighting.act).color}
          onClose={() => setFighting(null)}
        />
      )}

      {arena && <Arena boss={arena} onClose={() => setArena(null)} />}
    </>
  )
}
