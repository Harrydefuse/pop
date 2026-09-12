import { useState } from 'react'
import { Bar, Btn, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import LogSheet from '../components/LogSheet'
import { ChestArt } from '../components/Sprites'
import GiftReveal from '../components/GiftReveal'
import { useGame } from '../game/useGame'
import { DAILY_CHEST, DAILY_SLOTS } from '../game/config'
import { streakTier } from '../game/engine'

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
      title: 'Claim some ground',
      note: 'Track a walk or a run outdoors and the blocks you pass through turn green for good.',
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

/**
 * The daily chest.
 *
 * This was a card with five rarity chips on it, a name, a note, and a lot of
 * space between them all — a spreadsheet of odds around the one thing on TODAY
 * that is supposed to feel like a present. Nobody reads "4%" and feels
 * anything. So the odds are gone and the chest is the card: a big one, lit,
 * floating, throwing sparks, with its name under it and one button to open it.
 *
 * Locked and already-opened are the same shape with the light switched off,
 * because a reward you can see waiting is worth more than one you cannot.
 */
function DailyChest({ state, onOpen }) {
  const ready = state.unlocked && !state.openedToday
  const spent = state.openedToday

  return (
    <Panel className="p-4 text-center" accent={ready ? 'var(--color-gold)' : undefined}>
      <div className="chest-stage h-[92px]">
        {ready && <span className="chest-glow" aria-hidden="true" />}
        <ChestArt
          size={80}
          className={ready ? 'float-soft' : ''}
          style={ready ? undefined : { filter: 'grayscale(1) brightness(0.6)', opacity: 0.55 }}
        />
        {ready &&
          [
            { top: '6%', left: '18%', delay: '0s' },
            { top: '18%', right: '15%', delay: '0.6s' },
            { bottom: '22%', left: '11%', delay: '1.2s' },
            { bottom: '10%', right: '21%', delay: '1.8s' },
          ].map((at, i) => (
            <span
              key={i}
              className="chest-spark"
              aria-hidden="true"
              style={{ ...at, animationDelay: at.delay }}
            />
          ))}
      </div>

      <div
        className="font-display text-[24px] leading-none mt-2"
        style={{ color: ready ? 'var(--color-gold)' : 'var(--color-ink-faint)' }}
      >
        Daily chest
      </div>
      <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">
        {spent ? 'A fresh one tomorrow.' : ready ? DAILY_CHEST.note : 'Finish ACTIVE to unlock it.'}
      </div>

      <Btn full variant={ready ? 'gold' : 'dim'} disabled={!ready} className="mt-3" onClick={onOpen}>
        {spent ? 'Come back tomorrow' : ready ? 'OPEN IT' : 'Locked'}
      </Btn>
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

  const slotState = (id) => state.dailies.find((d) => d.id === id) ?? { minutes: 0, done: false }

  return (
    <div className="stack-in p-4 space-y-4">
      {state.gift?.pending && <GiftCard onOpen={() => setGift(true)} />}

      <FirstSteps state={state} onGo={onGo} />

      {/* -------------------------------------------- the day, in one panel
          Three cards became one. The streak, how much of today is left and the
          three things that make up "today" were a header card, a shields card
          and a list — all describing the same day, stacked as if they were
          different subjects. The week's challenge has gone entirely: it is on
          TRAIN now, where the rest of the week already lives, and a goal shown
          twice is a goal you stop reading. */}
      <Panel>
        <div className="flex items-center gap-3 px-3.5 py-3 border-b border-line">
          <span
            className="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-sm)]"
            style={{ background: 'color-mix(in srgb, var(--tone-orange) 14%, transparent)' }}
          >
            <Icon name="bolt" size={21} color="var(--tone-orange)" />
          </span>
          <div className="min-w-0">
            <div className="figure text-[24px] text-ink leading-none">{p.streak}</div>
            <div className="label text-ink-faint mt-1.5">day streak · ×{streak.mult.toFixed(2)} XP</div>
          </div>
          <div className="ml-auto text-right">
            <div
              className="figure text-[20px] leading-none"
              style={{ color: doneCount === 3 ? 'var(--color-lime)' : 'var(--color-ink)' }}
            >
              {doneCount}/3
            </div>
            <div className="label text-ink-faint mt-1.5">done today</div>
          </div>
        </div>

        {DAILY_SLOTS.map((slot, i) => (
          <SlotRow
            key={slot.id}
            slot={slot}
            state={slotState(slot.id)}
            onOpen={() => setOpenSlot(slot)}
            last={i === DAILY_SLOTS.length - 1}
          />
        ))}

        {/* The shields were real and invisible: they auto-spend on a missed day
            and the only place that ever said so was a coach panel most people
            never opened. A safety net nobody knows about protects nothing. */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-line">
          <Icon name="shield" size={14} color={p.shields > 0 ? 'var(--color-cyan)' : 'var(--color-ink-faint)'} />
          <span className="text-[13px] text-ink-faint leading-snug">
            {p.shields > 0
              ? `${p.shields} rest ${p.shields === 1 ? 'day' : 'days'} banked — miss one and the streak holds.`
              : 'No shields left. A missed day resets the streak.'}
          </span>
        </div>
      </Panel>

      {/* ------------------------------------------------------------ chest */}
      <DailyChest state={state.chest} onOpen={openChest} />

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
