import { useMemo, useState } from 'react'
import { Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import { ChestArt, GearIcon } from '../components/Sprites'
import PlansSheet from '../components/PlansSheet'
import { ItemSheet } from './Hero'
import { useGame } from '../game/useGame'
import { RARITY, SHOP_CHESTS, WEAPON_GLOW, isWeapon, upgradeCost } from '../game/config'
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

/** One chest on the shelf: what it costs, what it guarantees, and the pull. */
function ChestRow({ spec, cores, onBuy }) {
  const can = cores >= spec.cost
  const floor = RARITY[spec.floor]
  return (
    <div className="flex items-center gap-3 border border-line bg-panel-2 p-2.5 rounded-[var(--radius-sm)]">
      <div
        className="grid place-items-center w-14 h-14 shrink-0 rounded-[var(--radius-sm)]"
        style={{ background: alpha(floor.color, 14), boxShadow: `inset 0 0 0 1px ${alpha(floor.color, 45)}` }}
      >
        <ChestArt size={40} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] text-ink">{spec.name}</div>
        <div className="text-[14px] text-ink-dim mt-1 leading-snug">{spec.note}</div>
      </div>

      <button
        onClick={() => onBuy(spec.id)}
        disabled={!can}
        aria-label={`Buy ${spec.name} for ${spec.cost} cores`}
        className="font-display text-[13px] min-h-[44px] px-3 border shrink-0 rounded-[var(--radius-sm)] disabled:opacity-40 active:brightness-125 flex items-center gap-1.5"
        style={{
          color: can ? 'var(--color-on-accent)' : 'var(--color-ink-faint)',
          background: can ? 'var(--color-gold)' : 'transparent',
          borderColor: can ? 'var(--color-gold)' : 'var(--color-line)',
        }}
      >
        <Icon name="core" size={12} color="currentColor" />
        {fmt(spec.cost)}
      </button>
    </div>
  )
}

function Bench({ items, cores, worn, onUpgrade, onOpen }) {
  const rows = useMemo(
    () => [...items].map((i) => ({ item: i, cost: upgradeCost(i) })).sort((a, b) => a.cost - b.cost),
    [items],
  )
  const affordable = rows.filter((r) => r.cost <= cores).length

  if (!rows.length) {
    return <div className="text-[14px] text-ink-faint text-center py-6">Nothing to upgrade yet. Open a chest.</div>
  }

  return (
    <>
      <div className="text-[14px] text-ink-dim leading-snug mb-3">
        Every level on a piece is about a third more of what it already gives you.{' '}
        {affordable > 0 ? `You can afford ${affordable} of these right now.` : 'Nothing here is in reach yet.'}
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
                <div className="text-[15px] text-ink truncate">{item.name}</div>
                <div className="text-[14px] text-ink-faint mt-0.5">
                  LV {item.level} → {item.level + 1}
                  {equipped ? ' · worn' : ''}
                </div>
              </div>

              <button
                onClick={() => onUpgrade(item.id, cost)}
                disabled={!can}
                className="font-display text-[12px] min-h-[44px] px-2.5 border shrink-0 disabled:opacity-40 active:brightness-125"
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

export default function Shop() {
  const { state, buyChest, upgrade } = useGame()
  const p = state.player
  const worn = useMemo(() => wornGear(p), [p])
  const [openItem, setOpenItem] = useState(null)
  const [plans, setPlans] = useState(false)
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
              <ChestRow key={spec.id} spec={spec} cores={p.cores} onBuy={buyChest} />
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

      {openItem && <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />}
      {plans && <PlansSheet onClose={() => setPlans(false)} />}
    </>
  )
}
