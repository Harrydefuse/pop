import PixelSprite from './PixelSprite'
import { ARMOUR_PALETTES, BOSS_SPRITES, CHEST_SPRITE, FOUNDER_PALETTE, CAMPAIGN_SPRITES, PET_SPRITES, STONE_SPRITE, WEAPON_OVERLAYS, WORN_OVERLAYS, armourSprite, heroClothes, heroSprite } from '../game/sprites'
import { petStage } from '../game/engine'
import { RARITY, RARITY_ORDER } from '../game/config'
import { alpha } from '../game/color'
import Icon from './Icon'

// Where the sparks sit and how long each waits before its turn. They hug the
// outside of the silhouette rather than landing on the character: a spark in
// the middle of a breastplate reads as a speck of rust, not as light. Fixed
// rather than random so the character does not glitter differently every
// render.
const SPARKS = [
  { x: '-6%', y: '22%', d: '0s', s: 15 },
  { x: '92%', y: '32%', d: '0.4s', s: 13 },
  { x: '44%', y: '-6%', d: '0.9s', s: 17 },
  { x: '-2%', y: '70%', d: '1.3s', s: 13 },
  { x: '90%', y: '64%', d: '1.7s', s: 15 },
  { x: '20%', y: '-2%', d: '2.1s', s: 11 },
]

/** A star with a white heart, which is what a spark looks like at any size. */
function Spark({ color, size }) {
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <Icon name="spark" size={size} color={color} className="absolute" />
      <Icon name="spark" size={Math.max(4, Math.round(size * 0.55))} color="#ffffff" className="absolute" />
    </span>
  )
}

/**
 * What the kit is worth, as something you can see on the character.
 *
 * Rare gets a glow, epic adds sparks, legendary turns both up — and a full set
 * of the same tier reads louder than one lucky drop, because the count feeds
 * the strength. Below rare nothing happens at all, which is the point: an
 * effect everything has is not a reward.
 */
function gearAura(equipped) {
  const worn = Object.values(equipped ?? {}).filter(Boolean)
  if (!worn.length) return null
  let best = -1
  for (const item of worn) best = Math.max(best, RARITY_ORDER.indexOf(item.rarity))
  if (best < 2) return null
  const matching = worn.filter((i) => RARITY_ORDER.indexOf(i.rarity) === best).length
  const tier = RARITY[RARITY_ORDER[best]]
  return {
    // The bright twin, not the one that carries text: this is light.
    color: tier.glow ?? tier.color,
    // A single rare piece is a faint halo; six legendaries light the room.
    strength: Math.min(1, (best - 1) / 3 + matching / 12),
    sparks: best >= 3 ? (best >= 4 ? 6 : 3) : 0,
  }
}

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
  const body = heroSprite(av.skin, av.hair, av.shirt, av.body)
  const clothes = heroClothes(av.body)
  const build = av.body ?? 'male'
  // Every build has a set cut to its own silhouette now, so there is no longer
  // a question of whether armour can be drawn — only which set of art to use.
  const plate = WORN_OVERLAYS[build] ?? WORN_OVERLAYS.male
  const armoured = equipped
  const held = equipped.offhand
  const weapon = held ? WEAPON_OVERLAYS[build]?.[held.kind] : null
  const width = Math.round((height * body.w) / body.h)
  const aura = gearAura(equipped)
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width, height }}>
      {aura && (
        <>
          <span
            aria-hidden="true"
            className="gear-aura absolute pointer-events-none"
            style={{
              inset: `${-height * 0.08}px ${-width * 0.22}px`,
              background: `radial-gradient(ellipse at 50% 46%, ${alpha(aura.color, Math.round(62 * aura.strength))}, transparent 68%)`,
            }}
          />
          {/* The ground takes the light too. Without it the glow floats and the
              character looks cut out and pasted on. */}
          <span
            aria-hidden="true"
            className="gear-aura absolute pointer-events-none"
            style={{
              left: '12%',
              right: '12%',
              bottom: '-3%',
              height: '9%',
              background: `radial-gradient(ellipse at 50% 50%, ${alpha(aura.color, Math.round(78 * aura.strength))}, transparent 70%)`,
            }}
          />
        </>
      )}

      <PixelSprite sprite={body} size={width} className="relative" />

      {/* Clothes only where there is no armour, so nothing pokes out underneath
          — except on a build with no armour art of its own, where the garment
          that slot covers is repainted in the metal instead. */}
      {Object.entries(clothes).map(([slot, grid]) => {
        if (armoured[slot]) return null
        return (
          <PixelSprite
            key={`c-${slot}`}
            sprite={{ ...body, grid, palette: body.palette }}
            size={width}
            className="absolute inset-0"
          />
        )
      })}
      {Object.entries(armoured).map(([slot, item]) => {
        // The offhand is drawn from the weapon table further down, on both
        // builds, so it is skipped here.
        // The offhand is drawn from the weapon table further down, and the
        // gauntlets after it, so the hand closes over the grip instead of the
        // weapon sitting on top of the fist.
        if (slot === 'offhand' || slot === 'gloves') return null
        const overlay = plate[item?.kind ?? slot]
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

      {weapon && (
        <PixelSprite
          sprite={{ ...weapon, palette: ARMOUR_PALETTES[held.set] ?? ARMOUR_PALETTES.leather }}
          size={width}
          className="absolute inset-0"
        />
      )}

      {/* Last, so a gauntlet grips the weapon rather than being covered by it. */}
      {armoured.gloves && plate.gloves && (
        <PixelSprite
          sprite={{
            ...plate.gloves,
            palette:
              armoured.gloves.set === 'founder'
                ? FOUNDER_PALETTE
                : (ARMOUR_PALETTES[armoured.gloves.set] ?? ARMOUR_PALETTES.leather),
          }}
          size={width}
          className="absolute inset-0"
        />
      )}

      {aura?.sparks
        ? SPARKS.slice(0, aura.sparks).map((sp) => (
            <span
              key={sp.d}
              aria-hidden="true"
              className="gear-spark absolute pointer-events-none"
              style={{ left: sp.x, top: sp.y, animationDelay: sp.d }}
            >
              <Spark color={aura.color} size={Math.max(8, Math.round((sp.s * width) / 100))} />
            </span>
          ))
        : null}
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
