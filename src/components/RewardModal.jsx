import { Btn, Chip, Modal, RarityFrame, RarityTag } from './ui'
import { BossArt, GearIcon, PetView } from './Sprites'
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
    <Modal open onClose={onDismiss} title="BOSS DEFEATED" accent={act.color}>
      <div className="text-center">
        <div className="loot-pop inline-grid place-items-center">
          <BossArt sprite={boss?.sprite} size={104} style={{ filter: 'grayscale(0.75)', opacity: 0.75 }} />
        </div>
        <div className="font-pixel text-[13px] mt-2.5" style={{ color: act.color }}>
          {reward.bossName}
        </div>
        <div className="font-pixel text-[7px] text-ink-faint mt-2">
          ACT {act.numeral} · {act.name}
        </div>
        {reward.title && (
          <Chip color="var(--color-gold)" className="mt-3">
            TITLE EARNED · {reward.title.toUpperCase()}
          </Chip>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Icon name="core" size={13} color="var(--color-gold)" />
          <span className="font-pixel text-[13px] text-gold">+{fmtFull(reward.cores)}</span>
        </div>
      </div>

      <Drops drops={reward.drops} />

      <Btn full className="mt-4" onClick={onDismiss} style={{ background: act.color, borderColor: act.color, color: '#12081f' }}>
        COLLECT
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
            {d.kind === 'pet' ? <PetView refId={d.ref} level={1} size={38} /> : <GearIcon slot={d.slot} set={d.set} size={28} />}
          </RarityFrame>
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[9px] truncate" style={{ color: RARITY[d.rarity].color }}>
              {d.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <RarityTag rarity={d.rarity} />
              <span className="text-[10px] text-ink-faint">{d.kind === 'pet' ? 'COMPANION' : 'EQUIPMENT'}</span>
            </div>
            {d.duplicate && <div className="text-[10px] text-ink-dim mt-1">Already owned — converted to cores</div>}
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

  return (
    <Modal open onClose={dismissReward} title={DAILY_CHEST.name} accent={accent}>
      <div className="text-center">
        <div className="loot-pop inline-grid place-items-center">
          <Icon name="chest" size={54} color="var(--color-gold)" />
        </div>
        <div className="font-pixel text-[8px] text-ink-faint mt-3">TODAY&apos;S PULL</div>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <Icon name="core" size={13} color="var(--color-gold)" />
          <span className="font-pixel text-[13px] text-gold">+{fmtFull(reward.cores)}</span>
        </div>
      </div>

      <Drops drops={reward.drops} />

      <Btn full className="mt-4" onClick={dismissReward} style={{ background: accent, borderColor: accent, color: '#12081f' }}>
        COLLECT
      </Btn>
    </Modal>
  )
}
