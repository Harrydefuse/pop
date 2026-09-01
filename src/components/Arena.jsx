import { useEffect, useRef, useState } from 'react'
import { Bar, Btn, Chip, Modal } from './ui'
import { BossArt, HeroView } from './Sprites'
import { useGame } from '../game/useGame'
import { fightOdds, fightPower, fmtFull, resolveFight, todayKey } from '../game/engine'
import { alpha } from '../game/color'

/**
 * Where the campaign is actually decided.
 *
 * Logging sessions wears a boss down between visits, which is the grind. This
 * is the other half: you walk in, you swing six times, and you can lose. What
 * decides it is the week you have just had and the kit you chose to wear — both
 * things the player owns, neither of them a number they can fake.
 *
 * A loss still lands its damage. Losing costs you the kill and the day's
 * attempt, not the progress, because a system that can take an afternoon away
 * from someone who trained is a system they stop opening.
 */

const BEAT_MS = 900

function Stat({ label, value, tone }) {
  return (
    <div className="flex-1 border border-line bg-panel-2 px-2 py-1.5 text-center">
      <div className="font-pixel text-[6px] text-ink-faint">{label}</div>
      <div className="font-pixel text-[9px] mt-1" style={{ color: tone ?? 'var(--color-ink)' }}>
        {value}
      </div>
    </div>
  )
}

/** One combatant's health, falling as the rounds play. */
function Health({ label, hp, max, color, children }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-pixel text-[7px] truncate" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">{fmtFull(Math.max(0, Math.round(hp)))}</span>
      </div>
      <Bar pct={Math.max(0, hp) / Math.max(1, max)} color={color} height={8} />
      {children}
    </div>
  )
}

export default function Arena({ boss, onClose }) {
  const { state, battle } = useGame()
  const p = state.player
  const damage = state.campaign.damage
  const spent = state.campaign.lastFightDay === todayKey()

  const me = fightPower(p, state.log)
  const odds = fightOdds(p, state.log, boss, damage)
  const startBossHp = Math.max(1, boss.hp - damage)

  // 'ready' -> 'swinging' -> 'done'. The result is rolled once, up front, so
  // what plays out on screen is the thing that gets applied — an animation that
  // re-rolls is a different fight from the one the player watched.
  const [phase, setPhase] = useState('ready')
  const [fight, setFight] = useState(null)
  const [beat, setBeat] = useState(0)
  const applied = useRef(false)

  useEffect(() => {
    if (phase !== 'swinging' || !fight) return
    if (beat >= fight.rounds.length) {
      const t = setTimeout(() => setPhase('done'), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setBeat((b) => b + 1), BEAT_MS)
    return () => clearTimeout(t)
  }, [phase, beat, fight])

  // Applied at the end rather than at the start, so the boss on screen does not
  // die before the last blow lands.
  useEffect(() => {
    if (phase !== 'done' || !fight || applied.current) return
    applied.current = true
    battle({ dealt: fight.dealt, won: fight.won })
  }, [phase, fight, battle])

  const shown = fight ? fight.rounds.slice(0, beat) : []
  const last = shown[shown.length - 1]
  const bossHp = last ? last.bossHp : startBossHp
  const myHp = last ? last.myHp : me.hp
  const over = phase === 'done'

  return (
    <Modal
      open
      onClose={phase === 'swinging' ? undefined : onClose}
      title={over ? (fight.won ? 'VICTORY' : 'DEFEATED') : 'THE ARENA'}
      accent={over ? (fight.won ? 'var(--color-lime)' : 'var(--color-danger)') : 'var(--color-danger)'}
    >
      {/* --------------------------------------------------------- the floor */}
      <div
        className="relative flex items-end justify-between gap-2 px-2 pt-2 pb-3 border"
        style={{ borderColor: 'var(--color-line)', background: alpha('#be123c', 8) }}
      >
        <HeroView av={p.avatar} equipped={p.equipped} height={112} />
        <div className="font-pixel text-[9px] text-danger pb-8 shrink-0">VS</div>
        <BossArt sprite={boss.sprite} size={104} className={phase === 'swinging' ? 'float-soft' : ''} />

        {/* The blow for this beat, over the top of whoever took it. */}
        {last && phase === 'swinging' && (
          <>
            <span
              key={`m${beat}`}
              className="absolute right-6 top-2 font-pixel text-[11px] text-lime"
              style={{ textShadow: '0 2px 0 var(--color-panel)' }}
            >
              -{last.mine}
            </span>
            {last.theirs > 0 && (
              <span
                key={`t${beat}`}
                className="absolute left-6 top-8 font-pixel text-[11px] text-danger"
                style={{ textShadow: '0 2px 0 var(--color-panel)' }}
              >
                -{last.theirs}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3 mt-3">
        <Health label={(p.name || 'YOU').toUpperCase()} hp={myHp} max={me.hp} color="var(--color-lime)" />
        <Health label={boss.name} hp={bossHp} max={startBossHp} color="var(--color-danger)" />
      </div>

      {/* ------------------------------------------------------ before you go */}
      {phase === 'ready' && (
        <>
          <div className="flex gap-1.5 mt-3.5">
            <Stat label="FORM" value={me.form.label} tone={me.form.color} />
            <Stat label="GEAR" value={me.gear} tone="var(--color-neon)" />
            <Stat label="PER HIT" value={me.attack} tone="var(--color-lime)" />
          </div>

          <div className="mt-3 border border-line bg-panel-2 p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="font-pixel text-[7px] text-ink-faint">HOW IT LOOKS</span>
              <span
                className="font-pixel text-[9px]"
                style={{ color: odds > 0.6 ? 'var(--color-lime)' : odds > 0.3 ? 'var(--color-gold)' : 'var(--color-danger)' }}
              >
                {odds > 0.75 ? 'FAVOURED' : odds > 0.45 ? 'EVEN' : odds > 0.2 ? 'AGAINST YOU' : 'HOPELESS'}
              </span>
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              {me.form.sessions === 0
                ? 'Nothing logged in seven days. You are walking in cold — train first and come back.'
                : `${me.form.sessions} ${me.form.sessions === 1 ? 'session' : 'sessions'} this week, and the kit you have on. Both go into every swing.`}
            </div>
          </div>

          {spent ? (
            <div className="mt-3 border border-line bg-panel-2 p-2.5 text-center">
              <div className="font-pixel text-[8px] text-gold">ALREADY FOUGHT TODAY</div>
              <div className="text-[11px] text-ink-dim mt-1.5">
                One trip a day. Go and train — it is what the next one is made of.
              </div>
            </div>
          ) : (
            <Btn
              full
              variant="danger"
              className="mt-3"
              onClick={() => {
                setFight(resolveFight(p, state.log, boss, damage))
                setBeat(0)
                setPhase('swinging')
              }}
            >
              STEP IN
            </Btn>
          )}
        </>
      )}

      {/* ------------------------------------------------------- and after it */}
      {phase === 'swinging' && (
        <div className="font-pixel text-[8px] text-ink-faint text-center mt-4">
          ROUND {Math.min(beat + 1, fight.rounds.length)} / {fight.rounds.length}
        </div>
      )}

      {over && (
        <>
          <div className="mt-3.5 border p-2.5" style={{ borderColor: fight.won ? 'var(--color-lime)' : 'var(--color-danger)' }}>
            <div className="font-pixel text-[8px]" style={{ color: fight.won ? 'var(--color-lime)' : 'var(--color-danger)' }}>
              {fight.won ? `${boss.name} IS DOWN` : 'IT IS STILL STANDING'}
            </div>
            <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">
              {fight.won
                ? 'The road opens. Whatever it was carrying is yours.'
                : `${
                    fight.rounds[fight.rounds.length - 1]?.myHp <= 0
                      ? `It put you down after ${fight.rounds.length} ${fight.rounds.length === 1 ? 'round' : 'rounds'}, but not before you took ${fmtFull(fight.dealt)} off it.`
                      : `Six rounds and ${fmtFull(fight.dealt)} off it, and it is still on its feet.`
                  } That damage stays — come back tomorrow with a better week behind you.`}
            </div>
          </div>
          <div className="flex gap-1.5 mt-3">
            <Chip color="var(--color-danger)">{fmtFull(fight.dealt)} DEALT</Chip>
            <Chip color={fight.form.color}>{fight.form.label}</Chip>
            <Chip color="var(--color-neon)">GEAR {fight.gear}</Chip>
          </div>
          <Btn full className="mt-3" onClick={onClose}>
            LEAVE THE ARENA
          </Btn>
        </>
      )}
    </Modal>
  )
}
