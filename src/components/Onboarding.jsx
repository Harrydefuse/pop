import { useState } from 'react'
import { Btn } from './ui'
import { HeroView, PetView } from './Sprites'
import { useGame } from '../game/useGame'
import { AVATAR_BODIES, AVATAR_HAIR, AVATAR_SKINS, TUNIC } from '../game/sprites'

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
                color: on ? '#0b0715' : 'var(--color-ink-dim)',
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
  const [hairLength, setHairLength] = useState(av.hairLength ?? 'short')
  const [body, setBody] = useState(av.body ?? 'male')

  const preview = { body, skin, hair, hairLength, shirt: TUNIC }

  return (
    <div className="absolute inset-0 z-50 bg-void arcade-bg overflow-y-auto scroll-thin">
      <div className="min-h-full flex flex-col p-4">
        {/* ------------------------------------------------------------ intro */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="font-pixel text-[26px] leading-none">
              LEVEL <span className="text-neon">100</span>
            </div>
            <div className="font-pixel text-[8px] text-ink-faint mt-3">A FITNESS APP THAT PAYS YOU IN LOOT</div>

            <div className="flex justify-center gap-1 my-7">
              <PetView refId="pup" level={1} size={44} />
              <PetView refId="turbo" level={30} size={44} />
              <PetView refId="frost" level={55} size={44} float />
              <PetView refId="ember" level={80} size={44} />
              <PetView refId="zeus" level={100} size={44} />
            </div>

            <p className="text-[12px] text-ink-dim leading-relaxed px-2">
              An RPG you play by moving. Ten bosses, three acts and an ending, on a map of the city you
              live in.
            </p>

            {/* Every open lands here, so a character already in progress needs a
                way past it. Making a new one still starts from nothing — that is
                what making a new one means. */}
            {has && (
              <Btn full size="lg" className="mt-7" onClick={onContinue}>
                CONTINUE AS {state.player.name}
              </Btn>
            )}
            <Btn
              full
              size="lg"
              variant={has ? 'ghost' : 'primary'}
              className={has ? 'mt-2' : 'mt-7'}
              onClick={() => setStep(1)}
            >
              {has ? 'START A NEW CHARACTER' : 'MAKE YOUR CHARACTER'}
            </Btn>
          </div>
        )}

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

            {/* Hair length is the male build's choice. The female build wears
                her own hair, so offering a toggle that does nothing would just
                be a control that lies. */}
            {body === 'male' && (
              <Pick
                label="HAIR"
                value={hairLength}
                onChange={setHairLength}
                options={[
                  { id: 'short', label: 'SHORT' },
                  { id: 'long', label: 'LONG' },
                ]}
              />
            )}

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
                    avatar: { seed: 0, body, skin, hair, hairLength, shirt: TUNIC },
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
