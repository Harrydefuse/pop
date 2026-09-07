import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Btn } from './ui'
import Avatar from './Avatar'
import { BossArt, BossFace, HeroView } from './Sprites'
import { useGame } from '../game/useGame'
import ArenaStage from './ArenaStage'
import { fightOdds, fightPower, fmtFull, resolveFight, todayKey, wornGear } from '../game/engine'

/**
 * Where the campaign is actually decided.
 *
 * Logging sessions wears a boss down between visits, which is the grind. This
 * is the other half: you walk in, blows are traded, and you can lose. What
 * decides it is the week you have just had and the kit you chose to wear —
 * both things the player owns, neither a number they can fake.
 *
 * It goes through a portal to the document body. It used to render inside the
 * campaign tab, where `inset-0` meant the inside of a scrolling panel: the
 * header sat over the top of it in the wrong theme, the tab bar covered the
 * button you press to start the fight, and both fighters were cut off at the
 * knees. A fight takes the screen.
 *
 * The result is rolled once before the first swing, so what plays out is
 * exactly what gets applied — and a loss still lands its damage. Losing costs
 * you the kill and the day's attempt, not the progress, because a system that
 * can take an afternoon away from someone who trained is one they stop opening.
 */

const BEAT_MS = 760

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

// The arena keeps its own colours in both themes. Everywhere else in the app
// follows the page; a fight should not be staged in a pale room because the
// player prefers light mode.
const DECK = {
  ink: '#0b070c',
  panel: 'rgba(18,10,18,0.82)',
  edge: 'rgba(255,186,102,0.28)',
  mine: '#b6f24a',
  theirs: '#ff3d63',
  chip: '#ffd166',
  hit: '#ff5d7a',
  land: '#d8ff6b',
}

/**
 * A fighting-game health bar: portrait, name, and the damage just taken still
 * draining out behind the live value.
 *
 * The chip is the point. A bar that jumps straight to the new number tells you
 * the total; a bar with a bright tail catching up tells you how hard that one
 * landed, which is the only thing the player is watching for.
 */
function Health({ label, hp, max, color, portrait, align = 'left' }) {
  const pct = Math.max(0, Math.min(1, hp / Math.max(1, max)))
  const [chip, setChip] = useState(pct)
  useEffect(() => {
    // Only ever falls behind on the way down: a bar that lags a heal reads as
    // a bug, and nothing in this fight heals anyway.
    setChip((c) => (pct > c ? pct : c))
    const t = setTimeout(() => setChip(pct), 30)
    return () => clearTimeout(t)
  }, [pct])
  const right = align === 'right'
  return (
    <div className={`flex-1 min-w-0 flex items-center gap-2 ${right ? 'flex-row-reverse' : ''}`}>
      {portrait}
      <div className="flex-1 min-w-0">
        <div className={`flex items-baseline gap-2 mb-1 ${right ? 'flex-row-reverse' : ''}`}>
          <span className="font-pixel text-[7px] truncate" style={{ color }}>
            {label}
          </span>
          <span className="font-mono text-[10px] shrink-0" style={{ color: 'rgba(255,236,205,0.72)' }}>
            {fmtFull(Math.max(0, Math.round(hp)))}
          </span>
        </div>
        <div
          className="relative h-[11px] overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.55)', boxShadow: `inset 0 0 0 1px ${DECK.edge}` }}
          role="progressbar"
          aria-valuenow={Math.round(pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`arena-chip absolute inset-y-0 ${right ? 'right-0' : 'left-0'}`}
            style={{ width: `${chip * 100}%`, background: DECK.chip }}
          />
          <div
            className={`arena-hp absolute inset-y-0 ${right ? 'right-0' : 'left-0'}`}
            style={{
              width: `${pct * 100}%`,
              background: color,
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.35), inset 0 -2px 0 0 rgba(0,0,0,0.35)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * The form band's own colours, not the page's.
 *
 * `formOf` hands back theme variables, and the theme can be light — where
 * `--color-danger` is a crimson that reads at 3.2:1 on this panel. The arena
 * fixes its own ground in both themes, so it has to fix its own type too.
 */
const FORM_TONE = { PEAKING: DECK.mine, SHARP: '#8ff8ff', RUSTY: '#ffd166', COLD: DECK.theirs }

function Stat({ label, value, tone }) {
  return (
    <div className="flex-1 px-2 py-1.5 text-center" style={{ background: 'rgba(0,0,0,0.4)', boxShadow: `inset 0 0 0 1px ${DECK.edge}` }}>
      <div className="font-pixel text-[6px]" style={{ color: 'rgba(255,236,205,0.5)' }}>
        {label}
      </div>
      <div className="font-pixel text-[9px] mt-1" style={{ color: tone ?? '#ffeccd' }}>
        {value}
      </div>
    </div>
  )
}

/** The ring of light thrown off a blow, at the point where it lands. */
function Spark({ seed, color, side }) {
  return (
    <span
      key={seed}
      aria-hidden="true"
      className="arena-spark absolute pointer-events-none"
      style={{
        top: '42%',
        [side]: '-6%',
        width: 46,
        height: 46,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        boxShadow: `0 0 18px 4px ${color}`,
      }}
    />
  )
}

/** Sand thrown up where a fighter pushes off. */
function Dust({ side }) {
  return (
    <span
      aria-hidden="true"
      className="arena-dust absolute bottom-0 pointer-events-none"
      style={{
        [side]: '18%',
        width: 26,
        height: 5,
        background: 'radial-gradient(ellipse at 50% 100%, rgba(190,158,110,0.9), transparent 72%)',
        '--dust-x': side === 'right' ? '16px' : '-16px',
      }}
    />
  )
}

export default function Arena({ boss, onClose, tone = '#ff3d63' }) {
  const { state, battle } = useGame()
  const p = state.player
  const damage = state.campaign.damage
  const spent = state.campaign.lastFightDay === todayKey()

  const worn = useMemo(() => wornGear(p), [p])
  const me = fightPower(p, state.log)
  const odds = fightOdds(p, state.log, boss, damage)
  const startBossHp = Math.max(1, boss.hp - damage)

  const [phase, setPhase] = useState('ready')
  const [fight, setFight] = useState(null)
  const [step, setStep] = useState(-1)
  const applied = useRef(false)
  const beats = useMemo(() => beatsOf(fight), [fight])

  // The screen is taken over, so the page behind it must not scroll under the
  // fight when a finger drags across the sand.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

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
  const round = fight ? Math.min(fight.rounds.length, Math.floor(step / 2) + 1) : 0

  const skip = () => {
    setStep(beats.length - 1)
    setPhase('done')
  }

  const start = () => {
    setFight(resolveFight(p, state.log, boss, damage))
    setStep(0)
    setPhase('fighting')
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: DECK.ink, color: '#ffeccd' }}>
      {/* ---------------------------------------------------------- the crown */}
      <div
        className="flex items-center gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))] pb-2 shrink-0"
        style={{ background: DECK.panel, boxShadow: `inset 0 -1px 0 0 ${DECK.edge}` }}
      >
        <span
          className="font-pixel text-[10px]"
          style={{ color: over ? (fight.won ? DECK.mine : DECK.theirs) : tone }}
        >
          {over ? (fight.won ? 'VICTORY' : 'DEFEATED') : 'THE ARENA'}
        </span>
        <div className="flex-1" />
        {live ? (
          <button
            onClick={skip}
            className="press font-pixel text-[7px] min-h-[44px] px-2"
            style={{ color: 'rgba(255,236,205,0.6)' }}
          >
            SKIP
          </button>
        ) : (
          <button
            onClick={onClose}
            aria-label="Leave the arena"
            className="press grid place-items-center min-w-[44px] min-h-[44px] text-[18px] leading-none"
            style={{ color: 'rgba(255,236,205,0.6)' }}
          >
            ×
          </button>
        )}
      </div>

      {/* ----------------------------------------------------------- the bars */}
      <div className="flex gap-3 px-3 py-2.5 shrink-0" style={{ background: DECK.panel }}>
        <Health
          label={(p.name || 'YOU').toUpperCase()}
          hp={myHp}
          max={me.hp}
          color={DECK.mine}
          portrait={<Avatar av={p.avatar} size={30} ring={DECK.mine} />}
        />
        <Health
          label={boss.name}
          hp={bossHp}
          max={startBossHp}
          color={DECK.theirs}
          align="right"
          portrait={
            <BossFace
              sprite={boss.sprite}
              size={30}
              className="shrink-0"
              style={{ background: 'rgba(0,0,0,0.5)', boxShadow: `inset 0 0 0 1px ${DECK.theirs}` }}
            />
          }
        />
      </div>

      {/* ---------------------------------------------------------- the stage */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div className={`absolute inset-0 ${heroHit || bossHit ? 'arena-jolt' : ''}`}>
          <ArenaStage flash={step + 1} className="absolute inset-0" />
        </div>

        {/* The fighters stand on the sand rather than at the bottom of the box:
            the wall behind them ends at 46% and the ring is drawn under their
            feet, so they are placed against the floor, not the frame. */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] flex items-end justify-between px-4 pb-[6%]">
          <div className="relative">
            <div className={heroHit ? 'arena-hurt' : bossHit ? 'arena-attack-r' : heroDown ? 'arena-fall' : 'arena-idle'}>
              <HeroView av={p.avatar} equipped={worn} height={150} />
            </div>
            {bossHit && <Dust key={`dh${step}`} side="right" />}
            {heroHit && <Spark seed={`s${step}`} color={DECK.theirs} side="right" />}
            {heroHit && (
              <span
                key={`h${step}`}
                className="arena-pop absolute left-1/2 -translate-x-1/2 -top-2 font-pixel text-[16px]"
                style={{ color: DECK.hit, textShadow: '0 2px 0 #12090f, 0 0 14px rgba(255,93,122,0.8)' }}
              >
                -{beat.dmg}
              </span>
            )}
          </div>

          <div className="relative">
            <div className={bossHit ? 'arena-hurt' : heroHit ? 'arena-attack-l' : bossDown ? 'arena-fall' : 'float-soft'}>
              <BossArt sprite={boss.sprite} size={142} />
            </div>
            {heroHit && <Dust key={`db${step}`} side="left" />}
            {bossHit && <Spark seed={`s${step}`} color={DECK.land} side="left" />}
            {bossHit && (
              <span
                key={`b${step}`}
                className="arena-pop absolute left-1/2 -translate-x-1/2 -top-2 font-pixel text-[16px]"
                style={{ color: DECK.land, textShadow: '0 2px 0 #12090f, 0 0 14px rgba(216,255,107,0.7)' }}
              >
                -{beat.dmg}
              </span>
            )}
          </div>
        </div>

        {/* The call. One line, dead centre, gone in a second — it announces the
            fight and then gets out of the way of it. */}
        {live && step === 0 && (
          <span
            className="arena-slam absolute left-1/2 top-[38%] font-pixel text-[34px] pointer-events-none"
            style={{ color: '#ffd166', textShadow: '0 4px 0 #12090f, 0 0 30px rgba(255,209,102,0.8)' }}
          >
            FIGHT
          </span>
        )}
        {live && step > 0 && (
          <span
            key={round}
            className="arena-banner absolute left-1/2 -translate-x-1/2 top-2 font-pixel text-[8px] px-2.5 py-1 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#ffd166', boxShadow: `inset 0 0 0 1px ${DECK.edge}` }}
          >
            ROUND {round} / {fight.rounds.length}
          </span>
        )}
        {over && (
          <span
            className="arena-slam absolute left-1/2 top-[36%] font-pixel text-[30px] pointer-events-none"
            style={{
              color: fight.won ? DECK.mine : DECK.theirs,
              textShadow: `0 4px 0 #12090f, 0 0 30px ${fight.won ? 'rgba(182,242,74,0.7)' : 'rgba(255,61,99,0.7)'}`,
            }}
          >
            {fight.won ? 'K.O.' : 'DOWN'}
          </span>
        )}
      </div>

      {/* --------------------------------------------------------- the console
          Collapses to nothing while the blows are landing. The stats are what
          you read before you commit; during the fight they are furniture in
          front of the only thing worth watching. */}
      <div
        className={`shrink-0 overflow-y-auto scroll-thin ${live ? '' : 'px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]'}`}
        style={live ? undefined : { background: DECK.panel, boxShadow: `inset 0 1px 0 0 ${DECK.edge}` }}
      >
        {phase === 'ready' && (
          <div className="stack-in">
            <div className="flex gap-1.5">
              <Stat label="FORM" value={me.form.label} tone={FORM_TONE[me.form.label] ?? DECK.chip} />
              <Stat label="GEAR" value={me.gear} tone="#8ff8ff" />
              <Stat label="PER HIT" value={me.attack} tone={DECK.mine} />
              <Stat
                label="ODDS"
                value={odds > 0.75 ? 'FAVOURED' : odds > 0.45 ? 'EVEN' : odds > 0.2 ? 'AGAINST' : 'HOPELESS'}
                tone={odds > 0.6 ? DECK.mine : odds > 0.3 ? '#ffd166' : DECK.theirs}
              />
            </div>

            <p className="text-[11px] mt-2.5 leading-snug" style={{ color: 'rgba(255,236,205,0.66)' }}>
              {me.form.sessions === 0
                ? 'Nothing logged in seven days. You walk in cold — every swing is at half strength.'
                : `${me.form.sessions} ${me.form.sessions === 1 ? 'session' : 'sessions'} behind you this week, and the kit you have on. Both go into every swing.`}
            </p>

            {spent ? (
              <div className="mt-3 p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.4)', boxShadow: `inset 0 0 0 1px ${DECK.edge}` }}>
                <div className="font-pixel text-[8px]" style={{ color: '#ffd166' }}>
                  ALREADY FOUGHT TODAY
                </div>
                <div className="text-[11px] mt-1.5" style={{ color: 'rgba(255,236,205,0.66)' }}>
                  One trip a day. Go and train — it is what the next one is made of.
                </div>
              </div>
            ) : (
              <Btn full variant="danger" className="mt-3 motion-own" onClick={start}>
                STEP IN
              </Btn>
            )}
          </div>
        )}

        {over && (
          <div className="stack-in">
            <div className="p-2.5" style={{ background: 'rgba(0,0,0,0.4)', boxShadow: `inset 0 0 0 1px ${fight.won ? DECK.mine : DECK.theirs}` }}>
              <div className="font-pixel text-[8px]" style={{ color: fight.won ? DECK.mine : DECK.theirs }}>
                {fight.won ? `${boss.name} IS DOWN` : 'IT IS STILL STANDING'}
              </div>
              <div className="text-[11px] mt-1.5 leading-snug" style={{ color: 'rgba(255,236,205,0.7)' }}>
                {fight.won
                  ? 'The road opens. Whatever it was carrying is yours.'
                  : `${
                      myHp <= 0
                        ? `It put you down, but not before you took ${fmtFull(fight.dealt)} off it.`
                        : `${fmtFull(fight.dealt)} off it, and it is still on its feet.`
                    } That damage stays — come back tomorrow with a better week behind you.`}
              </div>
            </div>
            <Btn full className="mt-3 motion-own" onClick={onClose}>
              LEAVE THE ARENA
            </Btn>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
