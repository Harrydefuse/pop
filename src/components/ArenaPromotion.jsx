import { Btn, Modal, Panel } from './ui'
import Icon from './Icon'
import ArenaEmblem from './ArenaEmblem'
import { useGame } from '../game/useGame'
import { ARENAS } from '../game/arenas'
import { campaignState, fmtFull } from '../game/engine'
import { RARITY } from '../game/config'
import { alpha } from '../game/color'

/**
 * Moving up a rung.
 *
 * The ladder was already there — your level has always decided which boss is
 * in front of you — but crossing from one bracket to the next happened in
 * silence, which made a rank system read as a number quietly changing. This is
 * the moment: a new room, its colour, its crest, and the three things that are
 * different about it.
 *
 * It is driven entirely by where your level puts you against `arenaSeen`, so
 * there is no event to fire and nothing to remember to call — every route to a
 * level (a session, a fight, an import, the test account) lands here on its
 * own, once, and never again for the same room.
 */
export default function ArenaPromotion() {
  const { state, seeArena } = useGame()
  const c = campaignState(state.player, state.campaign)
  const seen = state.arenaSeen ?? 1
  const arena = c.arena

  // Not during onboarding, and not on top of the session payout — the reward
  // screen is the moment you earned it, this is the moment it moved you.
  if (!state.onboarded || state.sessionReward) return null
  if (!arena || arena.n <= seen) return null

  const boss = c.current ?? c.locked
  const reward = boss?.reward
  const left = ARENAS.length - arena.n
  const facts = [
    boss && {
      icon: 'swords',
      color: 'var(--color-danger)',
      title: `${boss.name} is waiting`,
      body: `${fmtFull(c.hp)} HP · Arena ${arena.n} of ${ARENAS.length}`,
    },
    {
      icon: 'shield',
      color: arena.tint,
      title: arena.guard ? `Guard is up to ${Math.round(arena.guard * 100)}%` : 'No guard in here',
      // The title carries the number, so the line under it says what the
      // number costs you rather than saying it again.
      body: arena.guard
        ? 'That much of every swing you take in the fight is turned aside. Training still lands in full.'
        : 'Everything you throw at it lands.',
    },
    reward && {
      icon: 'chest',
      color: 'var(--color-gold)',
      title: reward.gear ? `${RARITY[reward.gear].label} gear on the table` : 'There is a payout on the table',
      body: `Clearing ${arena.name} pays ${fmtFull(reward.cores)} coins${reward.title ? ` and the title ${reward.title}` : ''}`,
    },
  ].filter(Boolean)

  return (
    <Modal open onClose={() => seeArena(arena.n)} title="Moving up">
      <div
        className="text-center -mx-4 -mt-4 px-4 pt-5 pb-4"
        style={{ background: `linear-gradient(180deg, ${alpha(arena.tint, 16)} 0%, transparent 90%)` }}
      >
        <div className="label loot-pop" style={{ color: arena.tint }}>
          YOU HAVE MOVED UP
        </div>

        {/* Two soft discs behind the crest, so a flat shape has somewhere to
            land instead of floating on white. */}
        <div
          className="loot-rise mt-4 mx-auto grid place-items-center w-[150px] h-[150px] rounded-full"
          style={{ animationDelay: '90ms', background: alpha(arena.tint, 9) }}
        >
          <div className="grid place-items-center w-[112px] h-[112px] rounded-full" style={{ background: alpha(arena.tint, 11) }}>
            <ArenaEmblem arena={arena} size={82} plate={false} className="float-soft" />
          </div>
        </div>

        <div className="loot-pop font-display text-[13px] mt-3" style={{ color: arena.tint, animationDelay: '200ms' }}>
          ARENA {arena.n}
        </div>
        <div className="loot-pop font-display text-[27px] mt-1 text-ink" style={{ animationDelay: '240ms' }}>
          {arena.name}
        </div>
        <div className="loot-pop label mt-2" style={{ color: arena.tint, animationDelay: '290ms' }}>
          {arena.theme.toUpperCase()}
        </div>
        <div className="loot-pop label text-ink-faint mt-2" style={{ animationDelay: '330ms' }}>
          {c.band}
        </div>
      </div>

      <div className="space-y-2 mt-1">
        {facts.map((f, i) => (
          <Panel key={f.title} className="loot-pop p-3 flex items-center gap-3" style={{ animationDelay: `${380 + i * 70}ms` }}>
            <Icon name={f.icon} size={15} color={f.color} />
            <div className="min-w-0">
              <div className="font-display text-[14px] text-ink">{f.title}</div>
              <div className="text-[14px] text-ink-dim mt-0.5 leading-snug">{f.body}</div>
            </div>
          </Panel>
        ))}
      </div>

      <Btn full className="mt-3.5" onClick={() => seeArena(arena.n)}>
        Step into {arena.name}
      </Btn>
      <div className="text-center text-[14px] text-ink-faint mt-2.5">
        {left === 0 ? 'This is the last one.' : left === 1 ? 'One arena left after this.' : `${left} arenas left after this.`}
      </div>
    </Modal>
  )
}
