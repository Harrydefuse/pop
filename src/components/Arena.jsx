import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Btn } from './ui'
import { BossArt, HeroView } from './Sprites'
import { useGame } from '../game/useGame'
import { fightOdds, fightPower, fmtFull, resolveFight, todayKey } from '../game/engine'

/**
 * Where the campaign is actually decided.
 *
 * Logging sessions wears a boss down between visits, which is the grind. This
 * is the other half: you walk in, blows are traded, and you can lose. What
 * decides it is the week you have just had and the kit you chose to wear —
 * both things the player owns, neither a number they can fake.
 *
 * It takes the whole screen rather than sitting in a card, and the blows are
 * animated one at a time, because a fight the player reads as a list of numbers
 * is not a fight. The result is rolled once before the first swing, so what
 * plays out is exactly what gets applied.
 *
 * A loss still lands its damage. Losing costs you the kill and the day's
 * attempt, not the progress, because a system that can take an afternoon away
 * from someone who trained is a system they stop opening.
 */

const BEAT_MS = 780

/** The rounds, flattened into single blows so each one can be watched land. */
function beatsOf(fight) {
  if (!fight) return []
  const out = []
  for (const r of fight.rounds) {
    out.push({ who: 'me', dmg: r.mine, myHp: r.myHp + r.theirs, bossHp: r.bossHp })
    if (r.theirs > 0) out.push({ who: 'boss', dmg: r.theirs, myHp: r.myHp, bossHp: r.bossHp })
  }
  return out
}

/**
 * Sky, horizon, and a floor running away to a vanishing point.
 *
 * Drawn rather than transformed. A CSS `perspective()` on a plane is at the
 * mercy of the box it lands in — at one viewport height the floor was a tasteful
 * band and at another it swallowed the fighters — where converging lines put the
 * horizon exactly where they are told.
 */
const HORIZON = 38
const VANISH = 50

// The arena keeps its own colours in both themes. Everywhere else in the app
// follows the page; a fight should not be staged in a pale room because the
// player prefers light mode. Dark ground, torchlight, and the two sprites as
// the only bright things in it.
const DECK = {
  ink: '#120a10',
  wall: '#1e0f18',
  arch: '#2c1521',
  lit: '#f0643c',
  line: 'rgba(240, 100, 60, 0.22)',
  horizon: 'rgba(240, 140, 90, 0.5)',
  hit: '#ff5d7a',
  land: '#b6f24a',
}

function Ground({ shake }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${shake ? 'arena-jolt' : ''}`}
      style={{ background: DECK.ink }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="arena-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={DECK.ink} />
            <stop offset="100%" stopColor={DECK.wall} />
          </linearGradient>
          <linearGradient id="arena-deck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(240,100,60,0.16)" />
            <stop offset="100%" stopColor="rgba(240,100,60,0.02)" />
          </linearGradient>
        </defs>
        <rect width="100" height={HORIZON} fill="url(#arena-sky)" />
        {/* The stand: a wall of arches behind the fighters, lit from the floor. */}
        <rect y={HORIZON - 20} width="100" height="20" fill={DECK.wall} />
        <rect y={HORIZON - 21.5} width="100" height="1.5" fill={DECK.arch} />
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i} x={i * 8 + 2} y={HORIZON - 16} width="4.5" height="16" rx="2.25" fill={DECK.arch} />
        ))}
        <rect y={HORIZON} width="100" height={100 - HORIZON} fill="url(#arena-deck)" />
        {/* Boards, running to the point. */}
        {[-90, -58, -34, -16, 0, 16, 34, 58, 90].map((x) => (
          <line key={x} x1={VANISH} y1={HORIZON} x2={VANISH + x} y2="100" stroke={DECK.line} strokeWidth="0.4" />
        ))}
        {/* Courses, packing together as they recede. */}
        {[0.05, 0.13, 0.24, 0.39, 0.58, 0.82].map((t) => (
          <line
            key={t}
            x1="0"
            y1={HORIZON + (100 - HORIZON) * t}
            x2="100"
            y2={HORIZON + (100 - HORIZON) * t}
            stroke={DECK.line}
            strokeWidth="0.4"
          />
        ))}
        <line x1="0" y1={HORIZON} x2="100" y2={HORIZON} stroke={DECK.horizon} strokeWidth="0.9" />
      </svg>

      {/* A brazier either side, because an empty room is not an arena. */}
      {[7, 93].map((x) => (
        <div key={x} className="absolute" style={{ left: `${x}%`, bottom: `${92 - HORIZON}%`, marginLeft: -10, width: 20 }}>
          <div
            className="arena-torch mx-auto"
            style={{
              width: 12,
              height: 22,
              background: `linear-gradient(180deg, #ffd166, ${DECK.lit})`,
              borderRadius: '50% 50% 40% 40%',
              boxShadow: `0 0 22px 6px rgba(240,100,60,0.35)`,
            }}
          />
          <div className="mx-auto" style={{ width: 20, height: 6, background: DECK.arch }} />
          <div className="mx-auto" style={{ width: 6, height: 30, background: DECK.arch }} />
        </div>
      ))}

      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 66%, transparent 34%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  )
}

/** A fighting-game health bar: name, number, and the bar draining under it. */
function Health({ label, hp, max, color, align = 'left' }) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-baseline gap-2 mb-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className="font-pixel text-[7px] truncate" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[10px] text-ink-faint shrink-0">{fmtFull(Math.max(0, Math.round(hp)))}</span>
      </div>
      <Bar pct={Math.max(0, hp) / Math.max(1, max)} color={color} height={9} />
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="flex-1 border border-line bg-panel px-2 py-1.5 text-center">
      <div className="font-pixel text-[6px] text-ink-faint">{label}</div>
      <div className="font-pixel text-[9px] mt-1" style={{ color: tone ?? 'var(--color-ink)' }}>
        {value}
      </div>
    </div>
  )
}

export default function Arena({ boss, onClose, tone = 'var(--color-danger)' }) {
  const { state, battle } = useGame()
  const p = state.player
  const damage = state.campaign.damage
  const spent = state.campaign.lastFightDay === todayKey()

  const me = fightPower(p, state.log)
  const odds = fightOdds(p, state.log, boss, damage)
  const startBossHp = Math.max(1, boss.hp - damage)

  const [phase, setPhase] = useState('ready')
  const [fight, setFight] = useState(null)
  const [step, setStep] = useState(-1)
  const applied = useRef(false)
  const beats = useMemo(() => beatsOf(fight), [fight])

  useEffect(() => {
    if (phase !== 'fighting') return
    if (step >= beats.length - 1) {
      const t = setTimeout(() => setPhase('done'), 900)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((s) => s + 1), BEAT_MS)
    return () => clearTimeout(t)
  }, [phase, step, beats.length])

  // Applied when the last blow has landed, so nothing on screen dies early.
  useEffect(() => {
    if (phase !== 'done' || !fight || applied.current) return
    applied.current = true
    battle({ dealt: fight.dealt, won: fight.won })
  }, [phase, fight, battle])

  const beat = step >= 0 ? beats[step] : null
  const live = phase === 'fighting'
  const over = phase === 'done'
  const myHp = beat ? beat.myHp : me.hp
  const bossHp = beat ? beat.bossHp : startBossHp
  const heroHit = live && beat?.who === 'boss'
  const bossHit = live && beat?.who === 'me'
  const heroDown = over && !fight.won && myHp <= 0
  const bossDown = over && fight.won

  const skip = () => {
    setStep(beats.length - 1)
    setPhase('done')
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-void">
      {/* ------------------------------------------------------------- crown */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line shrink-0">
        <span className="font-pixel text-[10px]" style={{ color: over ? (fight.won ? 'var(--color-lime)' : 'var(--color-danger)') : tone }}>
          {over ? (fight.won ? 'VICTORY' : 'DEFEATED') : 'THE ARENA'}
        </span>
        {live && (
          <span className="font-pixel text-[7px] text-ink-faint">
            ROUND {Math.min(fight.rounds.length, Math.floor(step / 2) + 1)}/{fight.rounds.length}
          </span>
        )}
        <div className="flex-1" />
        {live ? (
          <button onClick={skip} className="font-pixel text-[7px] text-ink-faint min-h-[44px] px-2 active:brightness-125">
            SKIP
          </button>
        ) : (
          <button
            onClick={onClose}
            aria-label="Leave the arena"
            className="grid place-items-center min-w-[44px] min-h-[44px] text-[18px] leading-none text-ink-faint active:brightness-125"
          >
            ×
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------- the bars */}
      <div className="flex gap-3 px-3 py-2.5 shrink-0">
        <Health label={(p.name || 'YOU').toUpperCase()} hp={myHp} max={me.hp} color="var(--color-lime)" />
        <Health label={boss.name} hp={bossHp} max={startBossHp} color="var(--color-danger)" align="right" />
      </div>

      {/* --------------------------------------------------------- the floor */}
      <div className="relative flex-1 min-h-[210px] overflow-hidden border-y border-line">
        <Ground shake={bossHit || heroHit} />

        <div className="absolute inset-0 flex items-end justify-between px-3 pb-[7%]">
          <div className="relative">
            <div className={heroHit ? 'arena-hurt' : bossHit ? 'arena-attack-r' : heroDown ? 'arena-fall' : ''}>
              <HeroView av={p.avatar} equipped={p.equipped} height={158} />
            </div>
            {heroHit && (
              <span
                key={`h${step}`}
                className="arena-pop absolute left-1/2 -translate-x-1/2 -top-1 font-pixel text-[15px]"
                style={{ color: DECK.hit, textShadow: '0 2px 0 #12090f, 0 0 12px rgba(255,93,122,0.7)' }}
              >
                -{beat.dmg}
              </span>
            )}
          </div>

          <div className="relative">
            <div className={bossHit ? 'arena-hurt' : heroHit ? 'arena-attack-l' : bossDown ? 'arena-fall' : 'float-soft'}>
              <BossArt sprite={boss.sprite} size={148} />
            </div>
            {bossHit && (
              <span
                key={`b${step}`}
                className="arena-pop absolute left-1/2 -translate-x-1/2 -top-1 font-pixel text-[15px]"
                style={{ color: DECK.land, textShadow: '0 2px 0 #12090f, 0 0 12px rgba(182,242,74,0.6)' }}
              >
                -{beat.dmg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- the console */}
      <div className="p-3 shrink-0 overflow-y-auto scroll-thin">
        {phase === 'ready' && (
          <>
            <div className="flex gap-1.5">
              <Stat label="FORM" value={me.form.label} tone={me.form.color} />
              <Stat label="GEAR" value={me.gear} tone="var(--color-neon)" />
              <Stat label="PER HIT" value={me.attack} tone="var(--color-lime)" />
              <Stat
                label="ODDS"
                value={odds > 0.75 ? 'FAVOURED' : odds > 0.45 ? 'EVEN' : odds > 0.2 ? 'AGAINST' : 'HOPELESS'}
                tone={odds > 0.6 ? 'var(--color-lime)' : odds > 0.3 ? 'var(--color-gold)' : 'var(--color-danger)'}
              />
            </div>

            <p className="text-[11px] text-ink-dim mt-2.5 leading-snug">
              {me.form.sessions === 0
                ? 'Nothing logged in seven days. You walk in cold — every swing is at half strength.'
                : `${me.form.sessions} ${me.form.sessions === 1 ? 'session' : 'sessions'} behind you this week, and the kit you have on. Both go into every swing.`}
            </p>

            {spent ? (
              <div className="mt-3 border border-line bg-panel p-2.5 text-center">
                <div className="font-pixel text-[8px] text-gold">ALREADY FOUGHT TODAY</div>
                <div className="text-[11px] text-ink-dim mt-1.5">One trip a day. Go and train — it is what the next one is made of.</div>
              </div>
            ) : (
              <Btn
                full
                variant="danger"
                className="mt-3"
                onClick={() => {
                  setFight(resolveFight(p, state.log, boss, damage))
                  setStep(0)
                  setPhase('fighting')
                }}
              >
                STEP IN
              </Btn>
            )}
          </>
        )}

        {over && (
          <>
            <div className="border p-2.5" style={{ borderColor: fight.won ? 'var(--color-lime)' : 'var(--color-danger)' }}>
              <div className="font-pixel text-[8px]" style={{ color: fight.won ? 'var(--color-lime)' : 'var(--color-danger)' }}>
                {fight.won ? `${boss.name} IS DOWN` : 'IT IS STILL STANDING'}
              </div>
              <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
                {fight.won
                  ? 'The road opens. Whatever it was carrying is yours.'
                  : `${
                      myHp <= 0
                        ? `It put you down, but not before you took ${fmtFull(fight.dealt)} off it.`
                        : `${fmtFull(fight.dealt)} off it, and it is still on its feet.`
                    } That damage stays — come back tomorrow with a better week behind you.`}
              </div>
            </div>
            <Btn full className="mt-3" onClick={onClose}>
              LEAVE THE ARENA
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}
