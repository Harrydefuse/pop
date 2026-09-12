import { useEffect, useRef, useState } from 'react'
import { Btn } from './ui'
import Icon from './Icon'
import { HeroView, PetView } from './Sprites'
import PixelSprite from './PixelSprite'
import TitleRoom from './TitleRoom'
import { useGame } from '../game/useGame'
import { AVATAR_BODIES, AVATAR_HAIR, AVATAR_SKINS, TITLE_SWORD, TUNIC } from '../game/sprites'
import { CLASSES } from '../game/config'
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
const GOALS = [
  { id: 'move', classId: 'adept', title: 'Just get moving again', note: 'Walks, stretching, anything that counts as starting.' },
  { id: 'further', classId: 'strider', title: 'Go further', note: 'Run, ride, walk — you want the distance to grow.' },
  { id: 'stronger', classId: 'juggernaut', title: 'Get stronger', note: 'Barbells, dumbbells, the squat rack.' },
  { id: 'both', classId: 'ironstride', title: 'Both — lift and run', note: 'Leg day and a 10k in the same week.' },
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
// One hue per question, so the transcript builds into something with colour in
// it rather than five identical grey cards.
const HUES = [
  'var(--color-neon)',
  'var(--color-cyan)',
  'var(--tone-green)',
  'var(--color-gold)',
  'var(--tone-orange)',
]

function Ask({ n, of, hue, question, answer, open, onOpen, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open || !ref.current) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ref.current.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' })
  }, [open])

  if (!open) {
    return (
      <button
        ref={ref}
        onClick={onOpen}
        className="ask-done w-full flex items-center gap-3 text-left min-h-[44px] pl-3 pr-3 py-2.5 rounded-[var(--radius-sm)] active:brightness-125"
        style={{
          background: `color-mix(in srgb, ${hue} 10%, var(--color-panel))`,
          boxShadow: `inset 3px 0 0 ${hue}`,
        }}
      >
        <Icon name="check" size={14} color={hue} />
        <span className="min-w-0 flex-1">
          <span className="block label text-ink-faint">{question}</span>
          <span className="block text-[15px] text-ink truncate mt-0.5">{answer}</span>
        </span>
        <span className="label shrink-0" style={{ color: hue }}>
          CHANGE
        </span>
      </button>
    )
  }

  return (
    <div
      ref={ref}
      className="ask-in rounded-[var(--radius-sm)] p-3.5"
      style={{
        background: `color-mix(in srgb, ${hue} 7%, var(--color-panel))`,
        boxShadow: `inset 3px 0 0 ${hue}, var(--elev)`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="grid place-items-center w-6 h-6 rounded-full figure text-[13px] shrink-0"
          style={{ background: hue, color: 'var(--color-on-accent)' }}
        >
          {n}
        </span>
        <span className="label text-ink-faint">
          question {n} of {of}
        </span>
      </div>
      <h2 className="font-display text-[19px] text-ink mt-2 leading-snug">{question}</h2>
      <div className="mt-3.5">{children}</div>
    </div>
  )
}

/** A card that says what you want and what the game turns that into. */
function GoalCard({ goal, selected, onClick }) {
  const cls = CLASSES.find((c) => c.id === goal.classId)
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left p-3 border transition-colors active:brightness-125"
      style={{
        borderColor: selected ? cls.color : 'var(--color-line)',
        background: selected ? `color-mix(in srgb, ${cls.color} 12%, transparent)` : 'transparent',
      }}
    >
      <div className="flex items-center gap-2.5">
        <Icon name={cls.icon} size={18} color={selected ? cls.color : 'var(--color-ink-faint)'} />
        <span className="font-display text-[15px] text-ink">{goal.title}</span>
      </div>
      <div className="text-[14px] text-ink-dim mt-1.5 leading-snug">{goal.note}</div>
      <div className="text-[13px] mt-2 leading-snug" style={{ color: selected ? cls.color : 'var(--color-ink-faint)' }}>
        {cls.name} · {cls.passive.label}
      </div>
    </button>
  )
}

/** Multi-select: what this person is actually going to do, in their words. */
function Chips({ value, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRACKED.filter((a) => !['aim', 'vod', 'sleep'].includes(a.id)).map((a) => {
        const on = value.includes(a.id)
        return (
          <button
            key={a.id}
            onClick={() => onToggle(a.id)}
            aria-pressed={on}
            className="flex items-center gap-2 min-h-[44px] px-3 border transition-colors active:brightness-125"
            style={{
              color: on ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
              background: on ? 'var(--color-neon)' : 'transparent',
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

/** Every rarity gets a turn on the wall, best kept for the top rack. */
export default function Onboarding({ onContinue }) {
  const { state, onboard, testAccount } = useGame()
  const has = state.onboarded
  const [step, setStep] = useState(0)
  const [at, setAt] = useState(0)
  const [goalId, setGoalId] = useState(null)
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

        <div className="absolute inset-0 flex flex-col items-center px-6 pt-[9%] pb-6">
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
            <PetView refId="pup" level={1} size={34} />
            <PetView refId="turbo" level={30} size={38} />
            <PetView refId="frost" level={55} size={44} float />
            <PetView refId="ember" level={80} size={38} />
            <PetView refId="zeus" level={100} size={34} />
          </div>

          <p className="font-display text-[12px] text-center leading-[1.9] mt-4 px-3 py-2" style={{ ...BOARD, color: '#ffe6b0' }}>
            {has ? `CARRY ON AS ${(state.player.name || 'ROOKIE').toUpperCase()}` : 'TEN BOSSES · THREE ACTS · ONE ENDING'}
          </p>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------- the conversation
  // Five questions, one at a time, each opening the next. The old screen put
  // all of it up at once and asked nothing that mattered; this asks the two
  // things that change the game — what you want, and what you will actually do
  // — and it asks them one at a time so neither gets skimmed.
  const goal = GOALS.find((g) => g.id === goalId)
  const answered = [
    name.trim().length > 0,
    true,
    Boolean(goalId),
    doing.length > 0,
    true,
  ]
  const canFinish = answered[0] && answered[2] && answered[3]
  const next = () => setAt((i) => Math.min(4, i + 1))

  const QS = [
    {
      q: 'What should we call you?',
      answer: name.trim().toUpperCase() || '—',
      body: (
        <>
          <input
            id="ob-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 14))}
            onKeyDown={(e) => e.key === 'Enter' && answered[0] && next()}
            placeholder="Your name"
            className="w-full min-h-[52px] bg-panel border border-line p-3 font-display text-[18px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
          />
          <div className="text-[14px] text-ink-faint mt-2 leading-snug">
            This is the name on your character, your profile card and the ladder.
          </div>
          <Btn full className="mt-3.5" disabled={!answered[0]} onClick={next}>
            Continue
          </Btn>
        </>
      ),
    },
    {
      q: 'What do you look like in there?',
      answer: `${AVATAR_BODIES.find((b) => b.id === body)?.label ?? body}`,
      body: (
        <>
          <div className="flex justify-center">
            <div
              className="grid place-items-center px-4 py-2 border"
              style={{ borderColor: 'var(--color-neon)', background: 'rgba(0,0,0,0.25)' }}
            >
              <HeroView av={preview} height={150} />
            </div>
          </div>
          <div className="mt-4">
            <Pick label="BODY" value={body} onChange={setBody} options={AVATAR_BODIES} />
          </div>
          <div className="font-display text-[12px] text-ink-faint mt-4 mb-2">SKIN</div>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_SKINS.map((c) => (
              <Swatch key={c} color={c} selected={skin === c} onClick={() => setSkin(c)} label={`Skin ${c}`} />
            ))}
          </div>
          <div className="font-display text-[12px] text-ink-faint mt-4 mb-2">HAIR</div>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_HAIR.map((c) => (
              <Swatch key={c} color={c} selected={hair === c} onClick={() => setHair(c)} label={`Hair ${c}`} />
            ))}
          </div>
          <Btn full className="mt-4" onClick={next}>
            Continue
          </Btn>
        </>
      ),
    },
    {
      q: 'What do you want out of this?',
      answer: goal ? goal.title : '—',
      body: (
        <>
          <div className="space-y-2">
            {GOALS.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                selected={goalId === g.id}
                onClick={() => {
                  setGoalId(g.id)
                  setAt(3)
                }}
              />
            ))}
          </div>
          <div className="text-[14px] text-ink-faint mt-3 leading-snug">
            This picks your class and the XP bonus that comes with it. You are not locked in — everything counts for
            everyone, this just counts a little extra.
          </div>
        </>
      ),
    },
    {
      q: 'What will you actually do?',
      answer: doing.length
        ? TRACKED.filter((a) => doing.includes(a.id)).map((a) => a.name).join(' · ')
        : '—',
      body: (
        <>
          <Chips
            value={doing}
            onToggle={(id) => setDoing((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))}
          />
          <div className="text-[14px] text-ink-faint mt-3 leading-snug">
            Pick as many as you like. These go to the top of the list when you press start, so the thing you do most is
            under your thumb.
          </div>
          <Btn full className="mt-3.5" disabled={!answered[3]} onClick={next}>
            Continue
          </Btn>
        </>
      ),
    },
    {
      q: 'How many days a week?',
      answer: `${days} days`,
      body: (
        <>
          <div className="grid grid-cols-5 gap-2">
            {DAY_OPTIONS.map((d) => {
              const on = days === d
              return (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  aria-pressed={on}
                  className="figure text-[19px] min-h-[52px] border transition-colors active:brightness-125"
                  style={{
                    color: on ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
                    background: on ? 'var(--color-neon)' : 'transparent',
                    borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
                  }}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <div className="text-[14px] text-ink-faint mt-3 leading-snug">
            Your target, not a rule. It is what the week is measured against — and be honest, because a target you miss
            every week is worse than a smaller one you hit.
          </div>
        </>
      ),
    },
  ]

  return (
    <div className="absolute inset-0 z-50 bg-void overflow-y-auto scroll-thin">
      <div className="min-h-full flex flex-col p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => (at === 0 ? setStep(0) : setAt(at - 1))} className="label text-ink-faint min-h-[44px] px-1">
            ← BACK
          </button>
          <div className="flex-1 flex gap-1">
            {QS.map((_, i) => (
              <span
                key={i}
                className="flex-1 h-[4px] rounded-full transition-colors"
                style={{ background: i <= at ? HUES[i] : 'var(--color-line)' }}
              />
            ))}
          </div>
        </div>

        {testing && (
          <div className="font-display text-[12px] text-gold mt-3">
            TEST ACCOUNT · LEVEL 100 AND EVERY DROP, AS WHOEVER YOU BUILD
          </div>
        )}

        <div className="space-y-2.5 mt-4">
          {QS.slice(0, at + 1).map((item, i) => (
            <Ask
              key={item.q}
              n={i + 1}
              of={QS.length}
              hue={HUES[i]}
              question={item.q}
              answer={item.answer}
              open={i === at}
              onOpen={() => setAt(i)}
            >
              {item.body}
            </Ask>
          ))}
        </div>

        {at === QS.length - 1 && (
          <div className="mt-auto pt-6">
            <Btn
              full
              size="lg"
              variant="go"
              disabled={!canFinish}
              onClick={() => {
                onboard({
                  name: name.trim().toUpperCase(),
                  handle: handle.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'newchallenger',
                  classId: goal?.classId ?? 'ironstride',
                  avatar: { seed: 0, body, skin, hair, shirt: TUNIC },
                  games: [],
                  health: [],
                  goalDays: days,
                  picks: doing,
                })
                if (testing) testAccount()
                onContinue?.()
              }}
            >
              {testing ? 'START MAXED' : 'START PLAYING'}
            </Btn>
            {!canFinish && (
              <div className="text-[14px] text-ink-faint text-center mt-2">
                Still needs a name, a goal and at least one activity.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
