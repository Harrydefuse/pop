import PixelSprite from './PixelSprite'
import { BOSS_SPRITES, GEAR_OVERLAYS, GEAR_SPRITES, PET_SPRITES, STONE_SPRITE, heroSprite } from '../game/sprites'
import { RARITY } from '../game/config'
import { petStage } from '../game/engine'
import { GEAR_CATALOG } from '../game/data'

export function GearIcon({ refId, rarity = 'common', size = 34 }) {
  const base = GEAR_CATALOG.find((g) => g.id === refId)
  const sprite = GEAR_SPRITES[base?.sprite ?? 'charm']
  return <PixelSprite sprite={sprite} size={size} accent={RARITY[rarity].color} />
}

/**
 * Pets render at a scale set by their evolution stage, so a level-100 companion
 * physically fills more of its frame than a hatchling — the growth is visible
 * before you read a single number.
 */
export function PetView({ refId, level = 1, size = 72, float, className = '' }) {
  const sprite = PET_SPRITES[refId] ?? PET_SPRITES.pup
  const stage = petStage(level)
  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size, height: size }}>
      {stage.aura && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.45), transparent 65%)',
            filter: 'blur(4px)',
          }}
        />
      )}
      <PixelSprite
        sprite={sprite}
        size={Math.round(size * stage.scale * 0.92)}
        className={float ? 'float-soft relative' : 'relative'}
      />
    </div>
  )
}

/**
 * Full-body character with whatever is equipped drawn onto the body. Overlays
 * share the hero's 16x24 frame, so stacking them lines the gear up exactly and
 * a rarity colour reads straight off the character.
 */
export function HeroView({ av = {}, equipped = {}, height = 150, className = '' }) {
  const width = Math.round((height * 16) / 24)
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width, height }}>
      <PixelSprite sprite={heroSprite(av.skin, av.hair, av.shirt, av.hairLength)} size={width} />
      {Object.entries(equipped).map(([slot, item]) => {
        const overlay = GEAR_OVERLAYS[slot]
        if (!overlay || !item) return null
        return (
          <PixelSprite
            key={slot}
            sprite={overlay}
            size={width}
            accent={RARITY[item.rarity].color}
            className="absolute inset-0"
          />
        )
      })}
    </div>
  )
}

export function StoneIcon({ color, size = 22, dim }) {
  return <PixelSprite sprite={STONE_SPRITE} size={size} accent={color} style={dim ? { opacity: 0.25, filter: 'grayscale(1)' } : undefined} />
}

export function BossArt({ sprite = 'ogre', size = 180, className = '' }) {
  return <PixelSprite sprite={BOSS_SPRITES[sprite] ?? BOSS_SPRITES.ogre} size={size} className={className} />
}
