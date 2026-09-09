import { useState } from 'react'
import { Bar, Btn, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import LogSheet from '../components/LogSheet'
import { ChestArt } from '../components/Sprites'
import GiftReveal from '../components/GiftReveal'
import InstallCard from '../components/InstallCard'
import { useGame } from '../game/useGame'
import { DAILY_CHEST, DAILY_SLOTS, RARITY, RARITY_ORDER } from '../game/config'
import { streakTier } from '../game/engine'
import { challengeLabel, challengeProgress } from '../game/challenge'

/**
 * The beta gift, sat at the very top until it is claimed. It is the first thing
 * a new player sees and it only ever appears once.
 */
function GiftCard({ onOpen }) {
  return (
    <button onClick={onOpen} className="motion-own gift-in w-full text-left active:brightness-125">
      <Panel className="p-3 relative overflow-hidden" accent="var(--color-gold)">
        <span
          className="shine-sweep absolute top-0 left-0 h-full w-14 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #ffe9a81f, transparent)' }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-3">
          <span className="gift-bob shrink-0">
            <ChestArt size={44} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[16px] text-ink">Beta founder gift</div>
            <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
              Free for everyone who signed up during the beta. One legendary, then it is gone.
            </div>
          </div>
          <Icon name="chevron" size={11} color="var(--color-gold)" />
        </div>
      </Panel>
    </button>
  )
}


/**
 * This week's challenge.
 *
 * The one thing on the home screen that is different from what was there last
 * week. Everything else — three slots, a chest, a streak — is identical every
 * single day, which is precisely the trap the app this one resembles fell into
 * before it closed.
 */
function WeeklyChallenge({ state }) {
  const w = challengeProgress(state)
  const paid = w.claimed
  return (
    <Panel className="p-4" accent={paid ? 'var(--color-lime)' : undefined}>
      <div className="flex items-start gap-3">
        <span
          className="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-sm)]"
          style={{ background: `color-mix(in srgb, ${paid ? 'var(--color-lime)' : 'var(--color-neon)'} 14%, transparent)` }}
        >
          <Icon name={paid ? 'check' : 'trophy'} size={19} color={paid ? 'var(--color-lime)' : 'var(--color-neon)'} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="label text-ink-faint">This week</div>
          <div className="font-display text-[17px] text-ink mt-1 leading-tight">{w.challenge.name}</div>
          <div className="text-[13px] text-ink-dim mt-1.5 leading-snug">
            {paid ? `Done — +${w.challenge.cores} cores. A new one lands on Monday.` : w.challenge.note}
          </div>
        </div>
      </div>
      <div className="mt-3.5">
        <Bar pct={w.pct} color={paid ? 'var(--color-lime)' : 'var(--color-neon)'} height={6} />
        <div className="flex items-baseline justify-between mt-2">
          <span className="label text-ink-faint">{challengeLabel(w)}</span>
          <span className="label" style={{ color: paid ? 'var(--color-lime)' : 'var(--color-gold)' }}>
            {paid ? 'Claimed' : `+${w.challenge.cores} cores`}
          </span>
        </div>
      </div>
    </Panel>
  )
}

/**
 * A slot is a single small row: colour, name, state. Everything else — what
 * counts, the minimum, how to log it — lives behind a tap, so the screen stays
 * scannable when all you want to know is "what's left today".
 */
function SlotRow({ slot, state, onOpen, last }) {
  const done = state.done
  const pct = slot.minMinutes ? Math.min(1, state.minutes / slot.minMinutes) : done ? 1 : 0

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left active:brightness-125 ${last ? '' : 'border-b border-line'}`}
    >
      <div className="px-3.5 py-3">
        <div className="flex items-center gap-3">
          {/* The slot's colour tints the tile and fills it when the slot is
              done. It no longer also paints the border and the name — three
              rows of that and the screen was a colour chart. */}
          <div
            className="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-sm)]"
            style={{ background: done ? slot.color : `color-mix(in srgb, ${slot.color} 14%, transparent)` }}
          >
            <Icon name={slot.icon} size={18} color={done ? 'var(--color-on-accent)' : slot.color} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-display text-[16px] text-ink">{slot.name}</div>
            {slot.minMinutes > 0 && !done && (
              <div className="mt-2">
                <Bar pct={pct} color={slot.color} height={5} />
              </div>
            )}
          </div>

          <span
            className="label shrink-0"
            style={{ color: done ? slot.color : 'var(--color-ink-faint)' }}
          >
            {done ? 'Done' : slot.minMinutes ? `${Math.round(state.minutes)}/${slot.minMinutes}m` : 'To do'}
          </span>
        </div>
      </div>
    </button>
  )
}

/** The tap-through: what counts, where you are, and the two ways to fill it. */
function SlotSheet({ slot, state, onClose, onLog }) {
  const { state: game, sync } = useGame()
  const linked = game.links.health.length > 0
  const done = state.done

  return (
    <Modal open onClose={onClose} title={slot.name}>
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-12 h-12 shrink-0 border"
          style={{ borderColor: slot.color, background: done ? slot.color : 'transparent' }}
        >
          <Icon name={slot.icon} size={22} color={done ? 'var(--color-on-accent)' : slot.color} />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] text-ink">{slot.rule}</div>
          <div className="text-[14px] text-ink-dim mt-1">{slot.detail}</div>
        </div>
      </div>

      {slot.minMinutes > 0 && (
        <div className="mt-3.5">
          <Bar pct={Math.min(1, state.minutes / slot.minMinutes)} color={slot.color} height={8} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[14px]" style={{ color: done ? slot.color : 'var(--color-ink-dim)' }}>
              {Math.round(state.minutes)} / {slot.minMinutes} min
            </span>
            {state.loggedAs && <span className="text-[14px] text-ink-faint">{state.loggedAs}</span>}
          </div>
        </div>
      )}

      <div className="mt-4 bg-panel-2 rounded-[var(--radius-sm)] p-3">
        <div className="label text-ink-faint">What counts</div>
        <div className="text-[14px] text-ink-dim mt-1.5">{slot.examples}</div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="font-display text-[13px]" style={{ color: slot.color }}>
          +{slot.xp} XP
        </span>
        {slot.unlocksChest && <span className="text-[14px] text-gold">Unlocks today&apos;s chest</span>}
      </div>

      <div className="flex gap-2 mt-3.5">
        <Btn full onClick={onLog} style={{ background: slot.color, borderColor: slot.color, color: 'var(--color-on-accent)' }}>
          Start a session
        </Btn>
        {/* Same reason as the log sheet: there is nowhere to link a provider
            while sync is out of the sign-up flow, so a disabled SYNC and an
            instruction to go and link one are both dead ends. */}
        {linked && (
          <Btn
            variant="ghost"
            onClick={() => {
              sync()
              onClose()
            }}
          >
            Sync
          </Btn>
        )}
      </div>
    </Modal>
  )
}

/**
 * What to do first.
 *
 * A new character lands here with a locked chest, three empty slots and a boss
 * that opens four levels away — everything on the screen is a thing you cannot
 * do yet. This names the one you can, and gets out of the way for good once
 * the loop is running.
 */
function FirstSteps({ state, onGo }) {
  const p = state.player
  const steps = [
    {
      id: 'train',
      done: state.log.length > 0,
      title: 'Track a session',
      note: 'Pick what you are doing and the app runs the clock. A minute counts.',
      cta: 'Go to Train',
      go: 'train',
    },
    {
      id: 'chest',
      done: p.inventory.length > 1,
      title: 'Open the daily chest',
      note: 'Twenty minutes of anything active unlocks it. Every chest is a drop.',
      cta: null,
    },
    {
      id: 'walk',
      done: (state.explored?.length ?? 0) > 0,
      title: 'Clear some of the map',
      note: 'Track a walk or a run outdoors and the ground you cover opens up.',
      cta: 'See the map',
      go: 'map',
    },
    {
      id: 'boss',
      done: p.level >= 5,
      title: 'Reach level 5',
      note: 'The Warden is waiting at Circular Quay. It does not move.',
      cta: null,
    },
  ]
  const doneCount = steps.filter((x) => x.done).length
  if (doneCount === steps.length) return null
  const next = steps.find((x) => !x.done)

  return (
    <Panel className="p-4">
      <SectionTitle right={<span className="label text-ink-faint">{doneCount} of {steps.length}</span>}>
        First steps
      </SectionTitle>
      <div className="space-y-1.5">
        {steps.map((x) => (
          <div key={x.id} className="flex items-start gap-2">
            <span className="mt-[3px] shrink-0">
              <Icon
                name={x.done ? 'check' : x.id === next.id ? 'spark' : 'lock'}
                size={14}
                color={x.done ? 'var(--color-lime)' : x.id === next.id ? 'var(--color-neon)' : 'var(--color-ink-faint)'}
              />
            </span>
            <div className="min-w-0">
              <div
                className="text-[15px] leading-snug"
                style={{
                  color: x.done ? 'var(--color-ink-faint)' : x.id === next.id ? 'var(--color-ink)' : 'var(--color-ink-dim)',
                  textDecoration: x.done ? 'line-through' : undefined,
                }}
              >
                {x.title}
              </div>
              {x.id === next.id && <div className="text-[14px] text-ink-dim mt-0.5 leading-snug">{x.note}</div>}
            </div>
          </div>
        ))}
      </div>
      {next.cta && (
        <Btn full size="sm" className="mt-4" onClick={() => onGo(next.go)}>
          {next.cta}
        </Btn>
      )}
    </Panel>
  )
}

export default function Home({ onGo }) {
  const { state, openChest } = useGame()
  const [openSlot, setOpenSlot] = useState(null)
  const [logging, setLogging] = useState(null)
  const [gift, setGift] = useState(false)
  const p = state.player
  const streak = streakTier(p.streak)
  const doneCount = state.dailies.filter((d) => d.done).length
  const chestReady = state.chest.unlocked && !state.chest.openedToday

  const slotState = (id) => state.dailies.find((d) => d.id === id) ?? { minutes: 0, done: false }

  return (
    <div className="stack-in p-4 space-y-4">
      {state.gift?.pending && <GiftCard onOpen={() => setGift(true)} />}

      <FirstSteps state={state} onGo={onGo} />

      <InstallCard />

      <WeeklyChallenge state={state} />


      {/* ------------------------------------------------------ streak strip */}
      <Panel className="px-3.5 py-3">
        <div className="flex items-center gap-3">
          <span
            className="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-sm)]"
            style={{ background: 'color-mix(in srgb, var(--tone-orange) 14%, transparent)' }}
          >
            <Icon name="flame" size={19} color="var(--tone-orange)" />
          </span>
          <div className="min-w-0">
            <div className="figure text-[24px] text-ink">{p.streak}</div>
            <div className="label text-ink-faint mt-1">Day streak</div>
          </div>
          <div className="ml-auto text-right">
            <div className="figure text-[18px]" style={{ color: doneCount === 3 ? 'var(--color-lime)' : 'var(--color-ink)' }}>
              {doneCount}/3
            </div>
            <div className="label text-ink-faint mt-1">×{streak.mult.toFixed(2)} XP</div>
          </div>
        </div>

        {/* The shields were real and invisible: they auto-spend on a missed day
            and the only place that ever said so was a coach panel most people
            never opened. A safety net nobody knows about protects nothing —
            the fear of losing the streak is what makes people skip a rest day
            they needed. */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
          <Icon
            name="shield"
            size={15}
            color={p.shields > 0 ? 'var(--color-cyan)' : 'var(--color-ink-faint)'}
          />
          <span className="text-[13px] text-ink-dim leading-snug">
            {p.shields > 0
              ? `${p.shields} rest ${p.shields === 1 ? 'day' : 'days'} banked. Miss one and a shield covers it — the streak holds.`
              : 'No shields left. A missed day resets the streak from here.'}
          </span>
        </div>
      </Panel>

      {/* ------------------------------------------------------------ slots */}
      <Panel>
        {DAILY_SLOTS.map((slot, i) => (
          <SlotRow
            key={slot.id}
            slot={slot}
            state={slotState(slot.id)}
            onOpen={() => setOpenSlot(slot)}
            last={i === DAILY_SLOTS.length - 1}
          />
        ))}
      </Panel>

      {/* ------------------------------------------------------------ chest */}
      <Panel className="p-3.5 text-center" accent={chestReady ? 'var(--color-gold)' : undefined}>
        <ChestArt
          size={52}
          className={`mx-auto ${chestReady ? 'float-soft' : ''}`}
          style={chestReady ? undefined : { filter: 'grayscale(1) brightness(0.55)', opacity: 0.7 }}
        />
        <div className="font-display text-[19px] mt-3 text-ink">
          {state.chest.openedToday ? 'Opened today' : chestReady ? DAILY_CHEST.name : 'Locked'}
        </div>
        <div className="text-[14px] text-ink-dim mt-1.5">
          {state.chest.openedToday ? 'A fresh one tomorrow.' : chestReady ? DAILY_CHEST.note : 'Finish ACTIVE to unlock it.'}
        </div>

        {/* The odds are on the card, because a pull you can't read isn't exciting. */}
        <div className="flex justify-center gap-1.5 mt-3">
          {RARITY_ORDER.map((k) => (
            <span
              key={k}
              // On the raised surface rather than on a wash of its own colour:
              // a tint pulls the ground towards the text, and the common slate
              // at 14% took its own chip down to 4:1.
              className="label px-2 py-1 rounded-full bg-panel-2"
              style={{ color: RARITY[k].color, opacity: chestReady ? 1 : 0.45 }}
              title={RARITY[k].label}
            >
              {RARITY[k].weight}%
            </span>
          ))}
        </div>

        <Btn full variant={chestReady ? 'gold' : 'dim'} disabled={!chestReady} className="mt-3" onClick={openChest}>
          {state.chest.openedToday ? 'Come back tomorrow' : 'Open chest'}
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

      {gift && <GiftReveal onClose={() => setGift(false)} />}


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
