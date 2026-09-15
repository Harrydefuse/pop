import PixelSprite from './PixelSprite'
import { ARMOUR_PALETTES, WEAPON_PALETTES, BOSS_SPRITES, CHEST_SPRITE, PET_SPRITES, LOOT_CHEST_SPRITE, VAULT_SPRITE, FOUNDER_PALETTE, CAMPAIGN_SPRITES, petSprite, WEAPON_OVERLAYS, armourSprite, heroClothes, heroHands, heroSprite, underHelm, wornOverlay } from '../game/sprites'
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
  // A set that emits lights the room in its own colour. Anything else falls
  // back to the rarity's decorative twin — never the one that carries text.
  const lit = worn.find((i) => RARITY_ORDER.indexOf(i.rarity) === best && ARMOUR_PALETTES[i.set]?.E)
  return {
    color: (best >= 3 && lit && ARMOUR_PALETTES[lit.set].E) || tier.glow || tier.color,
    // A single rare piece is a faint halo; six legendaries light the room.
    strength: Math.min(1, (best - 1) / 3 + matching / 12),
    sparks: best >= 3 ? (best >= 4 ? 6 : 3) : 0,
  }
}

/** `kind` is the slot for every piece except the offhand, which is a choice. */
export function GearIcon({ slot, kind, set = 'leather', size = 34, className, style }) {
  return <PixelSprite sprite={armourSprite(kind ?? slot, set)} size={size} className={className} style={style} />
}

/**
 * Pets render at a scale set by their evolution stage, so a level-100 companion
 * physically fills more of its frame than a hatchling — the growth is visible
 * before you read a single number.
 */
// Where the motes leave from and which way they drift. Fixed rather than
// random, for the same reason the gear sparks are: a pet that glitters
// differently on every render reads as a rendering bug, not as magic.
const MOTES = [
  { x: '14%', y: '62%', dx: '-7px', d: '0s', t: '2.9s' },
  { x: '78%', y: '54%', dx: '6px', d: '0.7s', t: '3.2s' },
  { x: '46%', y: '74%', dx: '3px', d: '1.3s', t: '2.6s' },
  { x: '88%', y: '70%', dx: '8px', d: '1.9s', t: '3.4s' },
  { x: '28%', y: '40%', dx: '-5px', d: '2.4s', t: '3s' },
]

// Four flares around the silhouette, each on its own clock and rotation, so
// whatever the pet throws off crawls around it instead of blinking on and off
// as one object.
const ARCS = [
  { x: '-3%', y: '22%', h: 28, rot: -18, d: '0s', t: '1.7s' },
  { x: '84%', y: '14%', h: 32, rot: 16, d: '0.4s', t: '2.1s' },
  { x: '74%', y: '58%', h: 26, rot: -30, d: '0.9s', t: '1.5s' },
  { x: '3%', y: '62%', h: 24, rot: 24, d: '1.3s', t: '1.9s' },
]

/**
 * What a fully grown pet throws off.
 *
 * ZEUS's lightning turned out to be the best thing in the collection, and the
 * reason is that it is HIS — a shared sparkle says "this one is finished",
 * where a bolt says "this one is made of weather". So the flare is a property
 * of the animal: bolts for the storm, flame for the two that burn, shards for
 * the one made of ice. Everything else keeps the motes, which is not a
 * consolation prize — a brute does not need to be on fire.
 *
 * Three shapes, three ways of moving. Lightning is cut with steps() because
 * electricity is there or it is not; flame rises and gutters; a shard hangs
 * and turns.
 */
const FLARES = {
  bolt: { cls: 'pet-arc', w: 10, h: 24, d: 'M6 0 L2.5 9 L7 10.5 L3 24', fill: false },
  flame: { cls: 'pet-flame', w: 12, h: 20, d: 'M6 20 C1 15 2 10 6 0 C10 10 11 15 6 20 Z', fill: true },
  shard: { cls: 'pet-shard', w: 10, h: 22, d: 'M5 0 L9 11 L5 22 L1 11 Z', fill: true },
}

function Flare({ kind, spec }) {
  const f = FLARES[kind] ?? FLARES.bolt
  return (
    <span
      className={f.cls}
      aria-hidden="true"
      style={{
        left: spec.x,
        top: spec.y,
        transform: `rotate(${spec.rot}deg)`,
        animationDelay: spec.d,
        animationDuration: spec.t,
      }}
    >
      <svg width={(spec.h * f.w) / f.h} height={spec.h} viewBox={`0 0 ${f.w} ${f.h}`} fill="none">
        {f.fill ? (
          <path d={f.d} fill="currentColor" />
        ) : (
          <polyline
            points="6,0 2.5,9 7,10.5 3,24"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  )
}

export function PetView({ refId, stage: at = 1, size = 72, float, delay, className = '' }) {
  const stage = petStage(at)
  // Art per stage where a pet has it, the one drawing where it does not.
  const sprite = petSprite(refId, stage.idx)
  const art = PET_SPRITES[refId] ?? PET_SPRITES.pup
  const aura = art.aura ?? '#c084fc'
  // Motes and arcs are suppressed on the small renders. On a 38px rung of the
  // evolution ladder they are bigger than the animal's head, and five of them
  // around a thumbnail is noise rather than magic.
  const lively = stage.aura && size >= 56
  // An ascended pet scales past the size it was given, so the box has to grow
  // with it — otherwise the sprite spills over its own name.
  const px = Math.round(size * stage.scale * 0.92)
  const box = Math.max(size, px)
  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: box, height: box }}>
      {stage.aura && (
        <span
          className="pet-aura absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ '--aura': aura }}
        />
      )}
      {/* `delay` offsets the bob. A row of pets all floating on the same clock
          rises and falls as one object, which reads as a sprite sheet sliding
          rather than as five animals. */}
      <PixelSprite
        sprite={sprite}
        size={px}
        className={float ? 'float-soft relative' : 'relative'}
        style={float && delay ? { animationDelay: delay } : undefined}
      />

      {/* Over the sprite, so the light lands on the animal rather than only
          behind it. */}
      {lively && (
        <span className="absolute inset-0 pointer-events-none" style={{ '--aura': aura }} aria-hidden="true">
          {MOTES.map((m) => (
            <span
              key={m.x + m.d}
              className="pet-mote"
              style={{ left: m.x, top: m.y, '--dx': m.dx, animationDelay: m.d, animationDuration: m.t }}
            />
          ))}
          {art.flare && ARCS.map((a) => <Flare key={a.x + a.d} kind={art.flare} spec={a} />)}
        </span>
      )}
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
  const drawn = heroSprite(av.skin, av.hair, av.shirt, av.body)
  const clothes = heroClothes(av.body)
  const build = av.body ?? 'male'
  // Every build has a set cut to its own silhouette now, so there is no longer
  // a question of whether armour can be drawn — only which set of art to use.
  const armoured = equipped
  // With a helm on, the hair goes with it.
  const body = armoured.helm ? underHelm(drawn) : drawn
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
        const overlay = wornOverlay(build, item, slot)
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

      {/* Steel, not the set's plate colours, and thrown into relief against
          whatever it is standing on. Painted in the armour's own palette it
          vanished — worst of all at the top of the game, where a gilded blade
          on gilded plate was violet on violet. */}
      {weapon && (
        <PixelSprite
          sprite={{ ...weapon, palette: WEAPON_PALETTES[held.set] ?? WEAPON_PALETTES.leather }}
          size={width}
          className="absolute inset-0"
          // The glow is the upgrade, made visible: a +1 blade is barely lit and
          // a +10 one burns. Rarity picks the colour, the level picks how much
          // of it there is, so both halves of "this is a better weapon now" land
          // on the character rather than only in the item sheet.
          style={{
            filter: `drop-shadow(0 0 3px ${alpha('#000000', 85)}) drop-shadow(0 0 ${
              5 + Math.min(9, (held.level ?? 1) - 1)
            }px ${alpha(RARITY[held.rarity].color, 55 + Math.min(9, (held.level ?? 1) - 1) * 5)})`,
          }}
        />
      )}

      {/* The fist, over the grip. A gauntlet does this job when one is worn;
          without it the bare hand was behind the blade and nothing looked
          held. */}
      {weapon && !armoured.gloves && (
        <PixelSprite
          sprite={heroHands(av.skin, av.hair, av.shirt, build)}
          size={width}
          className="absolute inset-0"
        />
      )}

      {/* Last, so a gauntlet grips the weapon rather than being covered by it. */}
      {armoured.gloves && wornOverlay(build, armoured.gloves, 'gloves') && (
        <PixelSprite
          sprite={{
            ...wornOverlay(build, armoured.gloves, 'gloves'),
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

/**
 * A chest, drawn art rather than a UI glyph.
 *
 * `kind` picks which one. Everywhere a chest is just "a chest" — the daily, the
 * founder gift, the reward screen — leaves it off and gets the wooden one,
 * which is the chest this game has always meant. The shop passes a kind,
 * because up there the three rungs have to be told apart at a glance.
 */
const CHEST_ART = { crate: CHEST_SPRITE, loot: LOOT_CHEST_SPRITE, vault: VAULT_SPRITE }

export function ChestArt({ kind = 'crate', size = 48, className = '', style, title }) {
  return (
    <PixelSprite
      sprite={CHEST_ART[kind] ?? CHEST_SPRITE}
      size={size}
      className={className}
      style={style}
      title={title}
    />
  )
}
/**
 * A boss's head, at portrait size.
 *
 * A whole boss shrunk into a thirty-pixel box is a grey smudge — every one of
 * them reads the same. They are all drawn standing, head at the top of the
 * frame, so scaling up and pinning the head to the middle of the box gives a
 * face you can tell apart at a glance.
 */
export function BossFace({ sprite = 'ogre', size = 30, className = '', style }) {
  const art = BOSS_SPRITES[sprite] ?? CAMPAIGN_SPRITES[sprite] ?? BOSS_SPRITES.ogre
  const w = size * 2.6
  const h = (w * art.h) / art.w
  // Where the head sits in the frame, as a fraction of its height. Measured
  // rather than guessed: a boss with empty rows above it would otherwise
  // portrait as blank sky.
  const top = art.grid.findIndex((row) => /[^.\s]/.test(row))
  const head = (Math.max(0, top) + art.h * 0.1) / art.h
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ width: size, height: size, ...style }}>
      <PixelSprite
        sprite={art}
        size={w}
        className="absolute left-1/2"
        style={{ transform: 'translateX(-50%)', top: size / 2 - head * h }}
      />
    </span>
  )
}

export function BossArt({ sprite = 'ogre', size = 180, className = '', style }) {
  const art = BOSS_SPRITES[sprite] ?? CAMPAIGN_SPRITES[sprite] ?? BOSS_SPRITES.ogre
  // Fit to a square box rather than to width. Boss grids are all different
  // shapes, and sizing by width alone made a wide boss tower over a tall one.
  const fitted = art.h > art.w ? Math.round((size * art.w) / art.h) : size
  // Bottom-aligned, not centred: a boss wider than it is tall floated above the
  // ground the hero was standing on.
  return (
    <span className={`grid place-items-end justify-center ${className}`} style={{ width: size, height: size }}>
      <PixelSprite sprite={art} size={fitted} style={style} />
    </span>
  )
}
