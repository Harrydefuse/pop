import { useState } from 'react'
import { Btn, Chip, Panel } from './ui'
import Icon from './Icon'
import Avatar from './Avatar'
import { PetView } from './Sprites'
import { useGame } from '../game/useGame'
import { CLASSES } from '../game/config'
import { GAME_ACCOUNTS, HEALTH_PROVIDERS } from '../game/data'
import { AVATAR_HAIR, AVATAR_SKINS } from '../game/sprites'
import { alpha } from '../game/color'

const PITCH = [
  ['TRACK IT ALL', 'Every rep, kilometre and hour of sleep becomes a number that goes up.'],
  ['1% A DAY', 'In the gym and in your queue. Small, boring, compounding.'],
  ['KEEP THE GAMES', 'This is not a detox app. Play as much as you want — just move too.'],
  ['SHOW UP DAILY', 'Streaks, chests and friends who notice when you go quiet.'],
]

export default function Onboarding() {
  const { onboard } = useGame()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [classId, setClassId] = useState('duelist')
  const [skin, setSkin] = useState(AVATAR_SKINS[1])
  const [hair, setHair] = useState(AVATAR_HAIR[1])
  const [seed, setSeed] = useState(0)
  const [health, setHealth] = useState([])
  const [games, setGames] = useState([])

  const cls = CLASSES.find((c) => c.id === classId)
  const shirt = cls.color

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  return (
    <div className="absolute inset-0 z-50 bg-void arcade-bg overflow-y-auto scroll-thin">
      <div className="min-h-full flex flex-col p-4">
        {/* ------------------------------------------------------------ intro */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="font-pixel text-[26px] leading-none">
              LEVEL <span className="text-neon">100</span>
            </div>
            <div className="font-pixel text-[8px] text-ink-faint mt-3">FITNESS RPG FOR GAMERS</div>

            <div className="flex justify-center gap-1 my-7">
              <PetView refId="pup" level={1} size={44} />
              <PetView refId="turbo" level={30} size={44} />
              <PetView refId="frost" level={55} size={44} float />
              <PetView refId="ember" level={80} size={44} />
              <PetView refId="zeus" level={100} size={44} />
            </div>

            <div className="space-y-2 text-left">
              {PITCH.map(([t, d]) => (
                <Panel key={t} className="p-2.5" corners={false}>
                  <div className="font-pixel text-[8px] text-neon">{t}</div>
                  <div className="text-[11px] text-ink-dim mt-1.5">{d}</div>
                </Panel>
              ))}
            </div>

            <Btn full size="lg" className="mt-6" onClick={() => setStep(1)}>
              CREATE CHARACTER
            </Btn>
          </div>
        )}

        {/* --------------------------------------------------------- identity */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon mt-2">WHO ARE YOU?</div>
            <div className="text-[11px] text-ink-dim mt-2">Pick a name your friends will see on the board.</div>

            <div className="flex justify-center my-6">
              <Avatar av={{ seed, skin, hair, shirt }} size={96} ring={shirt} />
            </div>

            <label className="font-pixel text-[7px] text-ink-faint">DISPLAY NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 14))}
              placeholder="ROOKIE"
              className="w-full bg-panel border border-line p-3 mt-1.5 font-pixel text-[10px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
            />

            <label className="font-pixel text-[7px] text-ink-faint mt-4">HANDLE</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/\s/g, '').slice(0, 18))}
              placeholder="newchallenger"
              className="w-full bg-panel border border-line p-3 mt-1.5 font-mono text-[12px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
            />

            <div className="mt-5">
              <div className="font-pixel text-[7px] text-ink-faint mb-2">SKIN</div>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_SKINS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSkin(c)}
                    className="w-8 h-8 border-2"
                    style={{ background: c, borderColor: skin === c ? 'var(--color-neon)' : 'var(--color-line)' }}
                    aria-label={`Skin ${c}`}
                  />
                ))}
              </div>
              <div className="font-pixel text-[7px] text-ink-faint mt-4 mb-2">HAIR</div>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_HAIR.map((c) => (
                  <button
                    key={c}
                    onClick={() => setHair(c)}
                    className="w-8 h-8 border-2"
                    style={{ background: c, borderColor: hair === c ? 'var(--color-neon)' : 'var(--color-line)' }}
                    aria-label={`Hair ${c}`}
                  />
                ))}
              </div>
              <Btn size="sm" variant="ghost" className="mt-4" onClick={() => setSeed((s) => s + 1)}>
                SHUFFLE BUILD
              </Btn>
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

        {/* ------------------------------------------------------------ class */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon mt-2">PICK YOUR CLASS</div>
            <div className="text-[11px] text-ink-dim mt-2">
              Your class is the game you main crossed with the training you actually do. The bonus is small on purpose —
              no class is a wrong pick.
            </div>

            <div className="space-y-2 mt-4">
              {CLASSES.map((c) => {
                const active = classId === c.id
                return (
                  <button key={c.id} onClick={() => setClassId(c.id)} className="w-full text-left">
                    <Panel
                      className="p-3"
                      corners={false}
                      style={{
                        borderColor: active ? c.color : 'var(--color-line)',
                        background: active ? alpha(c.color, 10) : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-[10px]" style={{ color: c.color }}>
                          {c.name}
                        </span>
                        <Chip color={c.color}>{c.affinity}</Chip>
                      </div>
                      <div className="text-[11px] text-ink-dim mt-2">{c.tagline}</div>
                      <div className="font-mono text-[10px] text-ink-faint mt-1.5">{c.games.join(' · ')}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Icon name="spark" size={9} color={c.color} />
                        <span className="text-[11px]" style={{ color: c.color }}>
                          {c.passive.label}
                        </span>
                      </div>
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

        {/* ------------------------------------------------------------ links */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <div className="font-pixel text-[11px] text-neon mt-2">CONNECT</div>
            <div className="text-[11px] text-ink-dim mt-2">
              A health source is what makes your numbers real — without one, everything you log counts at half rate and
              never touches a leaderboard.
            </div>

            <div className="font-pixel text-[7px] text-ink-faint mt-5 mb-2">HEALTH</div>
            <div className="space-y-1.5">
              {HEALTH_PROVIDERS.map((h) => {
                const on = health.includes(h.id)
                return (
                  <button
                    key={h.id}
                    onClick={() => toggle(health, setHealth, h.id)}
                    className="w-full flex items-center gap-2.5 border p-2.5 text-left"
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

            <div className="font-pixel text-[7px] text-ink-faint mt-5 mb-2">GAMES · OPTIONAL</div>
            <div className="space-y-1.5">
              {GAME_ACCOUNTS.map((g) => {
                const on = games.includes(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => toggle(games, setGames, g.id)}
                    className="w-full flex items-center gap-2.5 border p-2.5 text-left"
                    style={{ borderColor: on ? g.color : 'var(--color-line)' }}
                  >
                    <Icon name={on ? 'check' : 'link'} size={12} color={on ? g.color : 'var(--color-ink-faint)'} />
                    <span className="font-pixel text-[8px] flex-1" style={{ color: on ? g.color : 'var(--color-ink-dim)' }}>
                      {g.name.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-ink-faint truncate max-w-[45%]">{g.titles}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 mt-auto pt-6">
              <Btn variant="ghost" onClick={() => setStep(2)}>
                BACK
              </Btn>
              <Btn
                className="flex-1"
                onClick={() =>
                  onboard({
                    name: (name.trim() || 'ROOKIE').toUpperCase(),
                    handle: handle.trim() || 'newchallenger',
                    classId,
                    avatar: { seed, skin, hair, shirt },
                    health,
                    games,
                  })
                }
              >
                ENTER LVL100
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
