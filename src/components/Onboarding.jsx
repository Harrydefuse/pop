import { useEffect, useRef, useState } from 'react'
import { Bar, Btn, Panel } from './ui'
import Icon from './Icon'
import { GameMark, HeroView, PetView } from './Sprites'
import PixelSprite from './PixelSprite'
import TitleRoom from './TitleRoom'
import { useGame } from '../game/useGame'
import { AVATAR_BODIES, AVATAR_HAIR, AVATAR_SKINS, TITLE_SWORD, TUNIC } from '../game/sprites'
import { CLASSES, GAMES, playsAim } from '../game/config'
import { TRACKED } from '../game/session'

// The title card's own furniture. It is deliberately not the app's button and
// text styles: this screen is the game's cover, and it is the one place that
// gets to look like a cover.
// Stained timber with a brass edge — the same material as the title plaque, so
// the furniture on this screen all comes from one set.
const BOARD = {
  // The flat colour is not decorative: it is what anything measuring contrast
  // against this board reads, since a gradient alone computes as transparent.
  backgroundColor: '#2a1810',
  backgroundImage: 'linear-gradient(180deg, #3d2718 0%, #2a1810 60%, #1e100a 100%)',
  boxShadow: '0 0 0 3px #140a06, 0 0 0 6px #a97c2e, 0 0 0 9px #140a06, 0 9px 0 rgba(10,18,32,0.3)',
}

/**
 * The ground this screen stands on.
 *
 * `app-bg` alone is the flat void the app uses behind its cards, and a screen
 * that is nothing but cards on void reads as a settings page. The wash is the
 * same radial the arena and the character stage use, in the app's own neon —
 * enough colour that signing up looks like the game rather than the form in
 * front of it.
 */
const WASH = {
  backgroundImage:
    'radial-gradient(120% 55% at 50% 0%, color-mix(in srgb, var(--color-neon) 12%, transparent), transparent 70%)',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'local',
}

const OUTLINE = (c) =>
  `2px 0 0 ${c}, -2px 0 0 ${c}, 0 2px 0 ${c}, 0 -2px 0 ${c}, 2px 2px 0 ${c}, -2px 2px 0 ${c}, 2px -2px 0 ${c}, -2px -2px 0 ${c}`

/** LVL / 100 on a timber plaque, with the blade laid through the middle. */
function TitleLogo() {
  return (
    <div className="relative">
      <div
        className="px-7 py-3 text-center"
        style={{
          backgroundColor: '#6d1a14',
          backgroundImage: 'linear-gradient(180deg, #8a241b 0%, #6d1a14 55%, #55110d 100%)',
          boxShadow:
            '0 0 0 3px #240907, 0 0 0 6px #d99a3c, 0 0 0 9px #240907, 0 9px 0 rgba(10,18,32,0.35)',
        }}
      >
        <div
          className="font-pixel text-[40px] leading-[0.95]"
          style={{ color: '#ff7d5e', textShadow: `${OUTLINE('#2a0a08')}, 0 5px 0 #8f2a16` }}
        >
          LVL
        </div>

        {/* A zero-height rail between the two lines, so the blade lands in the
            gap at any type size instead of at half the plaque's height. */}
        <div className="relative h-0">
          <PixelSprite
            sprite={TITLE_SWORD}
            size={300}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        <div
          className="font-pixel text-[40px] leading-[0.95] mt-7"
          style={{ color: '#ff7d5e', textShadow: `${OUTLINE('#2a0a08')}, 0 5px 0 #8f2a16` }}
        >
          100
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <div
          className="font-display text-[12px] tracking-[0.3em] px-3 py-2"
          style={{ ...BOARD, color: '#ffe6b0' }}
        >
          A game you play by moving
        </div>
      </div>
    </div>
  )
}

/** A menu line: pixel type with a hard outline, and carets on the live one. */
function MenuItem({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full min-h-[48px] font-display text-[22px] flex items-center justify-center gap-3 active:translate-y-[2px]"
      style={{ color: '#ffffff', textShadow: `${OUTLINE('#10203a')}, 0 4px 0 rgba(8,16,30,0.4)` }}
    >
      <span
        aria-hidden="true"
        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 text-[14px]"
        style={{ color: '#ffd97a', textShadow: OUTLINE('#3a1f05') }}
      >
        &#9656;
      </span>
      {children}
      <span
        aria-hidden="true"
        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 text-[14px]"
        style={{ color: '#ffd97a', textShadow: OUTLINE('#3a1f05') }}
      >
        &#9666;
      </span>
    </button>
  )
}

/**
 * What you are here for, and what it makes you.
 *
 * Character creation used to be one long form — body, name, handle, skin, hair,
 * all on screen at once — and it asked nothing about the person filling it in.
 * Everyone came out an IRONSTRIDE because the class was hardcoded, so the one
 * choice with mechanical weight in the whole flow was made for you.
 *
 * These are the same four classes, asked as the question a person can actually
 * answer. Nobody knows whether they want to be a JUGGERNAUT. Everybody knows
 * whether they want to get stronger. The class, and the XP passive that comes
 * with it, is the consequence — shown on the card, so the choice is honest
 * rather than a personality quiz with a hidden result.
 */
/**
 * Nine answers, four training styles. Several goals land on the same style on
 * purpose: "get stronger" and "build muscle" are different things to want and
 * the same week of training, and the question is here to find out what you
 * want, not to make you translate it first.
 *
 * The notes describe the training, never the outcome. This app measures
 * sessions — it has no scale, no tape measure and no calorie count — so a card
 * that promised a number it cannot see would be lying on the way in.
 */
const GOALS = [
  { id: 'move', classId: 'adept', title: 'Just get moving again', note: 'Walks and stretching. Anything that counts as starting.' },
  { id: 'feel', classId: 'adept', title: 'Feel better day to day', note: 'Sleep, energy, less stiffness. Short and regular beats hard.' },
  { id: 'leaner', classId: 'ironstride', title: 'Get leaner', note: 'A bit of both, often enough that the week adds up.' },
  { id: 'further', classId: 'strider', title: 'Go further', note: 'Run, ride, walk — you want the distance to grow.' },
  { id: 'race', classId: 'strider', title: 'Train for a race', note: 'There is a date in the calendar and you intend to finish.' },
  { id: 'stronger', classId: 'juggernaut', title: 'Get stronger', note: 'Heavier on the bar than last month.' },
  { id: 'muscle', classId: 'juggernaut', title: 'Build muscle', note: 'Volume, and enough of it to show up.' },
  { id: 'sport', classId: 'ironstride', title: 'Keep up with my sport', note: 'Conditioning for the thing you already play.' },
  { id: 'game', classId: 'ironstride', title: 'I am here for the game', note: 'Fair enough. The training is how you play it.' },
]

const DAY_OPTIONS = [2, 3, 4, 5, 6]

/** A row of mutually exclusive picks, sized to be hit with a thumb. */
function Pick({ label, options, value, onChange }) {
  return (
    <>
      {label && <div className="font-display text-[12px] text-ink-faint mb-2">{label}</div>}
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = value === o.id
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className="font-display text-[13px] min-h-[44px] border transition-colors active:brightness-125"
              style={{
                color: on ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
                background: on ? 'var(--color-neon)' : 'transparent',
                borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </>
  )
}

/** A colour swatch big enough to hit, with the selection shown by a ring. */
function Swatch({ color, selected, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className="w-11 h-11 border-2 active:brightness-125"
      style={{
        background: color,
        borderColor: selected ? 'var(--color-ink)' : 'var(--color-line)',
        boxShadow: selected ? '0 0 0 2px var(--color-neon)' : undefined,
      }}
    />
  )
}

/**
 * One question, and what happens to it once it is answered.
 *
 * Answered questions do not disappear — they fold down to a line you can tap to
 * reopen. A wizard that swallows your answers makes people anxious about
 * pressing next; a transcript you can scroll back through does not.
 */
/**
 * The chat, and why it is one.
 *
 * The first version of this was five questions on a screen that folded shut as
 * you answered them. It looked tidy and it still read as a form, because the
 * app never said anything back — you filled a field, the field closed, another
 * opened. What makes a setup feel like a conversation is not the shape of the
 * boxes; it is that the thing asking acknowledges what you just said before it
 * asks the next thing.
 *
 * So every answer gets a reply. Pick six days and it says it will build the
 * week around six. Pick a goal and it tells you what that makes you, by name,
 * before moving on. The acknowledgement and the next question share one bubble,
 * which is what keeps it reading as one voice rather than a log of events.
 */

/** A glowing point that breathes while it waits and pulses while it thinks. */
function Orb({ size = 26, thinking }) {
  return (
    <span
      aria-hidden="true"
      className="orb shrink-0"
      data-thinking={thinking ? '' : undefined}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * The guide's line, on the app's own furniture.
 *
 * This screen used to be flat type on a flat background — clean, and nothing
 * like the app behind it, so signing up felt like filling in a form on a
 * different website before the game would let you in. It is a Panel with a
 * neon edge now, which is the same card every screen in the app is built out
 * of, so the first thing a person sees is the thing they are about to use.
 */
function Said({ ack, ask, mark }) {
  const [before, after] = mark && ask.includes(mark) ? ask.split(mark) : [ask, null]
  return (
    <div className="ask-in flex items-start gap-2.5">
      <Orb />
      <Panel accent="var(--color-neon)" className="min-w-0 flex-1 px-3.5 pt-3.5 pb-3">
        {ack && <p className="text-[15px] text-ink-dim leading-relaxed">{ack}</p>}
        <p className={`text-[19px] text-ink leading-snug font-display ${ack ? 'mt-3' : ''}`}>
          {before}
          {after !== null && <span className="text-neon">{mark}</span>}
          {after}
        </p>
      </Panel>
    </div>
  )
}

/** What you said, landing from your side of the screen. */
function Replied({ children, tone }) {
  return (
    <div className="ask-done flex justify-end">
      <span
        className="raise max-w-[85%] px-3.5 py-2.5 rounded-full text-[15px] text-ink text-right border border-line"
        style={{
          background: tone ? `color-mix(in srgb, ${tone} 18%, var(--color-panel))` : 'var(--color-panel)',
          borderColor: tone ? `color-mix(in srgb, ${tone} 45%, transparent)` : 'var(--color-line)',
        }}
      >
        {children}
      </span>
    </div>
  )
}

/** A thing you can say, stacked on your side under the question. */
function Choice({ children, onClick, tone, sub }) {
  return (
    <button
      onClick={onClick}
      className="ask-in raise block ml-auto max-w-[88%] text-right px-4 min-h-[48px] py-2.5 rounded-full border transition-colors active:brightness-125"
      style={{
        background: tone ? `color-mix(in srgb, ${tone} 14%, var(--color-panel))` : 'var(--color-panel)',
        borderColor: tone ? `color-mix(in srgb, ${tone} 50%, transparent)` : 'var(--color-line)',
      }}
    >
      <span className="block font-display text-[15px] text-ink">{children}</span>
      {sub && <span className="block text-[13px] text-ink-dim mt-0.5">{sub}</span>}
    </button>
  )
}

/** Multi-select: what this person is actually going to do, in their words. */
function Chips({ value, onToggle }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {TRACKED.filter((a) => !['aim', 'vod', 'sleep'].includes(a.id)).map((a) => {
        const on = value.includes(a.id)
        return (
          <button
            key={a.id}
            onClick={() => onToggle(a.id)}
            aria-pressed={on}
            className="ask-in raise flex items-center gap-2 min-h-[44px] px-3.5 rounded-full border transition-colors active:brightness-125"
            style={{
              color: on ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
              background: on ? 'var(--color-neon)' : 'var(--color-panel)',
              borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
            }}
          >
            <Icon name={a.icon} size={15} color="currentColor" />
            <span className="font-display text-[13px]">{a.name.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}

/** What they play. Same chips, no icons — twenty game names with twenty
 *  little glyphs beside them is a wall rather than a list. */
function GameChips({ value, onToggle }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {GAMES.map((g) => {
        const on = value.includes(g.id)
        return (
          <button
            key={g.id}
            onClick={() => onToggle(g.id)}
            aria-pressed={on}
            className="ask-in raise min-h-[44px] pl-2.5 pr-3.5 rounded-full border transition-colors active:brightness-125"
            style={{
              color: on ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
              background: on ? 'var(--color-neon)' : 'var(--color-panel)',
              borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
            }}
          >
            <span className="flex items-center gap-2">
              <GameMark id={g.id} size={18} />
              <span className="font-display text-[13px]">{g.name.toUpperCase()}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function Onboarding({ onContinue }) {
  const { state, onboard, testAccount } = useGame()
  const has = state.onboarded
  const [step, setStep] = useState(0)
  const [at, setAt] = useState(0)
  const [thinking, setThinking] = useState(false)
  // The transcript grows downward, so every new line scrolls itself into view.
  const endRef = useRef(null)
  useEffect(() => {
    if (step === 0 || !endRef.current) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    endRef.current.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'end' })
  }, [at, thinking, step])
  const [goalId, setGoalId] = useState(null)
  const [plays, setPlays] = useState(state.links?.games ?? [])
  const [doing, setDoing] = useState([])
  const [days, setDays] = useState(4)
  // The test account used to skip character creation entirely, which meant
  // testing the game as whoever happened to be in state. It goes through the
  // same step now and the maxed save lands on top of the character you built.
  const [testing, setTesting] = useState(false)

  // Seeded from the character already on this device, so coming back to change
  // one thing does not mean typing all of it again.
  const av = state.player.avatar
  const [name, setName] = useState(has ? state.player.name : '')
  // No longer asked for: a handle is derived from the name and changed later on
  // the profile, because five questions is already the limit of what anybody
  // will sit through before they have seen the game.
  const [handle] = useState(has ? state.player.handle : '')
  const [skin, setSkin] = useState(av.skin ?? AVATAR_SKINS[0])
  const [hair, setHair] = useState(av.hair ?? AVATAR_HAIR[0])
  const [body, setBody] = useState(av.body ?? 'male')

  const preview = { body, skin, hair, shirt: TUNIC }



  // The title card is its own screen, not a step in a form: full bleed art, the
  // mark, and a short menu. Every open of the app lands here first.
  if (step === 0) {
    return (
      <div className="absolute inset-0 z-50 overflow-hidden select-none">
        <TitleRoom className="absolute inset-0" />

        {/* A landmark, so everything on the title card belongs somewhere a
            screen reader can jump to rather than floating outside the page's
            structure. A labelled region rather than <main>, because this card
            sits over the app shell and that already has one. */}
        <section
          aria-label="LVL100 title screen"
          className="absolute inset-0 flex flex-col items-center px-6 pt-[9%] pb-6"
        >
          <TitleLogo />

          {/* The menu gets its own board rather than floating on the sky:
              pale type over a bright painting is a legibility problem no
              outline actually solves. */}
          <div className="w-full max-w-[250px] mt-[11%]" style={BOARD}>
            <div className="py-1">
              <MenuItem onClick={has ? onContinue : () => setStep(1)}>START</MenuItem>
              <div className="h-px mx-4" style={{ background: 'rgba(169,124,46,0.45)' }} />
              <MenuItem onClick={() => setStep(1)}>{has ? 'NEW CHARACTER' : 'HOW IT WORKS'}</MenuItem>
              <div className="h-px mx-4" style={{ background: 'rgba(169,124,46,0.45)' }} />
              {/* Testing only: it hands you the end of the game. This line and
                  the reducer case behind it come out before anyone else plays. */}
              <MenuItem
                onClick={() => {
                  setTesting(true)
                  setStep(1)
                }}
              >
                TEST ACCOUNT
              </MenuItem>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-end gap-1">
            {/* All five bob, on five different clocks. Only FROST floated
                before, which made the other four look switched off. */}
            <PetView refId="pup" stage={1} size={34} float delay="0s" />
            <PetView refId="turbo" stage={2} size={38} float delay="-1.2s" />
            <PetView refId="frost" stage={3} size={44} float delay="-0.45s" />
            <PetView refId="ember" stage={3} size={38} float delay="-2.1s" />
            <PetView refId="zeus" stage={4} size={34} float delay="-0.8s" />
          </div>

          {/* Only when there is somebody to carry on as. The plaque used to
              fall back to TEN BOSSES · THREE ACTS · ONE ENDING, which is a
              claim rather than information — nobody standing at a title screen
              needs a boss count, and promising an ending to someone who has not
              played a second of it is the app selling to itself. A title screen
              with nothing to say says nothing. */}
          {has && (
            <p className="font-display text-[12px] text-center leading-[1.9] mt-4 px-3 py-2" style={{ ...BOARD, color: '#ffe6b0' }}>
              CARRY ON AS {(state.player.name || 'ROOKIE').toUpperCase()}
            </p>
          )}
        </section>
      </div>
    )
  }

  // ------------------------------------------------------- the conversation
  const goal = GOALS.find((g) => g.id === goalId)
  const goalClass = goal && CLASSES.find((c) => c.id === goal.classId)
  const who = name.trim().toUpperCase()

  // Four questions. Each carries the question, the phrase in it worth
  // lighting, and what the guide says back once you have answered.
  //
  // Picking a face used to be one of them, and it was the odd one out: the
  // other four are things the app needs to know to work out what your week is
  // measured against, and that one is you playing dress-up. Sitting in the
  // middle of a questionnaire it got two swatches and a 140px preview, which
  // is a poor look at the character you are about to spend a season with. It
  // is its own screen now, after the questions are done.
  //
  // The replies say what the answer will be used for and stop. An earlier pass
  // had them making small talk — "good to meet you", "that will do nicely" —
  // which is a stranger being familiar with you, and it wears out by the second
  // question. Every line here either confirms something or explains what
  // happens next.
  const TURNS = [
    {
      ask: 'First — what should I call you?',
      mark: 'what should I call you',
      said: () => who,
    },
    {
      ack: 'Noted.',
      ask: 'What do you play?',
      mark: 'What do you play',
      said: () => GAMES.filter((g) => plays.includes(g.id)).map((g) => g.name).join(' · '),
    },
    {
      // The one reply that earns its place: it tells an FPS player that the
      // thing they already do every night is trainable here, which is the
      // whole pitch in one line.
      ack: playsAim(plays)
        ? 'Then aim training counts here — score and accuracy, kept like any other personal best.'
        : 'Saved.',
      ask: 'What do you want out of this?',
      mark: 'want out of this',
      said: () => goal?.title ?? '',
      tone: () => goalClass?.color,
    },
    {
      ack: goalClass ? `Got it — ${goalClass.passive.label}, on top of the usual.` : '',
      ask: 'What will you actually do?',
      mark: 'actually do',
      said: () => TRACKED.filter((a) => doing.includes(a.id)).map((a) => a.name).join(' · '),
    },
    {
      ack: 'Saved. Those go to the top of the list when you start a session.',
      ask: 'Last one. How many days a week?',
      mark: 'How many days a week',
      said: () => `${days} days a week`,
    },
  ]

  const done = at >= TURNS.length
  const endAck = `All set. Your week is measured against ${days} days, and everything you log counts either way.`

  const answer = (advance = true) => {
    setThinking(true)
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => {
      setThinking(false)
      if (advance) setAt((i) => i + 1)
    }, still ? 0 : 620)
  }

  // What you say, under the question, on your side of the screen.
  const options = () => {
    if (thinking || done) return null
    if (at === 0) {
      return (
        <div className="ask-in flex flex-col items-end gap-2">
          <input
            id="ob-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 14))}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && answer()}
            placeholder="Type your name"
            className="w-full min-h-[52px] bg-panel-2 rounded-full px-4 font-display text-[17px] text-ink text-right placeholder:text-ink-faint focus:outline-2 focus:outline-neon outline-none"
          />
          <Choice onClick={() => name.trim() && answer()} tone={name.trim() ? 'var(--color-neon)' : undefined}>
            {name.trim() ? `That's me` : 'Type it above'}
          </Choice>
        </div>
      )
    }
    if (at === 1) {
      return (
        <div className="ask-in flex flex-col items-end gap-2.5">
          <GameChips
            value={plays}
            onToggle={(id) => setPlays((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))}
          />
          <Choice onClick={() => answer()} tone={plays.length ? 'var(--color-neon)' : undefined}>
            {plays.length ? 'That is what I play' : 'I will skip this'}
          </Choice>
        </div>
      )
    }
    if (at === 2) {
      return (
        <div className="flex flex-col items-end gap-2">
          {GOALS.map((g) => {
            const cls = CLASSES.find((c) => c.id === g.classId)
            return (
              // The note, not the bonus. Three pairs of these share a bonus —
              // "get stronger" and "build muscle" are the same week of training
              // — so printing it on the card made the two look identical and hid
              // the thing that actually differs. The reply names the bonus a
              // second later, which is the right place for it.
              <Choice
                key={g.id}
                tone={cls.color}
                sub={g.note}
                onClick={() => {
                  setGoalId(g.id)
                  answer()
                }}
              >
                {g.title}
              </Choice>
            )
          })}
        </div>
      )
    }
    if (at === 3) {
      return (
        <div className="ask-in flex flex-col items-end gap-2.5">
          <Chips
            value={doing}
            onToggle={(id) => setDoing((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))}
          />
          <Choice onClick={() => doing.length && answer()} tone={doing.length ? 'var(--color-neon)' : undefined}>
            {doing.length ? 'That is the lot' : 'Pick at least one'}
          </Choice>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-end gap-2">
        {DAY_OPTIONS.map((d) => (
          <Choice
            key={d}
            tone="var(--color-neon)"
            onClick={() => {
              setDays(d)
              answer()
            }}
          >
            {d === 6 ? '6 or more days a week' : `${d} days a week`}
          </Choice>
        ))}
      </div>
    )
  }

  // ---------------------------------------------------------- the character
  //
  // Its own screen, after the questions, because it is not one of them. The
  // other four decide what your week is measured against; this one is the
  // first thing you will look at every time you open the app, and it was
  // getting a 140px preview squeezed into a chat bubble between "what do you
  // want out of this" and "what will you actually do".
  if (step === 2) {
    return (
      <div className="absolute inset-0 z-50 app-bg overflow-y-auto scroll-thin" style={WASH}>
        <div className="min-h-full flex flex-col p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              aria-label="Back"
              className="grid place-items-center w-11 h-11 rounded-full bg-panel border border-line raise active:brightness-125"
            >
              <Icon name="chevron" size={14} color="var(--color-ink-dim)" className="rotate-180" />
            </button>
            <span className="font-display text-[13px] text-ink-faint tracking-widest">{who || 'YOUR CHARACTER'}</span>
          </div>

          {testing && (
            <div className="font-display text-[12px] text-gold mt-3">
              TEST ACCOUNT · LEVEL 100 AND EVERY DROP, AS WHOEVER YOU BUILD
            </div>
          )}

          {/* A stage rather than a thumbnail: a floor, a wash of light and the
              character at the size they are actually drawn at. Changing a
              swatch should feel like changing a character, not editing a
              field. */}
          <div
            className="stack-in relative mt-4 flex items-end justify-center pt-5 pb-2 rounded-[var(--radius-lg)] bg-panel"
            style={{ backgroundImage: 'radial-gradient(120% 80% at 50% 100%, rgba(109,40,217,0.14), transparent 70%)' }}
          >
            <HeroView av={preview} height={200} />
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-8 right-8 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(109,40,217,0.5), transparent)' }}
            />
          </div>

          <div className="mt-5">
            <Pick label="BUILD" value={body} onChange={setBody} options={AVATAR_BODIES} />
          </div>

          <div className="label text-ink-faint mt-5 mb-2">SKIN</div>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_SKINS.map((c) => (
              <Swatch key={c} color={c} selected={skin === c} onClick={() => setSkin(c)} label={`Skin ${c}`} />
            ))}
          </div>

          <div className="label text-ink-faint mt-5 mb-2">HAIR</div>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_HAIR.map((c) => (
              <Swatch key={c} color={c} selected={hair === c} onClick={() => setHair(c)} label={`Hair ${c}`} />
            ))}
          </div>

          <p className="text-[14px] text-ink-faint mt-5 leading-snug">
            None of this is locked in — you can change the lot on the YOU screen whenever you like.
          </p>

          <div className="mt-auto pt-6">
            <Btn
              full
              size="lg"
              variant="go"
              onClick={() => {
                onboard({
                  name: who,
                  handle: handle.trim() || who.toLowerCase().replace(/[^a-z0-9]/g, '') || 'newchallenger',
                  classId: goal?.classId ?? 'ironstride',
                  avatar: { seed: 0, body, skin, hair, shirt: TUNIC },
                  games: plays,
                  health: [],
                  goalDays: days,
                  picks: doing,
                })
                if (testing) testAccount()
                onContinue?.()
              }}
            >
              {testing ? 'START MAXED' : `ENTER AS ${who}`}
            </Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 app-bg overflow-y-auto scroll-thin" style={WASH}>
      <div className="min-h-full flex flex-col p-4">
        {/* The same strip the app wears at the top of every screen: a bordered
            header and a neon bar underneath it. The bar is the app's own
            idiom — it is how XP, a boss and the week's goal all read — so the
            progress through five questions is shown the way progress is shown
            everywhere else rather than as "2 / 5". */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (at === 0 ? setStep(0) : setAt(at - 1))}
            aria-label="Back"
            className="grid place-items-center w-11 h-11 rounded-full bg-panel border border-line raise active:brightness-125"
          >
            <Icon name="chevron" size={14} color="var(--color-ink-dim)" className="rotate-180" />
          </button>
          <span className="font-display text-[13px] text-ink-faint tracking-widest">NEW CHARACTER</span>
          <span className="ml-auto label text-ink-faint">{Math.min(at + 1, TURNS.length)} / {TURNS.length}</span>
        </div>
        <Bar
          pct={Math.min(1, (done ? TURNS.length : at) / TURNS.length)}
          height={6}
          shine
          className="mt-3"
        />

        {testing && (
          <div className="font-display text-[12px] text-gold mt-3">
            TEST ACCOUNT · LEVEL 100 AND EVERY DROP, AS WHOEVER YOU BUILD
          </div>
        )}

        {/* The transcript. Everything said so far stays put and scrolls, the way
            a conversation does — nothing folds shut behind a CHANGE link. */}
        <div className="space-y-4 mt-5">
          {TURNS.slice(0, at + 1).map((turn, i) => (
            <div key={turn.ask} className="space-y-3">
              <Said ack={i === 0 ? undefined : turn.ack} ask={turn.ask} mark={turn.mark} />
              {i < at && <Replied tone={turn.tone?.()}>{turn.said()}</Replied>}
            </div>
          ))}

          {done && (
            <div className="space-y-3">
              <Said ask={endAck} />
              <Said ask="One thing left — what do they look like?" mark="what do they look like" />
            </div>
          )}

          {thinking && (
            <div className="flex items-center gap-2.5">
              <Orb thinking />
              <span className="dots" aria-label="Thinking">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {options()}
        </div>

        <div ref={endRef} />

        {done && (
          <div className="mt-auto pt-6">
            <Btn full size="lg" variant="go" onClick={() => setStep(2)}>
              BUILD {who}
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}
