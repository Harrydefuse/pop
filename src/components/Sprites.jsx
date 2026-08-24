import PixelSprite from './PixelSprite'
import { ARMOUR_PALETTES, BOSS_SPRITES, CHEST_SPRITE, FOUNDER_PALETTE, CAMPAIGN_SPRITES, GEAR_OVERLAYS, HERO_CLOTHES, PET_SPRITES, STONE_SPRITE, armourSprite, heroSprite } from '../game/sprites'
import { petStage } from '../game/engine'

/** `kind` is the slot for every piece except the offhand, which is a choice. */
export function GearIcon({ slot, kind, set = 'leather', size = 34 }) {
  return <PixelSprite sprite={armourSprite(kind ?? slot, set)} size={size} />
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

      {/* Clothes only where there is no armour, so nothing pokes out underneath. */}
      {Object.entries(HERO_CLOTHES).map(([slot, grid]) =>
        equipped[slot] ? null : (
          <PixelSprite key={`c-${slot}`} sprite={{ ...body, grid }} size={width} className="absolute inset-0" />
        ),
      )}
      {Object.entries(equipped).map(([slot, item]) => {
        const overlay = GEAR_OVERLAYS[item?.kind ?? slot]
        if (!overlay || !item) return null
        return (
          <PixelSprite
            key={slot}
            sprite={{ ...overlay, palette: item.set === 'founder' ? FOUNDER_PALETTE : (ARMOUR_PALETTES[item.set] ?? ARMOUR_PALETTES.leather) }}
            size={width}
            className="absolute inset-0"
          />
        )
      })}
    </div>
  )
}

/** The treasure chest, drawn art rather than a UI glyph. */
export function ChestArt({ size = 48, className = '', style }) {
  return <PixelSprite sprite={CHEST_SPRITE} size={size} className={className} style={style} />
}

export function StoneIcon({ color, size = 22, dim }) {
  return <PixelSprite sprite={STONE_SPRITE} size={size} accent={color} style={dim ? { opacity: 0.25, filter: 'grayscale(1)' } : undefined} />
}

export function BossArt({ sprite = 'ogre', size = 180, className = '', style }) {
  const art = BOSS_SPRITES[sprite] ?? CAMPAIGN_SPRITES[sprite] ?? BOSS_SPRITES.ogre
  // Fit to a square box rather than to width. Boss grids are all different
  // shapes, and sizing by width alone made a wide boss tower over a tall one.
  const fitted = art.h > art.w ? Math.round((size * art.w) / art.h) : size
  return (
    <span className={`grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <PixelSprite sprite={art} size={fitted} style={style} />
    </span>
  )
}
