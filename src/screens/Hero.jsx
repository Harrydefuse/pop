import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, RarityTag } from '../components/ui'
import Icon from '../components/Icon'
import { GearIcon, HeroView, PetView } from '../components/Sprites'
import SaveSheet from '../components/SaveSheet'
import { useGame } from '../game/useGame'
import { ARMOUR_SETS, EQUIP_SLOTS, OFFHAND_KINDS, RARITY, RARITY_ORDER, upgradeCost } from '../game/config'
import { GEAR_CATALOG } from '../game/data'
import { classById, fmt, fmtFull, itemScore, petBonus, petStage, petXpToNext, powerScore, rankFor } from '../game/engine'
import { alpha } from '../game/color'

/* ------------------------------------------------------------------ tiles --- */

/**
 * One tile per owned thing: the icon on a ground tinted with its rarity, the
 * level in the corner, a marker if it is currently worn. Small enough that a
 * full collection fits on one screen instead of a long scrolling list.
 */
function Tile({ rarity, level, equipped, weapon, label, onClick, children }) {
  const color = RARITY[rarity].color
  // A blade and a breastplate were the same tile in the same colours, and the
  // weapon art is thin where the armour art is a solid block — so the weapons
  // were the ones that disappeared. They get their own light: rarity still owns
  // the border and the ground, steel owns the ring around it.
  const ring = weapon
    ? `0 0 0 2px ${WEAPON_GLOW}, 0 0 16px -3px ${WEAPON_GLOW}${equipped ? `, 0 0 0 4px ${color}` : ''}`
    : equipped
      ? `0 0 0 2px ${color}, 0 0 14px -4px ${color}`
      : undefined
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative grid place-items-center aspect-square border-2 transition-transform active:scale-95"
      style={{
        borderColor: color,
        background: alpha(color, equipped ? 40 : 22),
        boxShadow: ring,
      }}
    >
      {children}
      <span
        className="absolute bottom-0 right-0 font-pixel text-[6px] px-1 py-0.5 leading-none"
        style={{ background: 'var(--color-panel)', color }}
      >
        {level}
      </span>
      {equipped && <span className="absolute top-0 left-0 w-1.5 h-1.5" style={{ background: color }} />}
    </button>
  )
}

/* ----------------------------------------------------------------- detail --- */

function ItemSheet({ item, onClose }) {
  const { state, equip, unequip, upgrade } = useGame()
  const p = state.player
  const equipped = p.equipped[item.slot] === item.id
  const cost = upgradeCost(item)
  const color = RARITY[item.rarity].color
  const slotName = EQUIP_SLOTS.find((s) => s.key === item.slot)?.name ?? item.slot

  return (
    <Modal open onClose={onClose} title={item.name.toUpperCase()} accent={color}>
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-16 h-16 shrink-0 border-2"
          style={{ borderColor: color, background: alpha(color, 22) }}
        >
          <GearIcon slot={item.slot} kind={item.kind} set={item.set} size={40} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <RarityTag rarity={item.rarity} />
            <Chip color="var(--color-ink-faint)">{slotName}</Chip>
          </div>
          <div className="font-pixel text-[10px] mt-2" style={{ color }}>
            LEVEL {item.level}
          </div>
        </div>
      </div>

      <div className="mt-3.5 border border-line bg-panel-2 p-3">
        <div className="font-pixel text-[7px] text-ink-faint mb-2">STATS</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(item.stats).map(([k, v]) => (
            <span key={k} className="font-mono text-[12px] text-lime">
              +{Math.round(v * RARITY[item.rarity].mult * (1 + (item.level - 1) * 0.35))} {k}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-ink-faint mt-2.5">
          Rarity multiplies every point, so a legendary at level 1 can still beat a common at level 5.
        </div>
      </div>

      <div className="flex gap-2 mt-3.5">
        <Btn
          full
          onClick={() => {
            if (equipped) unequip(item.slot)
            else equip(item.id)
            onClose()
          }}
        >
          {equipped ? 'TAKE OFF' : 'PUT ON'}
        </Btn>
        <Btn
          variant={p.cores >= cost ? 'gold' : 'dim'}
          disabled={p.cores < cost}
          onClick={() => upgrade(item.id, cost)}
        >
          UPGRADE {fmt(cost)}
        </Btn>
      </div>
    </Modal>
  )
}

function PetSheet({ pet, onClose }) {
  const { state, setPet } = useGame()
  const p = state.player
  const active = p.activePetId === pet.id
  const color = RARITY[pet.rarity].color
  const stage = petStage(pet.level)

  return (
    <Modal open onClose={onClose} title={pet.name} accent={color}>
      <div className="text-center">
        <PetView refId={pet.ref} level={pet.level} size={104} float className="mx-auto" />
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <RarityTag rarity={pet.rarity} />
          <Chip color={color}>{stage.name}</Chip>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="flex justify-between mb-1.5">
          <span className="font-pixel text-[8px]" style={{ color }}>LEVEL {pet.level}</span>
          <span className="font-mono text-[10px] text-ink-faint">
            {fmt(pet.xp)}/{fmt(petXpToNext(pet.level))} XP
          </span>
        </div>
        <Bar pct={pet.xp / petXpToNext(pet.level)} color={color} height={8} />
      </div>

      {/* Evolution is the whole point of levelling a pet, so show the ladder. */}
      <div className="mt-3.5 border border-line bg-panel-2 p-3">
        <div className="font-pixel text-[7px] text-ink-faint mb-2.5">EVOLUTION</div>
        <div className="flex items-end justify-between gap-1">
          {[1, 25, 50, 75, 100].map((lv) => {
            const reached = pet.level >= lv
            return (
              <div key={lv} className="text-center flex-1 min-w-0" style={{ opacity: reached ? 1 : 0.3 }}>
                <div className="grid place-items-center h-12">
                  <PetView refId={pet.ref} level={lv} size={38} />
                </div>
                <div className="h-1 mt-1" style={{ background: reached ? color : 'var(--color-panel-2)' }} />
                <div className="font-pixel text-[6px] mt-1" style={{ color: reached ? color : 'var(--color-ink-faint)' }}>
                  {lv}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-[11px] text-lime mt-3">+{Math.round((3 + pet.level * 0.12) * RARITY[pet.rarity].mult)}% {pet.stat}</div>
      </div>

      <Btn full className="mt-3.5" variant={active ? 'dim' : 'primary'} disabled={active} onClick={() => { setPet(pet.id); onClose() }}>
        {active ? 'ALREADY OUT' : 'BRING THIS ONE'}
      </Btn>
    </Modal>
  )
}

/* ------------------------------------------------------------------- root --- */

const FILTERS = [
  { id: 'all', label: 'YOURS' },
  { id: 'upgrade', label: 'UPGRADE' },
  { id: 'pets', label: 'PETS' },
  { id: 'armoury', label: 'ARMOURY' },
  { id: 'weapons', label: 'WEAPONS' },
]

/**
 * Everything in the game, whether you own it or not.
 *
 * Drops are the only way gear arrives, so a new character has a pair of boots
 * and no idea what else exists — which makes the chest a lottery for a prize
 * you cannot picture. This is the prize list, and it is arranged by piece
 * rather than by set: a row is one thing, five columns are the five ways it
 * can come out of a chest, so you read it as "the axe, and how good an axe
 * gets" instead of "another twelve icons".
 */
const ARMOUR_KINDS = ['helm', 'chest', 'legs', 'gloves', 'boots', 'shield']
const WEAPON_KINDS = ['sword', 'axe', 'dagger', 'spear', 'bow', 'staff']

/** Weapons carry a light of their own, in a hue no rarity uses. The glow is
 *  for the ring around a tile; the deeper twin is the one that carries words. */
const WEAPON_GLOW = 'var(--color-cyan-glow)'
const WEAPON_INK = 'var(--color-cyan)'
const isWeapon = (item) => WEAPON_KINDS.includes(item.kind)

function kindName(kind) {
  return (
    OFFHAND_KINDS.find((k) => k.id === kind)?.name ??
    EQUIP_SLOTS.find((s) => s.key === kind)?.name ??
    kind
  )
}

function Collection({ kinds, owned, onPick, weapons }) {
  const have = useMemo(() => new Set(owned.map((i) => `${i.set}:${i.kind}`)), [owned])
  return (
    <>
      {kinds.map((kind) => {
        const row = ARMOUR_SETS.map((set) => GEAR_CATALOG.find((g) => g.set === set.id && g.kind === kind)).filter(Boolean)
        const got = row.filter((g) => have.has(`${g.set}:${g.kind}`)).length
        return (
          <div key={kind} className="mb-3.5 last:mb-0">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-pixel text-[7px] text-ink-dim">{kindName(kind).toUpperCase()}</span>
              <span className="font-mono text-[10px] text-ink-faint">
                {got}/{row.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {row.map((g) => {
                const mine = have.has(`${g.set}:${g.kind}`)
                const color = RARITY[g.rarity].color
                return (
                  <button
                    key={g.set}
                    onClick={() => onPick(g)}
                    aria-label={`${g.name}${mine ? '' : ', locked'}`}
                    className="relative grid place-items-center aspect-square border transition-transform active:scale-95"
                    style={{
                      borderColor: mine ? color : 'var(--color-line)',
                      background: mine ? alpha(color, 20) : 'var(--color-panel-2)',
                      boxShadow: mine && weapons ? `0 0 0 2px ${WEAPON_GLOW}, 0 0 14px -4px ${WEAPON_GLOW}` : undefined,
                    }}
                  >
                    {/* Dimmed, not hidden — the point is seeing what is out
                        there. Darkened rather than faded, too: a locked piece
                        used to be a pale ghost of grey metal on a pale ground,
                        which is a way of showing something by hiding it. */}
                    <span style={mine ? undefined : { filter: 'grayscale(1) brightness(0.45) contrast(1.3)', opacity: 0.7 }}>
                      <GearIcon slot={g.slot} kind={g.kind} set={g.set} size={26} />
                    </span>
                    {!mine && (
                      <span className="absolute -bottom-px -right-px grid place-items-center w-3.5 h-3.5 bg-void">
                        <Icon name="lock" size={8} color="var(--color-ink-faint)" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

/**
 * The bench. Everything you own, what the next level costs, and whether you
 * can pay for it.
 *
 * Upgrading was buried one tap inside each item's sheet, which meant the only
 * way to find out what your cores were for was to open nine things one at a
 * time. Cheapest first, because that is the order anyone actually spends in.
 */
function Bench({ items, cores, worn, onUpgrade, onOpen }) {
  const rows = useMemo(
    () => [...items].map((i) => ({ item: i, cost: upgradeCost(i) })).sort((a, b) => a.cost - b.cost),
    [items],
  )
  const affordable = rows.filter((r) => r.cost <= cores).length

  if (!rows.length) {
    return <div className="text-[11px] text-ink-faint text-center py-6">Nothing to upgrade yet. Open a chest.</div>
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="font-pixel text-[7px] text-ink-faint">THE BENCH</span>
        <span className="flex items-center gap-1.5">
          <Icon name="core" size={11} color="var(--color-gold)" />
          <span className="font-mono text-[13px] text-gold tabular-nums">{fmt(cores)}</span>
        </span>
      </div>

      <div className="text-[11px] text-ink-dim leading-snug mb-3">
        Cores come out of chests and sessions. Every level on a piece is about a third more of what it already gives
        you. {affordable > 0 ? `You can afford ${affordable} of these right now.` : 'Nothing here is in reach yet.'}
      </div>

      <div className="space-y-1.5">
        {rows.map(({ item, cost }) => {
          const can = cores >= cost
          const color = RARITY[item.rarity].color
          const equipped = worn[item.slot]?.id === item.id
          return (
            <div key={item.id} className="flex items-center gap-2.5 border border-line p-2">
              <button
                onClick={() => onOpen(item)}
                aria-label={`Open ${item.name}`}
                className="grid place-items-center w-11 h-11 shrink-0 border"
                style={{
                  borderColor: color,
                  background: alpha(color, 18),
                  boxShadow: isWeapon(item) ? `0 0 0 2px ${WEAPON_GLOW}` : undefined,
                }}
              >
                <GearIcon slot={item.slot} kind={item.kind} set={item.set} size={26} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="font-mono text-[12px] text-ink truncate">{item.name}</div>
                <div className="font-mono text-[10px] text-ink-faint mt-0.5">
                  LV {item.level} → {item.level + 1}
                  {equipped ? ' · worn' : ''}
                </div>
              </div>

              <button
                onClick={() => onUpgrade(item.id, cost)}
                disabled={!can}
                className="font-pixel text-[7px] min-h-[44px] px-2.5 border shrink-0 disabled:opacity-40 active:brightness-125"
                style={{
                  color: can ? 'var(--color-on-accent)' : 'var(--color-ink-faint)',
                  background: can ? 'var(--color-gold)' : 'transparent',
                  borderColor: can ? 'var(--color-gold)' : 'var(--color-line)',
                }}
              >
                {fmt(cost)}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

/** A piece you have not found yet: what it is, and what it would do. */
function CodexSheet({ piece, onClose }) {
  return (
    <Modal open onClose={onClose} title={piece.name.toUpperCase()} accent={RARITY[piece.rarity].color}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-16 h-16 shrink-0 border" style={{ borderColor: RARITY[piece.rarity].color }}>
          <GearIcon slot={piece.slot} kind={piece.kind} set={piece.set} size={48} />
        </span>
        <div className="min-w-0">
          <RarityTag rarity={piece.rarity} />
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {Object.entries(piece.stats).map(([k, v]) => (
              <span key={k} className="font-mono text-[11px] text-ink-dim">
                {k} +{v}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-ink-dim mt-3 leading-snug">
        Comes out of chests. The rarer the set, the longer you will be waiting — a legendary is a one-in-a-hundred day.
      </div>
    </Modal>
  )
}

export default function Hero() {
  const [saving, setSaving] = useState(false)
  const { state, equipBest, upgrade } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank, next, pct } = rankFor(power)
  const pet = p.pets.find((x) => x.id === p.activePetId)
  const bonus = petBonus(p)

  const [filter, setFilter] = useState('all')
  const [openItem, setOpenItem] = useState(null)
  const [openCodex, setOpenCodex] = useState(null)
  const [openPet, setOpenPet] = useState(null)

  const worn = useMemo(() => {
    const out = {}
    for (const [slot, id] of Object.entries(p.equipped)) {
      const item = p.inventory.find((i) => i.id === id)
      if (item) out[slot] = item
    }
    return out
  }, [p.equipped, p.inventory])

  const byRarity = (a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || itemScore(b) - itemScore(a)
  const gear = useMemo(() => [...p.inventory].sort(byRarity), [p.inventory])
  // Split rather than mixed. A glow says which is which; two headings say it
  // before you have to look.
  const arms = useMemo(() => gear.filter(isWeapon), [gear])
  const armour = useMemo(() => gear.filter((i) => !isWeapon(i)), [gear])
  const pets = useMemo(
    () => [...p.pets].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || b.level - a.level),
    [p.pets],
  )

  const showGear = filter === 'all'
  const showPets = filter === 'all' || filter === 'pets'

  return (
    <div className="p-3 space-y-3">
      {/* -------------------------------------------------- the character */}
      <Panel accent={cls.color} className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-pixel text-[10px]">{p.name}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Chip color={cls.color}>{cls.name}</Chip>
              <Chip color={rank.color}>{rank.name}</Chip>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-pixel text-[18px] text-neon">{p.level}</div>
            <div className="font-pixel text-[6px] text-ink-faint mt-1">LEVEL</div>
          </div>
        </div>

        {/* Gear is drawn onto the body, and the pet stands beside them. The
            character is the point of this screen, so it gets the room: at 168
            the helm, the pauldrons and the gauntlets ran together into one
            shape and you could not tell which piece was which. */}
        <div className="flex items-end justify-center gap-3 mt-3">
          <HeroView av={p.avatar} equipped={worn} height={250} />
          {pet && (
            <button onClick={() => setOpenPet(pet)} className="text-center shrink-0 active:brightness-125">
              <PetView refId={pet.ref} level={pet.level} size={64} float />
              <div className="font-pixel text-[7px] mt-1" style={{ color: RARITY[pet.rarity].color }}>
                {pet.name}
              </div>
              <div className="font-mono text-[10px] text-ink-faint">
                LV {pet.level} · {petStage(pet.level).name}
              </div>
              {bonus && <div className="font-mono text-[10px] text-lime mt-0.5">+{bonus.pct}% {bonus.stat}</div>}
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-pixel text-[8px] text-ink-faint">POWER</span>
            <span className="font-pixel text-[12px]" style={{ color: rank.color }}>
              {fmtFull(power)}
            </span>
          </div>
          <Bar pct={pct} color={rank.color} height={7} />
          <div className="font-mono text-[10px] text-ink-faint mt-1.5 text-right">
            {next ? `${fmt(next.min - power)} to ${next.name}` : 'MAX RANK'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-3">
          <Btn size="sm" variant="ghost" onClick={equipBest}>
            <Icon name="swap" size={10} color="currentColor" /> EQUIP BEST
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setSaving(true)}>
            <Icon name="link" size={10} color="currentColor" /> MY CHARACTER
          </Btn>
        </div>
      </Panel>

      {saving && <SaveSheet onClose={() => setSaving(false)} />}

      {/* ---------------------------------------------------------- filter */}
      <div className="grid grid-cols-5 border border-line bg-panel">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="font-pixel text-[7px] py-2.5 min-h-[44px] border-r border-line last:border-0 transition-colors active:brightness-125"
            style={{
              color: filter === f.id ? 'var(--color-on-accent)' : 'var(--color-ink-faint)',
              background: filter === f.id ? 'var(--color-neon)' : 'transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------- tiles */}
      <Panel className="p-3">
        {filter === 'upgrade' && (
          <Bench items={p.inventory} cores={p.cores} worn={worn} onUpgrade={upgrade} onOpen={setOpenItem} />
        )}
        {filter === 'armoury' && <Collection kinds={ARMOUR_KINDS} owned={p.inventory} onPick={setOpenCodex} />}
        {filter === 'weapons' && <Collection kinds={WEAPON_KINDS} owned={p.inventory} onPick={setOpenCodex} weapons />}

        {showGear && (
          <>
            {[
              ['WEAPONS', arms, WEAPON_INK],
              ['ARMOUR', armour, 'var(--color-ink-faint)'],
            ].map(([heading, list, tone], section) =>
              list.length ? (
                <div key={heading} className={section ? 'mt-4' : ''}>
                  <div className="font-pixel text-[7px] mb-2.5" style={{ color: tone }}>
                    {heading} · {list.length}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {list.map((i) => (
                      <Tile
                        key={i.id}
                        rarity={i.rarity}
                        level={i.level}
                        weapon={isWeapon(i)}
                        equipped={p.equipped[i.slot] === i.id}
                        label={`${i.name}, ${RARITY[i.rarity].label}, level ${i.level}`}
                        onClick={() => setOpenItem(i)}
                      >
                        <GearIcon slot={i.slot} kind={i.kind} set={i.set} size={30} />
                      </Tile>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </>
        )}

        {showPets && (
          <>
            <div className={`font-pixel text-[7px] text-ink-faint mb-2.5 ${showGear ? 'mt-4' : ''}`}>
              PETS · {pets.length}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {pets.map((x) => (
                <Tile
                  key={x.id}
                  rarity={x.rarity}
                  level={x.level}
                  equipped={x.id === p.activePetId}
                  label={`${x.name}, ${RARITY[x.rarity].label}, level ${x.level}`}
                  onClick={() => setOpenPet(x)}
                >
                  <PetView refId={x.ref} level={x.level} size={34} />
                </Tile>
              ))}
            </div>
          </>
        )}

        {(filter === 'all' || filter === 'pets') && !gear.length && !pets.length && (
          <div className="text-[11px] text-ink-faint text-center py-6">Open a chest to start collecting.</div>
        )}
      </Panel>

      {openItem && <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />}
      {openCodex && <CodexSheet piece={openCodex} onClose={() => setOpenCodex(null)} />}
      {openPet && <PetSheet pet={openPet} onClose={() => setOpenPet(null)} />}
    </div>
  )
}
