import { useEffect, useRef, useState } from 'react'
import { Btn } from './ui'
import PixelSprite from './PixelSprite'
import { ChestArt } from './Sprites'
import { armourSprite } from '../game/sprites'
import { FOUNDER_GIFT, RARITY } from '../game/config'
import { useGame } from '../game/useGame'

const GOLD = '#f2ca55'
const CONFETTI_COLOURS = ['#f2ca55', '#c08a1c', '#a855f7', '#22d3ee', '#4ade80', '#f43f5e', '#ffffff']

/**
 * Paper confetti. The scatter is generated once in a lazy initialiser rather
 * than useMemo, which only caches — this is guaranteed to run a single time, so
 * a re-render can never reshuffle bits mid-fall.
 */
function Confetti({ count = 34 }) {
  const [bits] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${4 + Math.random() * 92}%`,
      dx: `${(Math.random() - 0.5) * 130}px`,
      spin: `${400 + Math.random() * 700}deg`,
      dur: `${1.7 + Math.random() * 1.4}s`,
      delay: `${Math.random() * 700}ms`,
      colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      w: 3 + Math.round(Math.random() * 3),
      h: 5 + Math.round(Math.random() * 5),
    })),
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.id}
          className="confetti absolute top-0"
          style={{
            left: b.left,
            width: b.w,
            height: b.h,
            background: b.colour,
            '--dx': b.dx,
            '--spin': b.spin,
            '--dur': b.dur,
            '--delay': b.delay,
          }}
        />
      ))}
    </div>
  )
}

/**
 * The one moment in the app allowed to be loud. It runs in three beats — the
 * chest rattles, it bursts, the armour rises and keeps turning — because a
 * reward that appears instantly does not feel like it was worth waiting for.
 */
export default function GiftReveal({ onClose }) {
  const { openGift } = useGame()
  const [phase, setPhase] = useState('chest')
  const claimed = useRef(false)

  useEffect(() => {
    if (phase !== 'opening') return
    const t = setTimeout(() => {
      if (!claimed.current) {
        claimed.current = true
        openGift()
      }
      setPhase('revealed')
    }, 1050)
    return () => clearTimeout(t)
  }, [phase, openGift])

  const accent = RARITY.legendary.color

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <button
        aria-label="Close"
        onClick={phase === 'revealed' ? onClose : undefined}
        className="absolute inset-0 bg-[#05030a]/92 backdrop-blur-[2px] cursor-default"
      />

      <div className="relative w-full max-w-[340px] m-3 p-5 border bg-panel text-center" style={{ borderColor: accent, boxShadow: `0 0 60px -14px ${accent}` }}>
        {phase === 'revealed' && <Confetti />}

        <div className="font-pixel text-[8px]" style={{ color: accent }}>
          {phase === 'revealed' ? 'BETA FOUNDER' : 'A GIFT IS WAITING'}
        </div>

        <div className="relative grid place-items-center h-[168px] my-3">
          {/* halo behind whatever is on stage */}
          <span
            className="halo absolute w-[150px] h-[150px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${GOLD}55, transparent 68%)`, filter: 'blur(6px)' }}
            aria-hidden="true"
          />

          {phase !== 'revealed' ? (
            <div className={phase === 'opening' ? 'chest-rattle relative' : 'gift-bob relative'}>
              <ChestArt size={104} />
              {phase === 'opening' && (
                <span
                  className="burst absolute inset-0 m-auto w-[104px] h-[104px] rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, #fff, ${GOLD} 45%, transparent 70%)` }}
                  aria-hidden="true"
                />
              )}
            </div>
          ) : (
            <div className="loot-rise relative">
              <div className="loot-spin relative overflow-hidden">
                <PixelSprite sprite={armourSprite('founderChest')} size={128} />
                {/* A soft gloss rather than a white bar — a hard-edged line drawn
                    over pixel art reads as a defect, not a highlight. */}
                <span
                  className="shine-sweep absolute top-0 left-0 h-full w-[52px] pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, #fff6d880, transparent)' }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}
        </div>

        {phase === 'revealed' ? (
          <>
            <div className="font-pixel text-[12px]" style={{ color: accent }}>
              {FOUNDER_GIFT.name.toUpperCase()}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <span className="font-pixel text-[7px] px-1.5 py-1 border" style={{ color: accent, borderColor: accent }}>
                LEGENDARY
              </span>
              <span className="text-[11px] text-ink-faint">Chest</span>
            </div>
            <div className="flex items-center justify-center gap-3 mt-3">
              {Object.entries(FOUNDER_GIFT.stats).map(([k, v]) => (
                <span key={k} className="font-mono text-[12px] text-lime">
                  +{v} {k}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-ink-dim mt-3 leading-relaxed">{FOUNDER_GIFT.blurb}</p>
            <Btn full className="mt-4" onClick={onClose} style={{ background: accent, borderColor: accent, color: '#12081f' }}>
              PUT IT ON
            </Btn>
          </>
        ) : (
          <>
            <p className="text-[12px] text-ink-dim leading-relaxed">
              You signed up while LVL100 was still being built. This one is only going to beta players, and then never
              again.
            </p>
            <Btn
              full
              variant="gold"
              className="mt-4"
              disabled={phase === 'opening'}
              onClick={() => setPhase('opening')}
            >
              {phase === 'opening' ? 'OPENING…' : 'OPEN IT'}
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}
