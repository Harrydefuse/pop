import { useMemo, useState } from 'react'
import { Btn, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { ChestArt, GearIcon } from '../components/Sprites'
import PlansSheet from '../components/PlansSheet'
import { ItemSheet } from './Hero'
import { useGame } from '../game/useGame'
import { EQUIP_SLOTS, RARITY, SHOP_CHESTS, WEAPON_GLOW, isWeapon, upgradeCost } from '../game/config'
import { PLUS_PROMISE } from '../game/plans'
import { fmt, fmtFull, wornGear } from '../game/engine'
import { alpha } from '../game/color'

/**
 * Where cores go.
 *
 * They were a one-way street. You earned them from every session, every chest
 * and every boss, and the only thing to do with them was add a level to a piece
 * of gear — so once your kit was levelled you sat on a growing pile that meant
 * nothing. Worse, the bench where you spent them was the second tab of a filter
 * row on the fourth screen, which is not where you put the reason a currency
 * exists.
 *
 * Both halves live here now: buy a chest, or level what you already own. There
 * is no way to buy cores with money, and there is not going to be one — the
 * only exchange rate in this game is training.
 */

/** One chest on the shelf: its rung, what it guarantees, and what it costs. */
function ChestRow({ spec, cores, onPick }) {
  const can = cores >= spec.cost
  const tier = RARITY[spec.floor]
  return (
    <button
      onClick={() => onPick(spec)}
      aria-label={`${spec.name}, ${tier.label.toLowerCase()}, ${spec.cost} cores`}
      className="w-full text-left transition-transform active:scale-[0.99]"
    >
      <div
        className="flex items-center gap-3 border bg-panel-2 p-2.5 rounded-[var(--radius-sm)]"
        style={{ borderColor: alpha(tier.color, can ? 55 : 22) }}
      >
        <div
          className="grid place-items-center w-14 h-14 shrink-0 rounded-[var(--radius-sm)]"
          style={{ background: alpha(tier.color, 14), boxShadow: `inset 0 0 0 1px ${alpha(tier.color, 45)}` }}
        >
          {/* Greyed when it is out of reach, the same rule the bench uses: you
              should be able to tell what you can afford without reading a
              single number. */}
          <ChestArt
            kind={spec.art}
            size={42}
            style={can ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="label" style={{ color: tier.color }}>
            {tier.label}
          </div>
          <div className="font-display text-[15px] text-ink mt-0.5">{spec.name}</div>
          <div className="text-[14px] text-ink-dim mt-1 leading-snug">{spec.note}</div>
        </div>

        <span
          className="font-display text-[13px] min-h-[36px] px-2.5 border shrink-0 rounded-[var(--radius-sm)] flex items-center gap-1.5"
          style={{
            // Ink rather than on-accent: gold is the one accent that stays
            // bright in light mode, so what sits on it has to be dark in both
            // themes where everything else flips.
            color: can ? '#241a05' : 'var(--color-ink-faint)',
            background: can ? 'var(--color-gold)' : 'transparent',
            borderColor: can ? 'var(--color-gold)' : 'var(--color-line)',
          }}
        >
          <Icon name="core" size={12} color="currentColor" />
          {fmt(spec.cost)}
        </span>
      </div>
    </button>
  )
}

/**
 * Ask before spending.
 *
 * Nine thousand cores is a month of training, and it used to leave on one tap
 * of a small button with the price written on it. So the chest gets a moment
 * first: lit in its own rarity, floating, with the number it costs and the
 * number you are left with. Confirm and the loot rolls exactly as before.
 */
function BuySheet({ spec, cores, onBuy, onClose }) {
  const tier = RARITY[spec.floor]
  const can = cores >= spec.cost
  const left = cores - spec.cost

  return (
    <Modal open onClose={onClose} title="Open this?">
      <div className="text-center">
        <div className="chest-stage h-[136px]" style={{ '--glow': tier.glow ?? tier.color }}>
          <span className="chest-glow" aria-hidden="true" />
          <ChestArt
            kind={spec.art}
            size={104}
            className="float-soft relative"
            style={can ? undefined : { filter: 'grayscale(1)', opacity: 0.55 }}
          />
        </div>

        <div className="label mt-1" style={{ color: tier.color }}>
          {tier.label}
        </div>
        <div className="font-display text-[22px] text-ink mt-1">{spec.name}</div>
        <div className="text-[14px] text-ink-dim mt-2 leading-snug">{spec.note}</div>
      </div>

      <div className="mt-3.5 border border-line bg-panel-2 rounded-[var(--radius-sm)] divide-y divide-line">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[14px] text-ink-dim">It costs</span>
          <span className="flex items-center gap-1.5">
            <Icon name="core" size={13} color="var(--color-gold)" />
            <span className="figure text-[16px] text-gold">{fmtFull(spec.cost)}</span>
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[14px] text-ink-dim">{can ? 'You are left with' : 'You are short by'}</span>
          <span className="figure text-[16px]" style={{ color: can ? 'var(--color-ink)' : 'var(--color-danger)' }}>
            {fmtFull(Math.abs(left))}
          </span>
        </div>
      </div>

      {can ? (
        <Btn full className="mt-3.5" onClick={() => onBuy(spec.id)}>
          Open it
        </Btn>
      ) : (
        <div className="mt-3.5 text-[14px] text-ink-dim text-center leading-snug">
          Not yet. Cores come from training and nothing else — keep logging.
        </div>
      )}
      <Btn full variant="ghost" size="sm" className="mt-1.5" onClick={onClose}>
        {can ? 'Not yet' : 'Back'}
      </Btn>
    </Modal>
  )
}

/**
 * The bench, by category.
 *
 * It used to list every piece you own in one column sorted by price, which on a
 * full inventory is forty rows of near-identical tiles and no way to answer the
 * only question anyone brings here: what can I do to my sword. So the list is
 * filtered to one kind of thing at a time, and the kinds are the slots plus the
 * one distinction the slots do not make — a weapon and a shield share the
 * offhand, and nobody thinks of them as the same thing.
 */
const BENCH_KINDS = [
  { key: 'all', name: 'Everything' },
  { key: 'weapon', name: 'Weapons', art: 'sword' },
  { key: 'shield', name: 'Shields', art: 'shield' },
  ...EQUIP_SLOTS.filter((s) => s.key !== 'offhand').map((s) => ({ key: s.key, name: s.name, art: s.key })),
]

/** The category's own gear art, so the list is pictures of the things in it. */
function KindIcon({ kind, size = 20, dim }) {
  if (!kind.art) return <Icon name="bag" size={Math.round(size * 0.8)} color={dim ? 'var(--color-ink-faint)' : 'var(--arena)'} />
  return <GearIcon kind={kind.art} set="iron" size={size} style={dim ? { filter: 'grayscale(1)', opacity: 0.6 } : undefined} />
}

function inKind(item, key) {
  if (key === 'all') return true
  if (key === 'weapon') return isWeapon(item)
  if (key === 'shield') return item.slot === 'offhand' && !isWeapon(item)
  return item.slot === key
}

function Picker({ kind, counts, onPick }) {
  const [open, setOpen] = useState(false)
  const current = BENCH_KINDS.find((k) => k.key === kind) ?? BENCH_KINDS[0]

  return (
    <div className="mb-2.5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 border border-line bg-panel-2 rounded-[var(--radius-sm)] px-3 min-h-[48px] active:brightness-125"
      >
        <KindIcon kind={current} size={22} />
        <span className="font-display text-[15px] text-ink">{current.name}</span>
        <span className="text-[14px] text-ink-faint">{counts[current.key]}</span>
        <Icon
          name="chevron"
          size={12}
          color="var(--color-ink-faint)"
          className="ml-auto"
          style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 180ms' }}
        />
      </button>

      {/* Opens in place rather than floating over the list. A popover has to be
          positioned, and a positioned popover on a scrolling phone screen is a
          bug waiting for a long inventory. */}
      {open && (
        <div className="mt-1 border border-line rounded-[var(--radius-sm)] overflow-hidden">
          {BENCH_KINDS.map((k) => {
            const n = counts[k.key]
            const here = k.key === kind
            return (
              <button
                key={k.key}
                onClick={() => {
                  onPick(k.key)
                  setOpen(false)
                }}
                disabled={!n}
                className="w-full flex items-center gap-2.5 px-3 min-h-[46px] border-b border-line last:border-0 disabled:opacity-40 active:brightness-125"
                style={here ? { background: alpha('var(--arena)', 12) } : undefined}
              >
                <KindIcon kind={k} size={20} dim={!here} />
                <span className="text-[15px]" style={{ color: here ? 'var(--arena)' : 'var(--color-ink)' }}>
                  {k.name}
                </span>
                <span className="ml-auto text-[14px] text-ink-faint tabular-nums">{n}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Bench({ items, cores, worn, onUpgrade, onOpen }) {
  const [kind, setKind] = useState('all')

  const counts = useMemo(
    () => Object.fromEntries(BENCH_KINDS.map((k) => [k.key, items.filter((i) => inKind(i, k.key)).length])),
    [items],
  )

  const rows = useMemo(
    () =>
      items
        .filter((i) => inKind(i, kind))
        .map((i) => ({ item: i, cost: upgradeCost(i) }))
        .sort((a, b) => a.cost - b.cost),
    [items, kind],
  )

  const affordable = rows.filter((r) => r.cost <= cores).length

  if (!items.length) {
    return <div className="text-[14px] text-ink-faint text-center py-6">Nothing to upgrade yet. Open a chest.</div>
  }

  return (
    <>
      <div className="text-[14px] text-ink-dim leading-snug mb-2.5">
        Every level on a piece is about a third more of what it already gives you. Anything in reach is in colour;
        what you cannot afford yet is greyed out.
      </div>

      <Picker kind={kind} counts={counts} onPick={setKind} />

      {!rows.length ? (
        <div className="text-[14px] text-ink-faint text-center py-6">Nothing here yet. Open a chest.</div>
      ) : (
        <>
          <div className="text-[14px] text-ink-faint mb-2">
            {affordable > 0
              ? `${affordable} of these ${affordable === 1 ? 'is' : 'are'} in reach right now.`
              : 'Nothing here is in reach yet.'}
          </div>

          <div className="space-y-1.5">
            {rows.map(({ item, cost }) => {
              const can = cores >= cost
              const color = RARITY[item.rarity].color
              const equipped = worn[item.slot]?.id === item.id
              return (
                <div key={item.id} className="flex items-center gap-2.5 border border-line p-2">
                  {/* Colour is the whole signal: a piece you can pay for now is
                      lit in its rarity, a piece you cannot is the same tile
                      with the colour taken out of it. */}
                  <button
                    onClick={() => onOpen(item)}
                    aria-label={`Open ${item.name}`}
                    className="grid place-items-center w-11 h-11 shrink-0 border"
                    style={{
                      borderColor: can ? color : 'var(--color-line)',
                      background: can ? alpha(color, 18) : 'transparent',
                      boxShadow: can && isWeapon(item) ? `0 0 0 2px ${WEAPON_GLOW}` : undefined,
                    }}
                  >
                    <GearIcon
                      slot={item.slot}
                      kind={item.kind}
                      set={item.set}
                      size={26}
                      style={can ? undefined : { filter: 'grayscale(1)', opacity: 0.55 }}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] truncate" style={{ color: can ? 'var(--color-ink)' : 'var(--color-ink-dim)' }}>
                      {item.name}
                    </div>
                    <div className="text-[14px] text-ink-faint mt-0.5">
                      LV {item.level} → {item.level + 1}
                      {equipped ? ' · worn' : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => onUpgrade(item.id, cost)}
                    disabled={!can}
                    aria-label={`Upgrade ${item.name} for ${cost} cores`}
                    className="font-display text-[12px] min-h-[44px] px-2.5 border shrink-0 disabled:opacity-40 active:brightness-125"
                    style={{
                      color: can ? '#241a05' : 'var(--color-ink-faint)',
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
      )}
    </>
  )
}

export default function Shop() {
  const { state, buyChest, upgrade } = useGame()
  const p = state.player
  const worn = useMemo(() => wornGear(p), [p])
  const [openItem, setOpenItem] = useState(null)
  const [plans, setPlans] = useState(false)
  const [buying, setBuying] = useState(null)
  const cheapest = Math.min(...SHOP_CHESTS.map((c) => c.cost))

  return (
    <>
      <div className="stack-in p-3 space-y-3.5">
        <Panel className="p-4">
          <div className="flex items-center gap-2.5">
            <Icon name="core" size={26} color="var(--color-gold)" />
            <span className="figure text-[30px] text-gold leading-none">{fmtFull(p.cores)}</span>
            <span className="label text-ink-faint self-end mb-1">cores</span>
          </div>
          <div className="text-[14px] text-ink-dim mt-2.5 leading-relaxed">
            {p.cores >= cheapest
              ? 'Earned by training and nothing else — every session, every chest, every boss.'
              : `Earned by training and nothing else. The cheapest chest is ${fmtFull(cheapest)}; keep logging.`}
          </div>
        </Panel>

        <div>
          <SectionTitle right={<span className="text-[14px] text-ink-faint">rarity floor, not odds</span>}>
            Chests
          </SectionTitle>
          <div className="space-y-2">
            {SHOP_CHESTS.map((spec) => (
              <ChestRow key={spec.id} spec={spec} cores={p.cores} onPick={setBuying} />
            ))}
          </div>
        </div>

        {/* Kept at the bottom and kept quiet. It sells looks and the bill, not
            power, so it has no business interrupting the part of the screen
            where training is turned into gear. */}
        <button onClick={() => setPlans(true)} className="w-full text-left transition-transform active:scale-[0.99]">
          <Panel accent="var(--color-gold)" className="p-3.5">
            <div className="flex items-center gap-2.5">
              <Icon name="shield" size={18} color="var(--color-gold)" />
              <span className="font-display text-[15px] text-ink">LVL100 PLUS</span>
              <Icon name="chevron" size={12} color="var(--color-ink-faint)" className="ml-auto" />
            </div>
            <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
              Palettes, dyes and your whole history. {PLUS_PROMISE}
            </div>
          </Panel>
        </button>

        <div>
          <SectionTitle>The bench</SectionTitle>
          <Panel className="p-3">
            <Bench items={p.inventory} cores={p.cores} worn={worn} onUpgrade={upgrade} onOpen={setOpenItem} />
          </Panel>
        </div>
      </div>

      {buying && (
        <BuySheet
          spec={buying}
          cores={p.cores}
          onClose={() => setBuying(null)}
          onBuy={(id) => {
            setBuying(null)
            buyChest(id)
          }}
        />
      )}
      {openItem && <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />}
      {plans && <PlansSheet onClose={() => setPlans(false)} />}
    </>
  )
}
