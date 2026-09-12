import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Btn } from './ui'
import Avatar from './Avatar'
import { BossArt, BossFace, HeroView } from './Sprites'
import { useGame } from '../game/useGame'
import { campaignState, fightOdds, fightPower, fmtFull, resolveFight, swingFor, todayKey, wornGear } from '../game/engine'

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
          <span className="font-display text-[12px] truncate" style={{ color }}>
            {label}
          </span>
          <span className="text-[14px] shrink-0" style={{ color: 'rgba(255,236,205,0.72)' }}>
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
      <div className="font-display text-[11px]" style={{ color: 'rgba(255,236,205,0.5)' }}>
        {label}
      </div>
      <div className="font-display text-[15px] mt-1" style={{ color: tone ?? '#ffeccd' }}>
        {value}
      </div>
    </div>
  )
}

/**
 * The room, in four bands: wall, the line where it meets the ground, the
 * ground, and the dark the edges fall away into.
 *
 * It was a painted canvas — arches, sconces, scuffed sand, a ring scratched
 * into the floor — and at that size it was a cathedral with two dolls standing
 * in it. A fight wants the fighters big and the room out of the way, so the
 * room is four gradients now and nothing else.
 */
// Where the wall meets the floor. Fixed, because the fighters are placed
// against it rather than the other way round.
const HORIZON = '50%'

function Stage() {
  const y = HORIZON
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: y, background: 'linear-gradient(180deg, #08050e 0%, #1a1019 58%, #33202a 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: y, background: 'linear-gradient(180deg, #4c3826 0%, #241a14 62%, #120c10 100%)' }}
      />
      <div className="absolute inset-x-0 h-[3px]" style={{ top: y, background: '#7d5e3f' }} />
      {/* Two lamps off the back wall, so the fighters are lit from behind and
          keep an edge against it. */}
      {[18, 82].map((x) => (
        <div
          key={x}
          className="arena-torch absolute"
          style={{
            left: `${x}%`,
            top: y,
            width: 190,
            height: 190,
            marginLeft: -95,
            marginTop: -150,
            background: 'radial-gradient(circle, rgba(255,168,84,0.32), transparent 66%)',
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 66%, transparent 28%, rgba(0,0,0,0.78) 100%)' }} />
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

/**
 * The dark each fighter stands in.
 *
 * Two sprites on a coloured band read as two sprites in front of a wall. A
 * shadow pooled under the feet is the whole difference between that and two
 * fighters standing on a floor, and it is one element each.
 */
function Shade({ w }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{
        bottom: -w * 0.03,
        width: w * 0.8,
        height: w * 0.16,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.62), transparent 70%)',
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
  // Health and damage both come off the campaign state now: a boss owns a
  // level bracket, and its pool is the XP that bracket costs.
  const c = campaignState(p, state.campaign)
  const spent = state.campaign.lastFightDay === todayKey()

  const worn = useMemo(() => wornGear(p), [p])
  const me = fightPower(p, state.log)
  const odds = fightOdds(p, state.log, boss, c.hp, c.damage)
  const startBossHp = Math.max(1, c.hp - c.damage)

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

  // How big the two of them are, measured off the whole screen rather than off
  // the stage — the stage's own height is derived from this, and a stage that
  // sized the fighters that sized the stage would chase its own tail.
  //
  // Budgeted on the FRAME, not on the drawing: the hero is 32 pixels of ink in
  // a 44-wide frame, so sizing off how big he looks put a third of him past the
  // edge of the screen.
  const shell = useRef(null)
  const [box, setBox] = useState({ w: 375, h: 812 })
  useLayoutEffect(() => {
    const el = shell.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setBox({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fighter = Math.round(Math.max(110, Math.min(box.w * 0.58, box.h * 0.42, 320)))
  // The boss gets the full box. At 0.86 the thing the whole campaign is
  // about stood shorter than the person fighting it.
  const bossBox = fighter
  // The stage is a band, not a hall. Left to fill the screen it put a storey of
  // empty dark over their heads; capped against their height and centred in
  // what is left, the two of them fill the frame and the rest reads as the
  // letterbox on an arcade cabinet.
  const stageH = Math.round(fighter * 2.3)

  const skip = () => {
    setStep(beats.length - 1)
    setPhase('done')
  }

  const start = () => {
    setFight(resolveFight(p, state.log, boss, c.hp, c.damage))
    setStep(0)
    setPhase('fighting')
  }

  return createPortal(
    <div ref={shell} className="fixed inset-0 z-[200] flex flex-col" style={{ background: DECK.ink, color: '#ffeccd' }}>
      {/* ---------------------------------------------------------- the crown */}
      <div
        className="flex items-center gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))] pb-2 shrink-0"
        style={{ background: DECK.panel, boxShadow: `inset 0 -1px 0 0 ${DECK.edge}` }}
      >
        <span
          className="font-display text-[16px]"
          style={{ color: over ? (fight.won ? DECK.mine : DECK.theirs) : tone }}
        >
          {over ? (fight.won ? 'VICTORY' : 'DEFEATED') : 'THE ARENA'}
        </span>
        <div className="flex-1" />
        {live ? (
          <button
            onClick={skip}
            className="press font-display text-[12px] min-h-[44px] px-2"
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
      <div className="relative flex-1 min-h-0 my-auto w-full overflow-hidden" style={{ maxHeight: stageH }}>
        <div className={`absolute inset-0 ${heroHit || bossHit ? 'arena-jolt' : ''}`}>
          <Stage />
        </div>

        {/* Squared up in the middle of the floor, close enough to reach each
            other. Pushed out to the two edges they read as two menu icons on
            either side of an empty room. */}
        <div className="absolute inset-x-0 bottom-[12%] flex items-end justify-center">
          <div className="relative">
            <Shade w={fighter * 0.75} />
            <div className={heroHit ? 'arena-hurt' : bossHit ? 'arena-attack-r' : heroDown ? 'arena-fall' : 'arena-idle'}>
              <HeroView av={p.avatar} equipped={worn} height={fighter} />
            </div>
            {bossHit && <Dust key={`dh${step}`} side="right" />}
            {heroHit && <Spark seed={`s${step}`} color={DECK.theirs} side="right" />}
            {heroHit && (
              <span
                key={`h${step}`}
                className="arena-pop absolute left-1/2 -translate-x-1/2 -top-2 font-display text-[26px]"
                style={{ color: DECK.hit, textShadow: '0 2px 0 #12090f, 0 0 14px rgba(255,93,122,0.8)' }}
              >
                -{beat.dmg}
              </span>
            )}
          </div>

          {/* Pulled in over the hero's frame, which carries six blank columns
              down each side — squared up on the frames they stood a body apart
              and neither of them could reach the other. */}
          <div className="relative" style={{ marginLeft: -Math.round(fighter * 0.12) }}>
            <Shade w={bossBox} />
            <div className={bossHit ? 'arena-hurt' : heroHit ? 'arena-attack-l' : bossDown ? 'arena-fall' : 'float-soft'}>
              <BossArt sprite={boss.sprite} size={bossBox} />
            </div>
            {heroHit && <Dust key={`db${step}`} side="left" />}
            {bossHit && <Spark seed={`s${step}`} color={DECK.land} side="left" />}
            {bossHit && (
              <span
                key={`b${step}`}
                className="arena-pop absolute left-1/2 -translate-x-1/2 -top-2 font-display text-[26px]"
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
            className="arena-slam absolute left-1/2 top-[38%] font-display text-[38px] pointer-events-none"
            style={{ color: '#ffd166', textShadow: '0 4px 0 #12090f, 0 0 30px rgba(255,209,102,0.8)' }}
          >
            FIGHT
          </span>
        )}
        {live && step > 0 && (
          <span
            key={round}
            className="arena-banner absolute left-1/2 -translate-x-1/2 top-2 font-display text-[13px] px-2.5 py-1 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#ffd166', boxShadow: `inset 0 0 0 1px ${DECK.edge}` }}
          >
            ROUND {round} / {fight.rounds.length}
          </span>
        )}
        {over && (
          <span
            className="arena-slam absolute left-1/2 top-[36%] font-display text-[34px] pointer-events-none"
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
              {/* The swing in the boss's own units, not the raw attack stat:
                  what you want to know standing here is how many of these it
                  takes, and the bar behind it is measured in these. */}
              <Stat label="PER HIT" value={fmtFull(swingFor(p, state.log, boss, c.hp))} tone={DECK.mine} />
              <Stat
                label="ODDS"
                value={odds > 0.75 ? 'FAVOURED' : odds > 0.45 ? 'EVEN' : odds > 0.2 ? 'AGAINST' : 'HOPELESS'}
                tone={odds > 0.6 ? DECK.mine : odds > 0.3 ? '#ffd166' : DECK.theirs}
              />
            </div>

            <p className="text-[14px] mt-2.5 leading-snug" style={{ color: 'rgba(255,236,205,0.66)' }}>
              {me.form.sessions === 0
                ? 'Nothing logged in seven days. You walk in cold — every swing is at half strength.'
                : `${me.form.sessions} ${me.form.sessions === 1 ? 'session' : 'sessions'} behind you this week, and the kit you have on. Both go into every swing.`}
            </p>

            {spent ? (
              <div className="mt-3 p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.4)', boxShadow: `inset 0 0 0 1px ${DECK.edge}` }}>
                <div className="font-display text-[13px]" style={{ color: '#ffd166' }}>
                  Already fought today
                </div>
                <div className="text-[14px] mt-1.5" style={{ color: 'rgba(255,236,205,0.66)' }}>
                  One trip a day. Go and train — it is what the next one is made of.
                </div>
              </div>
            ) : (
              <Btn full variant="danger" className="mt-3 motion-own" onClick={start}>
                Step in
              </Btn>
            )}
          </div>
        )}

        {over && (
          <div className="stack-in">
            <div className="p-2.5" style={{ background: 'rgba(0,0,0,0.4)', boxShadow: `inset 0 0 0 1px ${fight.won ? DECK.mine : DECK.theirs}` }}>
              <div className="font-display text-[13px]" style={{ color: fight.won ? DECK.mine : DECK.theirs }}>
                {fight.won ? `${boss.name} IS DOWN` : 'IT IS STILL STANDING'}
              </div>
              <div className="text-[14px] mt-1.5 leading-snug" style={{ color: 'rgba(255,236,205,0.7)' }}>
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
              Leave the arena
            </Btn>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
