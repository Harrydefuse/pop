import { Btn, Modal, RarityFrame, RarityTag } from './ui'
import { GearIcon, PetView } from './Sprites'
import Icon from './Icon'
import { RARITY } from '../game/config'
import { useGame } from '../game/useGame'
import { fmtFull } from '../game/engine'
import { DAILY_CHEST } from '../game/config'

export default function RewardModal() {
  const { state, dismissReward } = useGame()
  const reward = state.lastReward
  if (!reward) return null

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

      <div className="mt-4 space-y-2">
        {reward.drops.map((d, i) => (
          <div
            key={i}
            className="loot-pop flex items-center gap-3 border border-line bg-panel-2 p-2.5"
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <RarityFrame rarity={d.rarity} size={46}>
              {d.kind === 'pet' ? <PetView refId={d.ref} level={1} size={38} /> : <GearIcon refId={d.ref} rarity={d.rarity} size={28} />}
            </RarityFrame>
            <div className="min-w-0 flex-1">
              <div className="font-pixel text-[9px] truncate" style={{ color: RARITY[d.rarity].color }}>
                {d.name}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <RarityTag rarity={d.rarity} />
                <span className="text-[10px] text-ink-faint">{d.kind === 'pet' ? 'COMPANION' : 'EQUIPMENT'}</span>
              </div>
              {d.duplicate && <div className="text-[10px] text-ink-dim mt-1">Already owned — converted to 300 cores</div>}
            </div>
          </div>
        ))}
      </div>

      <Btn full className="mt-4" onClick={dismissReward} style={{ background: accent, borderColor: accent, color: '#12081f' }}>
        COLLECT
      </Btn>
    </Modal>
  )
}
