import { useState } from 'react'
import { Bar, Btn, Modal, Panel } from '../components/ui'
import Icon from '../components/Icon'
import LogSheet from '../components/LogSheet'
import { BossArt } from '../components/Sprites'
import CampaignSheet from '../components/CampaignSheet'
import { useGame } from '../game/useGame'
import { DAILY_CHEST, DAILY_SLOTS, RARITY, RARITY_ORDER } from '../game/config'
import { actById } from '../game/campaign'
import { campaignState, streakTier } from '../game/engine'
import { alpha } from '../game/color'

/**
 * The through-line of the whole app. Today is where you play; this strip is the
 * standing reminder that none of it is bookkeeping — every session lands on the
 * thing between you and the next chapter.
 */
function Target({ onOpen }) {
  const { state } = useGame()
  const c = campaignState(state.player, state.campaign)
  const boss = c.current ?? c.locked
  if (!boss) return null
  const act = actById(boss.act)
  const live = Boolean(c.current)

  return (
    <button onClick={onOpen} className="w-full text-left active:brightness-125">
      <Panel corners={false} className="p-2.5" style={{ borderColor: alpha(act.color, 55) }}>
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 grid place-items-center shrink-0 border" style={{ borderColor: act.color }}>
            <BossArt
              sprite={boss.sprite}
              size={28}
              style={live ? undefined : { filter: 'grayscale(1) brightness(0.45)', opacity: 0.7 }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[7px] text-ink-faint">{live ? 'TODAY LANDS ON' : 'NEXT BOSS'}</div>
            <div className="font-pixel text-[9px] mt-1 truncate" style={{ color: act.color }}>
              {boss.name}
            </div>
            {live ? (
              <Bar pct={c.pct} color="var(--color-danger)" height={3} className="mt-1.5" />
            ) : (
              <div className="text-[10px] text-ink-faint mt-1">Opens at level {boss.level}</div>
            )}
          </div>
          <span className="flex items-center gap-1.5 shrink-0">
            {live && (
              <span className="font-mono text-[11px]" style={{ color: act.color }}>
                {Math.round(c.pct * 100)}%
              </span>
            )}
            <Icon name="chevron" size={11} color="var(--color-ink-faint)" />
          </span>
        </div>
      </Panel>
    </button>
  )
}


/**
 * A slot is a single small row: colour, name, state. Everything else — what
 * counts, the minimum, how to log it — lives behind a tap, so the screen stays
 * scannable when all you want to know is "what's left today".
 */
function SlotRow({ slot, state, onOpen }) {
  const done = state.done
  const pct = slot.minMinutes ? Math.min(1, state.minutes / slot.minMinutes) : done ? 1 : 0

  return (
    <button onClick={onOpen} className="w-full text-left active:brightness-125">
      <Panel corners={false} className="p-2.5" style={done ? { borderColor: slot.color } : undefined}>
        <div className="flex items-center gap-2.5">
          <div
            className="grid place-items-center w-9 h-9 shrink-0 border"
            style={{ borderColor: slot.color, background: done ? slot.color : 'transparent' }}
          >
            <Icon name={slot.icon} size={16} color={done ? '#0b0715' : slot.color} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[9px]" style={{ color: slot.color }}>
              {slot.name}
            </div>
            {slot.minMinutes > 0 && !done && (
              <div className="mt-1.5">
                <Bar pct={pct} color={slot.color} height={4} />
              </div>
            )}
          </div>

          <span className="font-pixel text-[8px] shrink-0" style={{ color: done ? slot.color : 'var(--color-ink-faint)' }}>
            {done ? 'DONE' : slot.minMinutes ? `${Math.round(state.minutes)}/${slot.minMinutes}m` : 'TODO'}
          </span>
        </div>
      </Panel>
    </button>
  )
}

/** The tap-through: what counts, where you are, and the two ways to fill it. */
function SlotSheet({ slot, state, onClose, onLog }) {
  const { state: game, sync } = useGame()
  const linked = game.links.health.length > 0
  const done = state.done

  return (
    <Modal open onClose={onClose} title={slot.name} accent={slot.color}>
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-12 h-12 shrink-0 border"
          style={{ borderColor: slot.color, background: done ? slot.color : 'transparent' }}
        >
          <Icon name={slot.icon} size={22} color={done ? '#0b0715' : slot.color} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-ink">{slot.rule}</div>
          <div className="text-[11px] text-ink-dim mt-1">{slot.detail}</div>
        </div>
      </div>

      {slot.minMinutes > 0 && (
        <div className="mt-3.5">
          <Bar pct={Math.min(1, state.minutes / slot.minMinutes)} color={slot.color} height={8} />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[11px]" style={{ color: done ? slot.color : 'var(--color-ink-dim)' }}>
              {Math.round(state.minutes)} / {slot.minMinutes} min
            </span>
            {state.loggedAs && <span className="font-mono text-[11px] text-ink-faint">{state.loggedAs}</span>}
          </div>
        </div>
      )}

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-pixel text-[7px] text-ink-faint">WHAT COUNTS</div>
        <div className="text-[11px] text-ink-dim mt-1.5">{slot.examples}</div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="font-pixel text-[8px]" style={{ color: slot.color }}>
          +{slot.xp} XP
        </span>
        {slot.unlocksChest && <span className="text-[11px] text-gold">Unlocks today&apos;s chest</span>}
      </div>

      <div className="flex gap-2 mt-3.5">
        <Btn full onClick={onLog} style={{ background: slot.color, borderColor: slot.color, color: '#0b0715' }}>
          LOG IT
        </Btn>
        <Btn
          variant={linked ? 'ghost' : 'dim'}
          disabled={!linked}
          onClick={() => {
            sync()
            onClose()
          }}
        >
          SYNC
        </Btn>
      </div>
      {!linked && <div className="text-[10px] text-ink-faint mt-2 text-center">Link a health app to sync automatically</div>}
    </Modal>
  )
}

export default function Home() {
  const { state, openChest } = useGame()
  const [openSlot, setOpenSlot] = useState(null)
  const [logging, setLogging] = useState(null)
  const [campaign, setCampaign] = useState(false)
  const p = state.player
  const streak = streakTier(p.streak)
  const doneCount = state.dailies.filter((d) => d.done).length
  const chestReady = state.chest.unlocked && !state.chest.openedToday

  const slotState = (id) => state.dailies.find((d) => d.id === id) ?? { minutes: 0, done: false }

  return (
    <div className="p-3 space-y-3">
      <Target onOpen={() => setCampaign(true)} />

      {/* ------------------------------------------------------ streak strip */}
      <Panel corners={false} className="p-2.5">
        <div className="flex items-center gap-2.5">
          <Icon name="flame" size={18} color="#fb923c" />
          <span className="font-pixel text-[13px] text-[#fb923c]">{p.streak}</span>
          <span className="font-pixel text-[7px] text-ink-faint">DAY STREAK</span>
          <span className="ml-auto font-mono text-[11px] text-lime">×{streak.mult.toFixed(2)}</span>
          <span
            className="font-pixel text-[10px]"
            style={{ color: doneCount === 3 ? 'var(--color-lime)' : 'var(--color-ink-faint)' }}
          >
            {doneCount}/3
          </span>
        </div>
      </Panel>

      {/* ------------------------------------------------------------ slots */}
      <div className="space-y-2">
        {DAILY_SLOTS.map((slot) => (
          <SlotRow key={slot.id} slot={slot} state={slotState(slot.id)} onOpen={() => setOpenSlot(slot)} />
        ))}
      </div>

      {/* ------------------------------------------------------------ chest */}
      <Panel className="p-3.5 text-center" accent={chestReady ? 'var(--color-gold)' : undefined}>
        <Icon
          name="chest"
          size={44}
          color={chestReady ? 'var(--color-gold)' : 'var(--color-ink-faint)'}
          className={`mx-auto ${chestReady ? 'float-soft' : ''}`}
        />
        <div
          className="font-pixel text-[10px] mt-2.5"
          style={{ color: chestReady ? 'var(--color-gold)' : 'var(--color-ink-faint)' }}
        >
          {state.chest.openedToday ? 'OPENED TODAY' : chestReady ? DAILY_CHEST.name : 'LOCKED'}
        </div>
        <div className="text-[11px] text-ink-dim mt-1.5">
          {state.chest.openedToday ? 'A fresh one tomorrow.' : chestReady ? DAILY_CHEST.note : 'Finish ACTIVE to unlock it.'}
        </div>

        {/* The odds are on the card, because a pull you can't read isn't exciting. */}
        <div className="flex justify-center gap-1.5 mt-3">
          {RARITY_ORDER.map((k) => (
            <span
              key={k}
              className="font-pixel text-[6px] px-1.5 py-1 border"
              style={{ color: RARITY[k].color, borderColor: RARITY[k].color, opacity: chestReady ? 1 : 0.4 }}
              title={RARITY[k].label}
            >
              {RARITY[k].weight}%
            </span>
          ))}
        </div>

        <Btn full variant={chestReady ? 'gold' : 'dim'} disabled={!chestReady} className="mt-3" onClick={openChest}>
          {state.chest.openedToday ? 'COME BACK TOMORROW' : 'OPEN CHEST'}
        </Btn>
      </Panel>

      {openSlot && (
        <SlotSheet
          slot={openSlot}
          state={slotState(openSlot.id)}
          onClose={() => setOpenSlot(null)}
          onLog={() => {
            setLogging(openSlot)
            setOpenSlot(null)
          }}
        />
      )}

      {campaign && <CampaignSheet onClose={() => setCampaign(false)} />}

      {logging && (
        <LogSheet
          title={logging.name}
          accepts={logging.accepts}
          accent={logging.color}
          minMinutes={logging.minMinutes}
          onClose={() => setLogging(null)}
        />
      )}
    </div>
  )
}
