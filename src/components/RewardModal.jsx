import { Btn, Chip, Modal, RarityFrame, RarityTag } from './ui'
import { BossArt, ChestArt, GearIcon, PetView } from './Sprites'
import Icon from './Icon'
import { DAILY_CHEST, RARITY } from '../game/config'
import { actById, bossById } from '../game/campaign'
import { useGame } from '../game/useGame'
import { fmtFull } from '../game/engine'

/**
 * A boss kill is the biggest thing that happens in the game, so it gets its own
 * screen rather than borrowing the chest's. Same drops, completely different
 * weight — this is the story beat, not a daily pull.
 */
function BossDefeat({ reward, onDismiss }) {
  const boss = bossById(reward.boss)
  const act = actById(boss?.act)

  return (
    <Modal open onClose={onDismiss} title="Boss defeated">
      <div className="text-center">
        <div className="loot-pop inline-grid place-items-center">
          <BossArt sprite={boss?.sprite} size={104} style={{ filter: 'grayscale(0.75)', opacity: 0.75 }} />
        </div>
        <div className="font-display text-[22px] mt-2.5" style={{ color: act.color }}>
          {reward.bossName}
        </div>
        <div className="font-display text-[12px] text-ink-faint mt-2">
          ACT {act.numeral} · {act.name}
        </div>
        {reward.title && (
          <Chip color="var(--color-gold)" className="mt-3">
            TITLE EARNED · {reward.title.toUpperCase()}
          </Chip>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Icon name="core" size={13} color="var(--color-gold)" />
          <span className="font-display text-[22px] text-gold">+{fmtFull(reward.cores)}</span>
        </div>
      </div>

      <Drops drops={reward.drops} />

      <Btn full className="mt-4" onClick={onDismiss} style={{ background: act.color, borderColor: act.color, color: 'var(--color-on-accent)' }}>
        Collect
      </Btn>
    </Modal>
  )
}

function Drops({ drops }) {
  return (
    <div className="mt-4 space-y-2">
      {drops.map((d, i) => (
        <div
          key={i}
          className="loot-pop flex items-center gap-3 border border-line bg-panel-2 p-2.5"
          style={{ animationDelay: `${120 + i * 90}ms` }}
        >
          <RarityFrame rarity={d.rarity} size={46}>
            {d.kind === 'pet' ? <PetView refId={d.ref} level={1} size={38} /> : <GearIcon slot={d.slot} kind={d.side ?? d.slot} set={d.set} size={28} />}
          </RarityFrame>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] truncate" style={{ color: RARITY[d.rarity].color }}>
              {d.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <RarityTag rarity={d.rarity} />
              <span className="text-[14px] text-ink-faint">{d.kind === 'pet' ? 'COMPANION' : 'EQUIPMENT'}</span>
            </div>
            {d.duplicate && <div className="text-[14px] text-ink-dim mt-1">Already owned — converted to cores</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RewardModal() {
  const { state, dismissReward } = useGame()
  const reward = state.lastReward
  if (!reward) return null
  if (reward.kind === 'boss') return <BossDefeat reward={reward} onDismiss={dismissReward} />

  const best = reward.drops.reduce(
    (acc, d) => (RARITY[d.rarity].weight < RARITY[acc].weight ? d.rarity : acc),
    'common',
  )
  const accent = RARITY[best].color
  // A bought chest costs cores where the daily one pays them, so the same
  // modal cannot say "+220" over both. Sign the number by where it came from.
  const bought = reward.kind === 'shop'

  return (
    <Modal open onClose={dismissReward} title={bought ? reward.name : DAILY_CHEST.name}>
      <div className="text-center">
        <div className="loot-pop inline-grid place-items-center">
          <ChestArt size={60} />
        </div>
        <div className="font-display text-[13px] text-ink-faint mt-3">
          {bought ? 'OPENED' : "TODAY'S PULL"}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <Icon name="core" size={13} color={bought ? 'var(--color-ink-faint)' : 'var(--color-gold)'} />
          <span
            className="font-display text-[22px]"
            style={{ color: bought ? 'var(--color-ink-faint)' : 'var(--color-gold)' }}
          >
            {bought ? `−${fmtFull(reward.spent)}` : `+${fmtFull(reward.cores)}`}
          </span>
        </div>
      </div>

      <Drops drops={reward.drops} />

      <Btn full className="mt-4" onClick={dismissReward} style={{ background: accent, borderColor: accent, color: 'var(--color-on-accent)' }}>
        Collect
      </Btn>
    </Modal>
  )
}
