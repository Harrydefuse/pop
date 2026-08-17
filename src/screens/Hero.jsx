import { useState } from 'react'
import { Bar, Btn, Chip, Panel, RarityFrame, RarityTag, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { GearIcon, PetView, StoneIcon } from '../components/Sprites'
import { useGame } from '../game/useGame'
import { EQUIP_SLOTS, RARITY, RARITY_ORDER, STATS, upgradeCost } from '../game/config'
import { ACHIEVEMENTS, GAME_ACCOUNTS, HEALTH_PROVIDERS, PET_CATALOG } from '../game/data'
import {
  classById,
  fmt,
  fmtFull,
  gearBonuses,
  petBonus,
  petStage,
  petXpToNext,
  powerScore,
  rankFor,
  statProgress,
  stoneProgress,
} from '../game/engine'

const VIEWS = [
  ['sheet', 'SHEET'],
  ['gear', 'GEAR'],
  ['pets', 'PETS'],
  ['stones', 'STONES'],
  ['links', 'LINKS'],
]

/* -------------------------------------------------------------------- SHEET */

function Sheet() {
  const { state } = useGame()
  const p = state.player
  const cls = classById(p.classId)
  const gear = gearBonuses(p)
  const pet = petBonus(p)
  const power = powerScore(p)
  const { rank, next, pct } = rankFor(power)

  return (
    <div className="space-y-3.5">
      <Panel accent={cls.color} className="p-3.5">
        <div className="flex items-center gap-3">
          <Avatar av={p.avatar} size={54} ring={cls.color} />
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[11px] truncate">{p.name}</div>
            <div className="text-[11px] text-ink-dim mt-1">@{p.handle}</div>
            <div className="flex gap-1.5 mt-2">
              <Chip color={cls.color}>{cls.name}</Chip>
              <Chip color={rank.color}>{rank.name}</Chip>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-pixel text-[16px] text-neon">{p.level}</div>
            <div className="font-pixel text-[6px] text-ink-faint mt-1">LEVEL</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-line">
          <div className="text-[11px] text-ink-dim">{cls.tagline}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <Icon name="spark" size={10} color={cls.color} />
            <span className="text-[11px]" style={{ color: cls.color }}>
              {cls.passive.label}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <Bar pct={pct} color={rank.color} height={7} />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[10px] text-ink-faint">{fmtFull(power)} PWR</span>
            <span className="font-mono text-[10px] text-ink-faint">{next ? `${next.name} at ${fmt(next.min)}` : 'MAX'}</span>
          </div>
        </div>
      </Panel>

      <div>
        <SectionTitle right={pet && <span className="font-mono text-[10px] text-lime">pet +{pet.pct}% {pet.stat}</span>}>
          STATS
        </SectionTitle>
        <Panel className="p-3.5 space-y-3.5">
          {STATS.map((s) => {
            const prog = statProgress(p.stats[s.key])
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[9px]" style={{ color: s.color }}>
                      {s.key}
                    </span>
                    <span className="font-pixel text-[11px]">{prog.level}</span>
                    {gear[s.key] > 0 && <span className="font-mono text-[10px] text-lime">+{gear[s.key]}</span>}
                  </div>
                  <span className="font-mono text-[10px] text-ink-faint">
                    {fmt(prog.into)}/{fmt(prog.span)}
                  </span>
                </div>
                <Bar pct={prog.pct} color={s.color} height={7} />
                <div className="text-[10px] text-ink-faint mt-1.5">{s.blurb}</div>
              </div>
            )
          })}
        </Panel>
      </div>

      <div>
        <SectionTitle
          color="var(--color-gold)"
          right={<span className="font-mono text-[10px] text-ink-faint">{ACHIEVEMENTS.filter((a) => a.earned).length}/{ACHIEVEMENTS.length}</span>}
        >
          ACHIEVEMENTS
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => (
            <Panel
              key={a.id}
              corners={false}
              className="p-2.5 text-center"
              style={a.earned ? { borderColor: RARITY[a.rarity].color } : { opacity: 0.5 }}
            >
              <Icon
                name={a.earned ? 'trophy' : 'lock'}
                size={17}
                color={a.earned ? RARITY[a.rarity].color : 'var(--color-ink-faint)'}
                className="mx-auto"
              />
              <div
                className="font-pixel text-[6px] mt-2 leading-[1.6]"
                style={{ color: a.earned ? RARITY[a.rarity].color : 'var(--color-ink-faint)' }}
              >
                {a.name}
              </div>
              <div className="text-[9px] text-ink-faint mt-1.5 leading-snug">{a.earned ? a.at : a.desc}</div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- GEAR */

function Gear() {
  const { state, equip, unequip, upgrade } = useGame()
  const p = state.player
  const [selected, setSelected] = useState(null)
  const item = p.inventory.find((i) => i.id === selected)

  return (
    <div className="space-y-3.5">
      <Panel className="p-3.5">
        <SectionTitle>EQUIPPED</SectionTitle>
        <div className="grid grid-cols-5 gap-2">
          {EQUIP_SLOTS.map((slot) => {
            const eq = p.inventory.find((i) => i.id === p.equipped[slot.key])
            return (
              <button key={slot.key} onClick={() => eq && setSelected(eq.id)} className="text-center">
                {eq ? (
                  <RarityFrame rarity={eq.rarity} size={52} className="mx-auto">
                    <GearIcon refId={eq.ref} rarity={eq.rarity} size={30} />
                    <span
                      className="absolute -bottom-1 -right-1 font-pixel text-[6px] px-1 py-0.5 border bg-panel"
                      style={{ color: RARITY[eq.rarity].color, borderColor: RARITY[eq.rarity].color }}
                    >
                      {eq.level}
                    </span>
                  </RarityFrame>
                ) : (
                  <div className="w-[52px] h-[52px] border border-dashed border-line grid place-items-center mx-auto">
                    <Icon name="plus" size={12} color="var(--color-ink-faint)" />
                  </div>
                )}
                <div className="font-pixel text-[6px] text-ink-faint mt-1.5">{slot.name.toUpperCase()}</div>
              </button>
            )
          })}
        </div>
      </Panel>

      <div>
        <SectionTitle
          color="var(--color-ink-dim)"
          right={
            <span className="flex items-center gap-1">
              <Icon name="core" size={10} color="var(--color-gold)" />
              <span className="font-mono text-[10px] text-gold">{fmtFull(p.cores)}</span>
            </span>
          }
        >
          INVENTORY
        </SectionTitle>
        <div className="space-y-2">
          {p.inventory.map((i) => {
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
                    {equipped ? 'UNEQUIP' : 'EQUIP'}
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
        </div>
      </div>

      {item && (
        <Panel className="p-3.5" accent={RARITY[item.rarity].color}>
          <div className="font-pixel text-[8px]" style={{ color: RARITY[item.rarity].color }}>
            {item.name.toUpperCase()} · LV {item.level}
          </div>
          <div className="text-[11px] text-ink-dim mt-2">
            Next upgrade costs {fmtFull(upgradeCost(item))} cores and adds 35% of its base stats. Rarity multiplies
            everything — a legendary at level 1 already beats a common at level 5.
          </div>
          <Btn size="sm" variant="ghost" className="mt-2.5" onClick={() => setSelected(null)}>
            CLOSE
          </Btn>
        </Panel>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------- PETS */

function Pets() {
  const { state, setPet } = useGame()
  const p = state.player
  const active = p.pets.find((x) => x.id === p.activePetId)

  return (
    <div className="space-y-3.5">
      {active && (
        <Panel accent={RARITY[active.rarity].color} className="p-3.5 text-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 70%, ${RARITY[active.rarity].color}, transparent 60%)` }}
          />
          <div className="relative">
            <PetView refId={active.ref} level={active.level} size={124} float className="mx-auto" />
            <div className="font-pixel text-[12px] mt-1" style={{ color: RARITY[active.rarity].color }}>
              {active.name}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <RarityTag rarity={active.rarity} />
              <Chip color="var(--color-ink-faint)">{petStage(active.level).name}</Chip>
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1.5">
                <span className="font-pixel text-[8px] text-ink-faint">LV {active.level}</span>
                <span className="font-mono text-[10px] text-ink-faint">
                  {fmt(active.xp)}/{fmt(petXpToNext(active.level))}
                </span>
              </div>
              <Bar pct={active.xp / petXpToNext(active.level)} color={RARITY[active.rarity].color} height={7} />
            </div>
            <div className="text-[11px] text-lime mt-2.5">
              +{petBonus(p).pct}% {active.stat} gains
            </div>
            <div className="text-[10px] text-ink-faint mt-1.5">
              Pets gain XP from your sessions and can never out-level you.
            </div>
          </div>
        </Panel>
      )}

      {/* evolution ladder, mirrors the collection art */}
      {active && (
        <Panel className="p-3.5">
          <SectionTitle color="var(--color-ink-dim)">EVOLUTION</SectionTitle>
          <div className="flex items-end justify-between gap-1">
            {[1, 25, 50, 75, 100].map((lv) => {
              const reached = active.level >= lv
              return (
                <div key={lv} className="text-center flex-1 min-w-0">
                  <div className="grid place-items-center h-14" style={{ opacity: reached ? 1 : 0.28 }}>
                    <PetView refId={active.ref} level={lv} size={46} />
                  </div>
                  <div
                    className="h-1 mt-1"
                    style={{ background: reached ? RARITY[active.rarity].color : 'var(--color-panel-2)' }}
                  />
                  <div
                    className="font-pixel text-[6px] mt-1.5"
                    style={{ color: reached ? RARITY[active.rarity].color : 'var(--color-ink-faint)' }}
                  >
                    LVL {lv}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">{p.pets.length}/{PET_CATALOG.length}</span>}>
          COLLECTION
        </SectionTitle>
        <Panel className="p-3.5">
          <div className="grid grid-cols-3 gap-2.5">
            {PET_CATALOG.map((base) => {
              const owned = p.pets.find((x) => x.ref === base.id)
              const isActive = owned && owned.id === p.activePetId
              return (
                <button
                  key={base.id}
                  onClick={() => owned && setPet(owned.id)}
                  disabled={!owned}
                  className="text-center"
                >
                  <RarityFrame
                    rarity={base.rarity}
                    size={72}
                    active={isActive}
                    className="mx-auto"
                    onClick={owned ? () => setPet(owned.id) : undefined}
                  >
                    {owned ? (
                      <PetView refId={base.id} level={owned.level} size={58} />
                    ) : (
                      <Icon name="lock" size={16} color="var(--color-ink-faint)" />
                    )}
                  </RarityFrame>
                  <div
                    className="font-pixel text-[7px] mt-1.5"
                    style={{ color: owned ? RARITY[base.rarity].color : 'var(--color-ink-faint)' }}
                  >
                    {base.name}
                  </div>
                  <div className="text-[9px] text-ink-faint mt-1">{owned ? `LV ${owned.level}` : 'LOCKED'}</div>
                </button>
              )
            })}
          </div>
        </Panel>
      </div>

      <Panel className="p-3.5">
        <SectionTitle color="var(--color-ink-dim)">DROP RATES</SectionTitle>
        <div className="space-y-2">
          {RARITY_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2.5">
              <StoneIcon color={RARITY[k].color} size={14} />
              <span className="font-pixel text-[7px] flex-1" style={{ color: RARITY[k].color }}>
                {RARITY[k].label}
              </span>
              <span className="font-mono text-[11px] text-ink-faint">{RARITY[k].weight}%</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-ink-faint mt-3 leading-snug">
          Rates are fixed and published. Sealed chests raise the floor rarity rather than the odds — patience, not luck.
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------- STONES */

function Stones() {
  const { state } = useGame()
  const stones = stoneProgress(state.player)
  const earned = stones.filter((s) => s.earned).length

  return (
    <div className="space-y-3.5">
      <Panel className="p-3.5 text-center" accent={earned === 6 ? 'var(--color-gold)' : undefined}>
        <div className="font-pixel text-[10px] text-neon">THE GAUNTLET</div>
        <div className="flex justify-center gap-2 mt-3.5">
          {stones.map((s) => (
            <StoneIcon key={s.key} color={s.color} size={30} dim={!s.earned} />
          ))}
        </div>
        <div className="font-mono text-[11px] text-ink-faint mt-3">{earned}/6 collected</div>
        <div className="text-[11px] text-ink-dim mt-2.5 leading-snug">
          Six milestones measured in months, not days. Nothing here is purchasable, giftable or grindable in a weekend.
          Complete all six and the Gauntlet unlocks a permanent animated frame plus the season&apos;s legendary.
        </div>
      </Panel>

      {stones.map((s) => (
        <Panel key={s.key} className="p-3" corners={false} style={s.earned ? { borderColor: s.color } : undefined}>
          <div className="flex items-center gap-3">
            <StoneIcon color={s.color} size={30} dim={!s.earned} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-pixel text-[9px]" style={{ color: s.earned ? s.color : 'var(--color-ink-dim)' }}>
                  {s.name}
                </span>
                {s.earned && <Icon name="check" size={10} color={s.color} />}
              </div>
              <div className="text-[11px] text-ink-faint mt-1.5">{s.reward}</div>
            </div>
          </div>
          <Bar pct={s.pct} color={s.color} height={6} className="mt-2.5" />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[10px] text-ink-dim">
              {fmtFull(Math.min(s.value, s.goal))} / {fmtFull(s.goal)}
            </span>
            <span className="font-mono text-[10px] text-ink-faint">{s.unit}</span>
          </div>
        </Panel>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------- LINKS */

function Links() {
  const { state, toggleHealth, toggleGame, reset, newDay } = useGame()
  const p = state.player

  return (
    <div className="space-y-3.5">
      <Panel className="p-3.5" accent={state.links.health.length ? 'var(--color-lime)' : 'var(--color-danger)'}>
        <SectionTitle color={state.links.health.length ? 'var(--color-lime)' : 'var(--color-danger)'}>
          HEALTH SOURCES
        </SectionTitle>
        <div className="text-[11px] text-ink-dim mb-3 leading-snug">
          Everything ranked reads from here. No screenshots, no honour system — if a provider did not record it, it does
          not score.
        </div>
        <div className="space-y-2">
          {HEALTH_PROVIDERS.map((h) => {
            const on = state.links.health.includes(h.id)
            return (
              <button
                key={h.id}
                onClick={() => toggleHealth(h.id)}
                className="w-full flex items-center gap-2.5 border p-2.5 text-left transition-colors"
                style={{ borderColor: on ? h.color : 'var(--color-line)' }}
              >
                <Icon name={on ? 'check' : 'link'} size={13} color={on ? h.color : 'var(--color-ink-faint)'} />
                <div className="min-w-0 flex-1">
                  <div className="font-pixel text-[8px]" style={{ color: on ? h.color : 'var(--color-ink-dim)' }}>
                    {h.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-ink-faint mt-1">{h.note}</div>
                </div>
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
        <div className="text-[11px] text-ink-dim mb-3 leading-snug">
          Linking a game account is what makes the balance meter honest — and it is the only way to earn the Mind stone.
        </div>
        <div className="space-y-2">
          {GAME_ACCOUNTS.map((g) => {
            const on = state.links.games.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggleGame(g.id)}
                className="w-full flex items-center gap-2.5 border p-2.5 text-left transition-colors"
                style={{ borderColor: on ? g.color : 'var(--color-line)' }}
              >
                <Icon name={on ? 'check' : 'link'} size={13} color={on ? g.color : 'var(--color-ink-faint)'} />
                <div className="min-w-0 flex-1">
                  <div className="font-pixel text-[8px]" style={{ color: on ? g.color : 'var(--color-ink-dim)' }}>
                    {g.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-ink-faint mt-1">{g.titles}</div>
                </div>
                <span className="font-pixel text-[6px]" style={{ color: on ? 'var(--color-lime)' : 'var(--color-ink-faint)' }}>
                  {on ? 'LINKED' : 'LINK'}
                </span>
              </button>
            )
          })}
        </div>
        {!!state.links.games.length && (
          <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-3">
            <div>
              <div className="font-pixel text-[7px] text-ink-faint">PLAYED THIS WEEK</div>
              <div className="font-pixel text-[12px] text-neon mt-1.5">{p.week.gamingHours} h</div>
            </div>
            <div>
              <div className="font-pixel text-[7px] text-ink-faint">BALANCED DAYS</div>
              <div className="font-pixel text-[12px] text-gold mt-1.5">{p.lifetime.balance}</div>
            </div>
          </div>
        )}
      </Panel>

      <Panel className="p-3.5">
        <SectionTitle color="var(--color-ink-faint)">SANDBOX</SectionTitle>
        <div className="text-[11px] text-ink-dim mb-3">
          This build runs entirely on your device. Nothing is uploaded.
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" className="flex-1" onClick={newDay}>
            SKIP TO TOMORROW
          </Btn>
          <Btn size="sm" variant="dim" className="flex-1" onClick={reset}>
            RESET SAVE
          </Btn>
        </div>
      </Panel>
    </div>
  )
}

/* --------------------------------------------------------------------- ROOT */

export default function Hero() {
  const [view, setView] = useState('sheet')
  return (
    <div className="p-3 space-y-3.5">
      <div className="grid grid-cols-5 border border-line bg-panel">
        {VIEWS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className="font-pixel text-[6px] py-2.5 border-r border-line last:border-0"
            style={{
              color: view === k ? '#12081f' : 'var(--color-ink-faint)',
              background: view === k ? 'var(--color-neon)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'sheet' && <Sheet />}
      {view === 'gear' && <Gear />}
      {view === 'pets' && <Pets />}
      {view === 'stones' && <Stones />}
      {view === 'links' && <Links />}
    </div>
  )
}
