import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, RarityTag } from '../components/ui'
import Icon from '../components/Icon'
import { GearIcon, HeroView, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { EQUIP_SLOTS, RARITY, RARITY_ORDER, upgradeCost } from '../game/config'
import { classById, fmt, fmtFull, itemScore, petBonus, petStage, petXpToNext, powerScore, rankFor } from '../game/engine'
import { alpha } from '../game/color'

/* ------------------------------------------------------------------ tiles --- */

/**
 * One tile per owned thing: the icon on a ground tinted with its rarity, the
 * level in the corner, a marker if it is currently worn. Small enough that a
 * full collection fits on one screen instead of a long scrolling list.
 */
function Tile({ rarity, level, equipped, label, onClick, children }) {
  const color = RARITY[rarity].color
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative grid place-items-center aspect-square border-2 transition-transform active:scale-95"
      style={{
        borderColor: color,
        background: alpha(color, equipped ? 40 : 22),
        boxShadow: equipped ? `0 0 0 2px ${color}, 0 0 14px -4px ${color}` : undefined,
      }}
    >
      {children}
      <span
        className="absolute bottom-0 right-0 font-pixel text-[6px] px-1 py-0.5 leading-none"
        style={{ background: '#0b0715', color }}
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
  { id: 'all', label: 'ALL' },
  { id: 'gear', label: 'GEAR' },
  { id: 'pets', label: 'PETS' },
]

export default function Hero() {
  const { state, equipBest } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank, next, pct } = rankFor(power)
  const pet = p.pets.find((x) => x.id === p.activePetId)
  const bonus = petBonus(p)

  const [filter, setFilter] = useState('all')
  const [openItem, setOpenItem] = useState(null)
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
  const pets = useMemo(
    () => [...p.pets].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || b.level - a.level),
    [p.pets],
  )

  const showGear = filter !== 'pets'
  const showPets = filter !== 'gear'

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

        {/* Gear is drawn onto the body, and the pet stands beside them. */}
        <div className="flex items-end justify-center gap-4 mt-3">
          <HeroView av={p.avatar} equipped={worn} height={168} />
          {pet && (
            <button onClick={() => setOpenPet(pet)} className="text-center shrink-0 active:brightness-125">
              <PetView refId={pet.ref} level={pet.level} size={76} float />
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

        <Btn full size="sm" variant="ghost" className="mt-3" onClick={equipBest}>
          <Icon name="swap" size={10} color="currentColor" /> EQUIP MY BEST
        </Btn>
      </Panel>

      {/* ---------------------------------------------------------- filter */}
      <div className="grid grid-cols-3 border border-line bg-panel">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="font-pixel text-[8px] py-2.5 min-h-[44px] border-r border-line last:border-0 transition-colors active:brightness-125"
            style={{
              color: filter === f.id ? '#0b0715' : 'var(--color-ink-faint)',
              background: filter === f.id ? 'var(--color-neon)' : 'transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------- tiles */}
      <Panel className="p-3">
        {showGear && (
          <>
            <div className="font-pixel text-[7px] text-ink-faint mb-2.5">GEAR · {gear.length}</div>
            <div className="grid grid-cols-5 gap-2">
              {gear.map((i) => (
                <Tile
                  key={i.id}
                  rarity={i.rarity}
                  level={i.level}
                  equipped={p.equipped[i.slot] === i.id}
                  label={`${i.name}, ${RARITY[i.rarity].label}, level ${i.level}`}
                  onClick={() => setOpenItem(i)}
                >
                  <GearIcon slot={i.slot} kind={i.kind} set={i.set} size={30} />
                </Tile>
              ))}
            </div>
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

        {!gear.length && !pets.length && (
          <div className="text-[11px] text-ink-faint text-center py-6">Open a chest to start collecting.</div>
        )}
      </Panel>

      {openItem && <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />}
      {openPet && <PetSheet pet={openPet} onClose={() => setOpenPet(null)} />}
    </div>
  )
}
