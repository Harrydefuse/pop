import PixelSprite from './PixelSprite'
import { ARMOUR_PALETTES, BOSS_SPRITES, CAMPAIGN_SPRITES, GEAR_OVERLAYS, PET_SPRITES, STONE_SPRITE, armourSprite, heroSprite } from '../game/sprites'
import { petStage } from '../game/engine'

export function GearIcon({ slot, set = 'leather', size = 34 }) {
  return <PixelSprite sprite={armourSprite(slot, set)} size={size} />
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
  // Aspect comes off the sprite rather than a constant, so dropping in art at a
  // different resolution does not need every call site changed.
  const body = heroSprite(av.skin, av.hair, av.shirt, av.hairLength)
  const width = Math.round((height * body.w) / body.h)
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width, height }}>
      <PixelSprite sprite={body} size={width} />
      {Object.entries(equipped).map(([slot, item]) => {
        const overlay = GEAR_OVERLAYS[slot]
        if (!overlay || !item) return null
        return (
          <PixelSprite
            key={slot}
            sprite={{ ...overlay, palette: ARMOUR_PALETTES[item.set] ?? ARMOUR_PALETTES.leather }}
            size={width}
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

export function BossArt({ sprite = 'ogre', size = 180, className = '', style }) {
  const art = BOSS_SPRITES[sprite] ?? CAMPAIGN_SPRITES[sprite] ?? BOSS_SPRITES.ogre
  return <PixelSprite sprite={art} size={size} className={className} style={style} />
}
