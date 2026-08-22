import { useState } from 'react'
import { Btn, Chip, Panel } from './ui'
import Icon from './Icon'
import { HeroView, PetView } from './Sprites'
import { useGame } from '../game/useGame'
import { CLASSES, GAME_CATALOG, GAME_GENRES } from '../game/config'
import { HEALTH_PROVIDERS } from '../game/data'
import { AVATAR_HAIR, AVATAR_SKINS, TUNIC } from '../game/sprites'
import { alpha } from '../game/color'

const STEPS = ['YOU', 'CLASS', 'GAMES', 'SYNC']

function Progress({ step }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex-1">
          <div className="h-1" style={{ background: i <= step - 1 ? 'var(--color-neon)' : 'var(--color-line)' }} />
          <div
            className="font-pixel text-[6px] mt-1.5"
            style={{ color: i <= step - 1 ? 'var(--color-neon)' : 'var(--color-ink-faint)' }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
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

export default function Onboarding() {
  const { onboard } = useGame()
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [skin, setSkin] = useState(AVATAR_SKINS[1])
  const [hair, setHair] = useState(AVATAR_HAIR[0])
  const [hairLength, setHairLength] = useState('short')
  const [classId, setClassId] = useState('ironstride')
  const [games, setGames] = useState([])
  const [health, setHealth] = useState([])

  const cls = CLASSES.find((c) => c.id === classId)
  const toggle = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  // The tunic is the base character's, not the class colour — class is already
  // spelled out in text, and the hero should look like the hero.
  const preview = { skin, hair, hairLength, shirt: TUNIC }

  return (
    <div className="absolute inset-0 z-50 bg-void arcade-bg overflow-y-auto scroll-thin">
      <div className="min-h-full flex flex-col p-4">
        {step > 0 && (
          <div className="mb-5">
            <Progress step={step} />
          </div>
        )}

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
              Three small things a day. Every day you move, a chest unlocks — and every chest can roll
              anything.
            </p>

            <Btn full size="lg" className="mt-7" onClick={() => setStep(1)}>
              MAKE YOUR CHARACTER
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
                style={{ borderColor: cls.color, background: 'rgba(0,0,0,0.25)' }}
              >
                <HeroView av={preview} height={150} />
              </div>
            </div>

            <label className="font-pixel text-[7px] text-ink-faint" htmlFor="ob-name">
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

            <div className="font-pixel text-[7px] text-ink-faint mt-4 mb-2">HAIR</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['short', 'SHORT'],
                ['long', 'LONG'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setHairLength(id)}
                  aria-pressed={hairLength === id}
                  className="font-pixel text-[8px] min-h-[44px] border transition-colors active:brightness-125"
                  style={{
                    color: hairLength === id ? '#0b0715' : 'var(--color-ink-dim)',
                    background: hairLength === id ? 'var(--color-neon)' : 'transparent',
                    borderColor: hairLength === id ? 'var(--color-neon)' : 'var(--color-line)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

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
              <Btn className="flex-1" onClick={() => setStep(2)}>
                NEXT
              </Btn>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- 2. your class */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon">HOW DO YOU TRAIN?</div>
            <div className="text-[11px] text-ink-dim mt-2">
              Pick what you already do most. The bonus is small on purpose, and everything still counts
              whichever you choose.
            </div>

            <div className="space-y-2 mt-4">
              {CLASSES.map((c) => {
                const on = classId === c.id
                return (
                  <button key={c.id} onClick={() => setClassId(c.id)} className="w-full text-left active:brightness-125">
                    <Panel
                      className="p-3"
                      corners={false}
                      style={{ borderColor: on ? c.color : 'var(--color-line)', background: on ? alpha(c.color, 12) : undefined }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="grid place-items-center w-11 h-11 shrink-0 border"
                          style={{ borderColor: c.color, background: on ? c.color : 'transparent' }}
                        >
                          <Icon name={c.icon} size={20} color={on ? '#0b0715' : c.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-pixel text-[10px]" style={{ color: c.color }}>
                            {c.name}
                          </div>
                          <div className="text-[11px] text-ink-dim mt-1">{c.tagline}</div>
                        </div>
                        <Chip color={c.color}>{c.affinity}</Chip>
                      </div>
                      {on && (
                        <div className="mt-2.5 pt-2.5 border-t border-line">
                          <div className="text-[11px] text-ink-dim">{c.blurb}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Icon name="spark" size={9} color={c.color} />
                            <span className="text-[11px]" style={{ color: c.color }}>
                              {c.passive.label}
                            </span>
                          </div>
                        </div>
                      )}
                    </Panel>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 mt-auto pt-6">
              <Btn variant="ghost" onClick={() => setStep(1)}>
                BACK
              </Btn>
              <Btn className="flex-1" onClick={() => setStep(3)}>
                NEXT
              </Btn>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- 3. your games */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon">WHAT DO YOU PLAY?</div>
            <div className="text-[11px] text-ink-dim mt-2">
              Pick as many as you like. This is how we&apos;ll suggest friends and set up challenges for
              the games you actually play — skip it if you&apos;d rather not.
            </div>

            <div className="mt-4 space-y-3.5">
              {GAME_GENRES.map((genre) => (
                <div key={genre}>
                  <div className="font-pixel text-[6px] text-ink-faint mb-2">{genre.toUpperCase()}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {GAME_CATALOG.filter((g) => g.genre === genre).map((g) => {
                      const on = games.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggle(games, setGames, g.id)}
                          aria-pressed={on}
                          className="text-[11px] px-2.5 min-h-[44px] border transition-colors active:brightness-125"
                          style={{
                            color: on ? '#0b0715' : 'var(--color-ink-dim)',
                            background: on ? 'var(--color-cyan)' : 'transparent',
                            borderColor: on ? 'var(--color-cyan)' : 'var(--color-line)',
                          }}
                        >
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-auto pt-6">
              <Btn variant="ghost" onClick={() => setStep(2)}>
                BACK
              </Btn>
              <Btn className="flex-1" onClick={() => setStep(4)}>
                {games.length ? `NEXT · ${games.length} PICKED` : 'SKIP'}
              </Btn>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- 4. sync */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon">CONNECT</div>
            <div className="text-[11px] text-ink-dim mt-2">
              A health source is what makes your numbers real. Without one, everything you log counts at
              half rate and never touches a leaderboard.
            </div>

            <div className="space-y-1.5 mt-4">
              {HEALTH_PROVIDERS.map((h) => {
                const on = health.includes(h.id)
                return (
                  <button
                    key={h.id}
                    onClick={() => toggle(health, setHealth, h.id)}
                    aria-pressed={on}
                    className="w-full flex items-center gap-2.5 border p-2.5 text-left min-h-[44px] active:brightness-125"
                    style={{ borderColor: on ? h.color : 'var(--color-line)' }}
                  >
                    <Icon name={on ? 'check' : 'link'} size={12} color={on ? h.color : 'var(--color-ink-faint)'} />
                    <span className="font-pixel text-[8px] flex-1" style={{ color: on ? h.color : 'var(--color-ink-dim)' }}>
                      {h.name.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-ink-faint">{h.note}</span>
                  </button>
                )
              })}
            </div>

            <Panel className="p-3 mt-4" corners={false}>
              <div className="flex items-center gap-3">
                <HeroView av={preview} height={72} />
                <div className="min-w-0">
                  <div className="font-pixel text-[9px]">{name.trim().toUpperCase() || 'ROOKIE'}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Chip color={cls.color}>{cls.name}</Chip>
                    {!!games.length && <Chip color="var(--color-cyan)">{games.length} GAMES</Chip>}
                  </div>
                </div>
              </div>
            </Panel>

            <div className="flex gap-2 mt-auto pt-6">
              <Btn variant="ghost" onClick={() => setStep(3)}>
                BACK
              </Btn>
              <Btn
                className="flex-1"
                onClick={() =>
                  onboard({
                    name: (name.trim() || 'ROOKIE').toUpperCase(),
                    handle: handle.trim() || 'newchallenger',
                    classId,
                    avatar: { seed: 0, skin, hair, hairLength, shirt: TUNIC },
                    games,
                    health,
                  })
                }
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
