import { useState } from 'react'
import { Btn } from './ui'
import { HeroView, PetView } from './Sprites'
import PixelSprite from './PixelSprite'
import TitleScene from './TitleScene'
import { useGame } from '../game/useGame'
import { AVATAR_BODIES, AVATAR_HAIR, AVATAR_SKINS, TITLE_SWORD, TUNIC } from '../game/sprites'

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
          className="font-pixel text-[40px] leading-[0.95] tracking-tight"
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
          className="font-pixel text-[40px] leading-[0.95] tracking-tight mt-7"
          style={{ color: '#ff7d5e', textShadow: `${OUTLINE('#2a0a08')}, 0 5px 0 #8f2a16` }}
        >
          100
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <div
          className="font-pixel text-[7px] tracking-[0.3em] px-3 py-2"
          style={{ ...BOARD, color: '#ffe6b0' }}
        >
          A GAME YOU PLAY BY MOVING
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
      className="group w-full min-h-[48px] font-pixel text-[13px] flex items-center justify-center gap-3 active:translate-y-[2px]"
      style={{ color: '#ffffff', textShadow: `${OUTLINE('#10203a')}, 0 4px 0 rgba(8,16,30,0.4)` }}
    >
      <span
        aria-hidden="true"
        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 text-[10px]"
        style={{ color: '#ffd97a', textShadow: OUTLINE('#3a1f05') }}
      >
        &#9656;
      </span>
      {children}
      <span
        aria-hidden="true"
        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 text-[10px]"
        style={{ color: '#ffd97a', textShadow: OUTLINE('#3a1f05') }}
      >
        &#9666;
      </span>
    </button>
  )
}

// Picking a class, listing the games you play and connecting a health source
// are all out of the flow for now. The player still carries a class so nothing
// downstream has to special case it, the game catalogue is still in config, and
// links.health is still there to be filled — each goes back in as its own step
// when we know what we want it to do.
const DEFAULT_CLASS = 'ironstride'

/** A row of mutually exclusive picks, sized to be hit with a thumb. */
function Pick({ label, options, value, onChange }) {
  return (
    <>
      <div className="font-pixel text-[7px] text-ink-faint mt-4 mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = value === o.id
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className="font-pixel text-[8px] min-h-[44px] border transition-colors active:brightness-125"
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

export default function Onboarding({ onContinue }) {
  const { state, onboard } = useGame()
  const has = state.onboarded
  const [step, setStep] = useState(0)

  // Seeded from the character already on this device, so coming back to change
  // one thing does not mean typing all of it again.
  const av = state.player.avatar
  const [name, setName] = useState(has ? state.player.name : '')
  const [handle, setHandle] = useState(has ? state.player.handle : '')
  const [skin, setSkin] = useState(av.skin ?? AVATAR_SKINS[0])
  const [hair, setHair] = useState(av.hair ?? AVATAR_HAIR[0])
  const [body, setBody] = useState(av.body ?? 'male')

  const preview = { body, skin, hair, shirt: TUNIC }

  // The title card is its own screen, not a step in a form: full bleed art, the
  // mark, and a short menu. Every open of the app lands here first.
  if (step === 0) {
    return (
      <div className="absolute inset-0 z-50 overflow-hidden select-none">
        <TitleScene className="absolute inset-0" />

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

          <p className="font-pixel text-[7px] text-center leading-[1.9] mt-4 px-3 py-2" style={{ ...BOARD, color: '#ffe6b0' }}>
            {has ? `CARRY ON AS ${(state.player.name || 'ROOKIE').toUpperCase()}` : 'TEN BOSSES · THREE ACTS · ONE ENDING'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 bg-void arcade-bg overflow-y-auto scroll-thin">
      <div className="min-h-full flex flex-col p-4">
        {/* ------------------------------------------------------ 1. the look */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon">WHO ARE YOU?</div>

            <div className="flex justify-center my-5">
              <div
                className="grid place-items-center px-4 py-2 border"
                style={{ borderColor: 'var(--color-neon)', background: 'rgba(0,0,0,0.25)' }}
              >
                <HeroView av={preview} height={150} />
              </div>
            </div>

            <Pick label="BODY" value={body} onChange={setBody} options={AVATAR_BODIES} />

            <label className="font-pixel text-[7px] text-ink-faint mt-4" htmlFor="ob-name">
              NAME
            </label>
            <input
              id="ob-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 14))}
              placeholder="ROOKIE"
              className="w-full min-h-[44px] bg-panel border border-line p-3 mt-1.5 font-pixel text-[10px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
            />

            <label className="font-pixel text-[7px] text-ink-faint mt-3.5" htmlFor="ob-handle">
              HANDLE
            </label>
            <input
              id="ob-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/\s/g, '').slice(0, 18))}
              placeholder="newchallenger"
              className="w-full min-h-[44px] bg-panel border border-line p-3 mt-1.5 font-mono text-[12px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
            />

            <div className="font-pixel text-[7px] text-ink-faint mt-4 mb-2">SKIN</div>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_SKINS.map((c) => (
                <Swatch key={c} color={c} selected={skin === c} onClick={() => setSkin(c)} label={`Skin ${c}`} />
              ))}
            </div>

            <div className="font-pixel text-[7px] text-ink-faint mt-4 mb-2">HAIR COLOUR</div>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_HAIR.map((c) => (
                <Swatch key={c} color={c} selected={hair === c} onClick={() => setHair(c)} label={`Hair ${c}`} />
              ))}
            </div>

            <div className="flex gap-2 mt-auto pt-6">
              <Btn variant="ghost" onClick={() => setStep(0)}>
                BACK
              </Btn>
              <Btn
                className="flex-1"
                onClick={() => {
                  onboard({
                    name: (name.trim() || 'ROOKIE').toUpperCase(),
                    handle: handle.trim() || 'newchallenger',
                    classId: DEFAULT_CLASS,
                    avatar: { seed: 0, body, skin, hair, shirt: TUNIC },
                    games: [],
                    health: [],
                  })
                  onContinue?.()
                }}
              >
                START PLAYING
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
