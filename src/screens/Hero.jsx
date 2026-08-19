import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Panel, RarityFrame, RarityTag, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { GearIcon, HeroView, PetView } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { EQUIP_SLOTS, RARITY, RARITY_ORDER, STATS, upgradeCost } from '../game/config'
import { GAME_ACCOUNTS, HEALTH_PROVIDERS, PET_CATALOG } from '../game/data'
import {
  classById,
  fmt,
  fmtFull,
  gearBonuses,
  itemScore,
  petBonus,
  petStage,
  petXpToNext,
  powerScore,
  rankFor,
  statLevel,
} from '../game/engine'

/* ------------------------------------------------------------- paper doll --- */

function SlotButton({ slot, item, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 active:brightness-125" aria-label={`${slot.name} slot`}>
      {item ? (
        <RarityFrame rarity={item.rarity} size={54}>
          <GearIcon refId={item.ref} rarity={item.rarity} size={32} />
          <span
            className="absolute -bottom-1 -right-1 font-pixel text-[6px] px-1 py-0.5 border bg-panel"
            style={{ color: RARITY[item.rarity].color, borderColor: RARITY[item.rarity].color }}
          >
            {item.level}
          </span>
        </RarityFrame>
      ) : (
        <span className="grid place-items-center w-[54px] h-[54px] border border-dashed border-line">
          <Icon name="plus" size={12} color="var(--color-ink-faint)" />
        </span>
      )}
      <span className="font-pixel text-[6px] text-ink-faint">{slot.name.toUpperCase()}</span>
    </button>
  )
}

/**
 * The character, shown whole: gear on the left and right of the hero, pet at
 * their feet. This is the "what do I actually look like right now" view.
 */
function PaperDoll({ onSlot }) {
  const { state, equipBest } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const power = powerScore(p)
  const { rank, next, pct } = rankFor(power)
  const pet = p.pets.find((x) => x.id === p.activePetId)
  const item = (key) => p.inventory.find((i) => i.id === p.equipped[key])

  const left = EQUIP_SLOTS.slice(0, 3)
  const right = EQUIP_SLOTS.slice(3)

  return (
    <Panel accent={cls.color} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-pixel text-[11px]">{p.name}</div>
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

      <div className="flex items-center justify-between gap-2 mt-4">
        <div className="flex flex-col gap-3">
          {left.map((s) => (
            <SlotButton key={s.key} slot={s} item={item(s.key)} onClick={() => onSlot(s.key)} />
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 px-1">
          <div
            className="grid place-items-center px-2 py-1 border"
            style={{ borderColor: cls.color, background: 'rgba(0,0,0,0.25)' }}
          >
            <HeroView av={{ ...p.avatar, shirt: cls.color }} height={150} />
          </div>
          {pet ? (
            <div className="text-center">
              <PetView refId={pet.ref} level={pet.level} size={58} float />
              <div className="font-pixel text-[6px]" style={{ color: RARITY[pet.rarity].color }}>
                {pet.name}
              </div>
            </div>
          ) : (
            <div className="font-pixel text-[6px] text-ink-faint py-4">NO PET</div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {right.map((s) => (
            <SlotButton key={s.key} slot={s} item={item(s.key)} onClick={() => onSlot(s.key)} />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-pixel text-[8px] text-ink-faint">POWER</span>
          <span className="font-pixel text-[13px]" style={{ color: rank.color }}>
            {fmtFull(power)}
          </span>
        </div>
        <Bar pct={pct} color={rank.color} height={8} />
        <div className="font-mono text-[10px] text-ink-faint mt-1.5 text-right">
          {next ? `${fmt(next.min - power)} to ${next.name}` : 'MAX RANK'}
        </div>
      </div>

      <Btn full size="sm" variant="ghost" className="mt-3" onClick={equipBest}>
        <Icon name="swap" size={10} color="currentColor" /> EQUIP MY BEST
      </Btn>
    </Panel>
  )
}

/* ------------------------------------------------------------------ gear --- */

const SORTS = [
  { id: 'rarity', label: 'RARITY' },
  { id: 'slot', label: 'SLOT' },
  { id: 'power', label: 'POWER' },
]

function Gear({ filterSlot, setFilterSlot }) {
  const { state, equip, unequip, upgrade } = useGame()
  const p = state.player
  const [sort, setSort] = useState('rarity')

  const items = useMemo(() => {
    let list = [...p.inventory]
    if (filterSlot) list = list.filter((i) => i.slot === filterSlot)
    if (sort === 'rarity') {
      list.sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || b.level - a.level)
    } else if (sort === 'slot') {
      list.sort((a, b) => a.slot.localeCompare(b.slot) || RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))
    } else {
      list.sort((a, b) => itemScore(b) - itemScore(a))
    }
    return list
  }, [p.inventory, sort, filterSlot])

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <span className="font-pixel text-[7px] text-ink-faint shrink-0">SORT</span>
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className="font-pixel text-[7px] px-2.5 min-h-[44px] border transition-colors active:brightness-125"
            style={{
              color: sort === s.id ? '#0b0715' : 'var(--color-ink-faint)',
              background: sort === s.id ? 'var(--color-neon)' : 'transparent',
              borderColor: sort === s.id ? 'var(--color-neon)' : 'var(--color-line)',
            }}
          >
            {s.label}
          </button>
        ))}
        {filterSlot && (
          <button
            onClick={() => setFilterSlot(null)}
            className="ml-auto font-pixel text-[7px] px-2.5 min-h-[44px] border border-line-hot text-ink-dim active:brightness-125"
          >
            ALL SLOTS ✕
          </button>
        )}
      </div>

      {items.map((i) => {
        const equipped = p.equipped[i.slot] === i.id
        const cost = upgradeCost(i)
        const color = RARITY[i.rarity].color
        return (
          <Panel key={i.id} corners={false} className="p-2.5" style={equipped ? { borderColor: color } : undefined}>
            <div className="flex items-center gap-3">
              <RarityFrame rarity={i.rarity} size={46}>
                <GearIcon refId={i.ref} rarity={i.rarity} size={28} />
              </RarityFrame>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-pixel text-[8px]" style={{ color }}>
                    {i.name.toUpperCase()}
                  </span>
                  <span className="font-pixel text-[7px] text-ink-faint">LV {i.level}</span>
                  {equipped && <span className="font-pixel text-[6px] text-lime">ON</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <RarityTag rarity={i.rarity} />
                  {Object.entries(i.stats).map(([k, v]) => (
                    <span key={k} className="font-mono text-[10px] text-lime">
                      +{Math.round(v * RARITY[i.rarity].mult * (1 + (i.level - 1) * 0.35))} {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <Btn
                size="sm"
                variant={equipped ? 'dim' : 'ghost'}
                className="flex-1"
                onClick={() => (equipped ? unequip(i.slot) : equip(i.id))}
              >
                {equipped ? 'TAKE OFF' : 'TRY ON'}
              </Btn>
              <Btn
                size="sm"
                variant={p.cores >= cost ? 'gold' : 'dim'}
                className="flex-1"
                disabled={p.cores < cost}
                onClick={() => upgrade(i.id, cost)}
              >
                UPGRADE · {fmt(cost)}
              </Btn>
            </div>
          </Panel>
        )
      })}

      {!items.length && (
        <Panel className="p-6 text-center">
          <div className="text-[11px] text-ink-faint">Nothing for that slot yet. Chests drop gear.</div>
        </Panel>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ pets --- */

function Pets() {
  const { state, setPet } = useGame()
  const p = state.player
  const active = p.pets.find((x) => x.id === p.activePetId)
  const owned = [...p.pets].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))

  return (
    <div className="space-y-2.5">
      {active && (
        <Panel accent={RARITY[active.rarity].color} className="p-3.5 text-center">
          <PetView refId={active.ref} level={active.level} size={104} float className="mx-auto" />
          <div className="font-pixel text-[11px] mt-1" style={{ color: RARITY[active.rarity].color }}>
            {active.name}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <RarityTag rarity={active.rarity} />
            <Chip color="var(--color-ink-faint)">{petStage(active.level).name}</Chip>
          </div>
          <div className="mt-3">
            <Bar pct={active.xp / petXpToNext(active.level)} color={RARITY[active.rarity].color} height={7} />
            <div className="flex justify-between mt-1.5">
              <span className="font-pixel text-[8px] text-ink-faint">LV {active.level}</span>
              <span className="text-[11px] text-lime">+{petBonus(p).pct}% {active.stat}</span>
            </div>
          </div>
        </Panel>
      )}

      <Panel className="p-3.5">
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">{p.pets.length}/{PET_CATALOG.length}</span>}>
          COLLECTION
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {owned.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setPet(pet.id)}
              aria-pressed={pet.id === p.activePetId}
              className="text-center active:brightness-125"
            >
              <RarityFrame rarity={pet.rarity} size={72} active={pet.id === p.activePetId} className="mx-auto">
                <PetView refId={pet.ref} level={pet.level} size={58} />
              </RarityFrame>
              <div className="font-pixel text-[7px] mt-1.5" style={{ color: RARITY[pet.rarity].color }}>
                {pet.name}
              </div>
              <div className="text-[9px] text-ink-faint mt-1">LV {pet.level}</div>
            </button>
          ))}
          {PET_CATALOG.filter((b) => !p.pets.some((x) => x.ref === b.id)).map((b) => (
            <div key={b.id} className="text-center opacity-45">
              <RarityFrame rarity={b.rarity} size={72} className="mx-auto">
                <Icon name="lock" size={16} color="var(--color-ink-faint)" />
              </RarityFrame>
              <div className="font-pixel text-[7px] mt-1.5 text-ink-faint">{b.name}</div>
              <div className="text-[9px] text-ink-faint mt-1">LOCKED</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* --------------------------------------------------------------- profile --- */

function Profile() {
  const { state, toggleHealth, toggleGame, reset, newDay } = useGame()
  const p = state.player
  const gear = gearBonuses(p)

  return (
    <div className="space-y-2.5">
      <Panel className="p-3.5 space-y-3.5">
        <SectionTitle>STATS</SectionTitle>
        {STATS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px]" style={{ color: s.color }}>{s.key}</span>
                <span className="font-pixel text-[11px]">{statLevel(p.stats[s.key])}</span>
                {gear[s.key] > 0 && <span className="font-mono text-[10px] text-lime">+{gear[s.key]}</span>}
              </div>
              <span className="font-mono text-[10px] text-ink-faint">{s.blurb}</span>
            </div>
            <Bar pct={Math.min(1, (statLevel(p.stats[s.key]) % 10) / 10)} color={s.color} height={6} />
          </div>
        ))}
      </Panel>

      <Panel className="p-3.5">
        <SectionTitle color={state.links.health.length ? 'var(--color-lime)' : 'var(--color-danger)'}>
          HEALTH SOURCES
        </SectionTitle>
        <div className="text-[11px] text-ink-dim mb-3">
          Sessions arrive signed from here. Typed entries pay half and never rank.
        </div>
        <div className="space-y-1.5">
          {HEALTH_PROVIDERS.map((h) => {
            const on = state.links.health.includes(h.id)
            return (
              <button
                key={h.id}
                onClick={() => toggleHealth(h.id)}
                className="w-full flex items-center gap-2.5 border p-2.5 text-left min-h-[44px] active:brightness-125"
                style={{ borderColor: on ? h.color : 'var(--color-line)' }}
              >
                <Icon name={on ? 'check' : 'link'} size={12} color={on ? h.color : 'var(--color-ink-faint)'} />
                <span className="font-pixel text-[8px] flex-1" style={{ color: on ? h.color : 'var(--color-ink-dim)' }}>
                  {h.name.toUpperCase()}
                </span>
                <span className="font-pixel text-[6px]" style={{ color: on ? 'var(--color-lime)' : 'var(--color-ink-faint)' }}>
                  {on ? 'LINKED' : 'LINK'}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel className="p-3.5">
        <SectionTitle color="var(--color-neon)">GAME ACCOUNTS</SectionTitle>
        <div className="space-y-1.5">
          {GAME_ACCOUNTS.map((g) => {
            const on = state.links.games.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggleGame(g.id)}
                className="w-full flex items-center gap-2.5 border p-2.5 text-left min-h-[44px] active:brightness-125"
                style={{ borderColor: on ? g.color : 'var(--color-line)' }}
              >
                <Icon name={on ? 'check' : 'link'} size={12} color={on ? g.color : 'var(--color-ink-faint)'} />
                <span className="font-pixel text-[8px] flex-1" style={{ color: on ? g.color : 'var(--color-ink-dim)' }}>
                  {g.name.toUpperCase()}
                </span>
                <span className="font-pixel text-[6px]" style={{ color: on ? 'var(--color-lime)' : 'var(--color-ink-faint)' }}>
                  {on ? 'LINKED' : 'LINK'}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel className="p-3.5">
        <SectionTitle color="var(--color-ink-faint)">SANDBOX</SectionTitle>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" className="flex-1" onClick={newDay}>SKIP A DAY</Btn>
          <Btn size="sm" variant="dim" className="flex-1" onClick={reset}>RESET SAVE</Btn>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ root --- */

const VIEWS = [
  ['gear', 'GEAR'],
  ['pets', 'PETS'],
  ['profile', 'PROFILE'],
]

export default function Hero() {
  const [view, setView] = useState('gear')
  const [filterSlot, setFilterSlot] = useState(null)

  const openSlot = (key) => {
    setFilterSlot(key)
    setView('gear')
  }

  return (
    <div className="p-3 space-y-3.5">
      <PaperDoll onSlot={openSlot} />

      <div className="grid grid-cols-3 border border-line bg-panel">
        {VIEWS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className="font-pixel text-[8px] py-2.5 min-h-[44px] border-r border-line last:border-0 transition-colors active:brightness-125"
            style={{
              color: view === k ? '#0b0715' : 'var(--color-ink-faint)',
              background: view === k ? 'var(--color-neon)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'gear' && <Gear filterSlot={filterSlot} setFilterSlot={setFilterSlot} />}
      {view === 'pets' && <Pets />}
      {view === 'profile' && <Profile />}
    </div>
  )
}
