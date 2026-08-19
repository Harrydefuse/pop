import { useEffect, useMemo, useRef, useState } from 'react'
import { Btn, Chip, Modal } from './ui'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { DAILY_CHEST, STATS } from '../game/config'
import { BOSS } from '../game/data'
import {
  balanceRatio,
  balanceVerdict,
  classById,
  fmt,
  nextStreakTier,
  powerScore,
  rankFor,
  slotById,
  statLevel,
} from '../game/engine'

/**
 * AXIS is the in-app coach. It is deliberately a rules engine over your own
 * save file rather than a chat model: every answer it gives can be traced to a
 * number on your character sheet, which is what makes it trustworthy advice
 * rather than generic fitness copy.
 */
function answer(q, state) {
  const p = state.player
  const text = q.toLowerCase()
  const cls = classById(p.classId)
  const ranked = STATS.map((s) => ({ ...s, lv: statLevel(p.stats[s.key]) })).sort((a, b) => a.lv - b.lv)
  const weakest = ranked[0]
  const strongest = ranked[ranked.length - 1]
  const openQuests = state.dailies.filter((d) => !d.done)
  const ratio = balanceRatio(p.week.activeMinutes, p.week.gamingHours)
  const verdict = balanceVerdict(ratio)
  const { rank, next } = rankFor(powerScore(p))
  const streakNext = nextStreakTier(p.streak)

  if (/task|daily|today|three|slot/.test(text)) {
    return `Three a day, and only three.\n\nACTIVE — 20 minutes of anything active, a walk counts. This is the one that unlocks your chest.\nAIM — 20 minutes on an aim trainer or a VOD review.\nRECOVER — a gym session, some mobility, or a proper sleep.\n\nYou have ${3 - openQuests.length} of 3 done.`
  }

  if (/train|workout|session|what should i do|weakest/.test(text)) {
    const suggestion =
      weakest.key === 'STR'
        ? 'a 40-minute lifting session — 5×5 on a squat or press variation'
        : weakest.key === 'END'
          ? 'an easy 5 km. Conversational pace, not a time trial'
          : weakest.key === 'AGI'
            ? '20 minutes of intervals — 8 × 30s hard, 90s easy'
            : weakest.key === 'VIT'
              ? '20 minutes of mobility and an early night — your recovery stat is the one dragging'
              : '20 minutes of aim training and a walk. Focus climbs on consistency, not intensity'
    const openNames = openQuests.map((d) => slotById(d.id).name).join(' and ')
    return `Your weakest stat is ${weakest.key} at level ${weakest.lv}, against ${strongest.key} at ${strongest.lv}. Today I would do ${suggestion}.\n\nYour ${cls.name} passive is "${cls.passive.label}", so that is where your XP goes furthest.${openQuests.length ? `\n\nStill open today: ${openNames}. ACTIVE is the one that unlocks your chest.` : '\n\nAll three done today. Nothing left to chase.'}`
  }

  if (/rank|climb|power|leaderboard/.test(text)) {
    return next
      ? `You are ${rank.name} with ${fmt(powerScore(p))} power. ${fmt(next.min - powerScore(p))} more gets you ${next.name}.\n\nFastest levers, in order: upgrade the gear you already have (cheaper than chasing drops), keep the streak alive for the multiplier, and put sessions into ${weakest.key} — low stat levels are the cheapest to raise.`
      : `You are ${rank.name}. There is nothing above this. Go help someone else climb.`
  }

  if (/gam|balance|too much|screen|hours/.test(text)) {
    return `This week: ${Math.round(p.week.activeMinutes)} active minutes against ${p.week.gamingHours} hours in game. That reads ${verdict.label}.\n\n${verdict.note}. For the record, LVL100 never asks you to play less — the balanced band is roughly 30 to 70 active minutes per gaming hour. Stack a session before your queue and the ratio fixes itself.`
  }

  if (/chest|reward|loot|open|pull|drop/.test(text)) {
    const ready = state.chest.unlocked && !state.chest.openedToday
    return `${ready ? "Today's chest is unlocked and waiting." : state.chest.openedToday ? 'You already opened today\u2019s chest — a fresh one lands tomorrow.' : 'No chest yet. Finish ACTIVE — 20 minutes of anything — and it unlocks.'}\n\nOne chest a day, ${DAILY_CHEST.rolls} pulls, and every pull can roll anything: 60% common, 25% uncommon, 10% rare, 4% epic, 1% legendary. Those odds are identical on day one and day five hundred, and nothing you can buy changes them.`
  }

  if (/streak|miss|shield|skip/.test(text)) {
    return `${p.streak} days. ${streakNext ? `${streakNext.days - p.streak} more for ×${streakNext.mult.toFixed(2)} XP.` : 'You are at the top multiplier.'}\n\nYou have ${p.shields} streak shield. It auto-spends on your first missed day, so an illness or a travel day does not erase months. Do not hoard it — that is what it is for.`
  }

  if (/boss|raid|titan|event/.test(text)) {
    return `${BOSS.name} is at ${((state.world.bossKm / BOSS.goalKm) * 100).toFixed(1)}% and you have contributed ${p.lifetime.bossKm} km.\n\nOnly verified distance counts toward it. Runs are worth the most per kilometre, rides about a third. The last community tier is a pet nobody can get again after the season closes.`
  }

  if (/stone|gauntlet|infinity/.test(text)) {
    return 'The six stones are the long game: 100,000 kg lifted, 1,000 km covered, 300 verified sessions, 100 friend challenges, a 365-day streak, and 200 balanced days.\n\nNone of them can be rushed and none can be bought. Pick the one nearest completion and let the rest accumulate in the background.'
  }

  if (/aim|warm ?up|valorant|ranked|queue/.test(text)) {
    return 'Fifteen minutes, in this order: wrist and shoulder circles, 2 minutes of light cardio to get your heart rate up, then 8 minutes of tracking and flicks, then 5 minutes of deathmatch without looking at the scoreboard.\n\nThe cardio is not filler — going into your first ranked game already warm is worth more than another 20 minutes of gridshot.'
  }

  if (/pet|companion|evolve/.test(text)) {
    return 'Pets take 40% of every session XP you earn and cannot pass your own level. Rarity sets how big the stat buff is; level sets how fast it grows.\n\nRun the pet whose stat you are actively training, not the rarest one you own — an uncommon on the stat you use beats a legendary sat idle.'
  }

  if (/hurt|pain|injur|sore|tired/.test(text)) {
    return 'Sore is normal, sharp is not. If something is sharp, joint-located, or worse the day after, skip it and log mobility instead — that still keeps your streak going.\n\nI am a rules engine reading your save file, not a clinician. Anything that persists past a week is a physio question, not an app question.'
  }

  return `I read your character sheet, so ask me something it can answer. Right now: level ${p.level}, ${rank.name}, ${p.streak}-day streak, weakest stat ${weakest.key}, ${openQuests.length} of 3 tasks left, balance ${verdict.label.toLowerCase()}.\n\nTry "what should I train today", "how do I rank up", "am I gaming too much", or "explain the chest".`
}

const PROMPTS = ['What should I train today?', "What are today's three?", 'How do I rank up?', 'Explain the chest']

export default function Axis({ open, onClose }) {
  const { state } = useGame()
  const [messages, setMessages] = useState([
    {
      from: 'axis',
      text: 'AXIS online. I read your save file — streak, stats, gear, balance — and answer from it. No guessing.',
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, open])

  const send = (text) => {
    const q = text.trim()
    if (!q) return
    setMessages((m) => [...m, { from: 'me', text: q }, { from: 'axis', text: answer(q, state) }])
    setInput('')
  }

  const stats = useMemo(() => {
    const { rank } = rankFor(powerScore(state.player))
    return `LV ${state.player.level} · ${rank.name} · ${state.player.streak}d streak`
  }, [state.player])

  return (
    <Modal open={open} onClose={onClose} title="AXIS · COACH" accent="var(--color-cyan)" wide>
      <div className="font-mono text-[10px] text-ink-faint border-b border-line pb-2.5 mb-3">{stats}</div>

      <div className="space-y-2.5 max-h-[46vh] overflow-y-auto scroll-thin pr-1">
        {messages.map((m, i) => (
          <div key={i} className={m.from === 'me' ? 'flex justify-end' : 'flex gap-2'}>
            {m.from === 'axis' && (
              <span className="shrink-0 mt-0.5">
                <Icon name="spark" size={12} color="var(--color-cyan)" />
              </span>
            )}
            <div
              className="text-[12px] leading-relaxed whitespace-pre-line border p-2.5 max-w-[85%]"
              style={{
                borderColor: m.from === 'me' ? 'var(--color-neon)' : 'var(--color-line)',
                background: m.from === 'me' ? 'rgba(168,85,247,0.12)' : 'var(--color-panel-2)',
                color: m.from === 'me' ? 'var(--color-ink)' : 'var(--color-ink-dim)',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => send(p)}>
            <Chip color="var(--color-cyan)">{p}</Chip>
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AXIS…"
          className="flex-1 min-w-0 bg-panel-2 border border-line p-2.5 text-[12px] text-ink placeholder:text-ink-faint focus:border-cyan outline-none"
        />
        <Btn variant="cyan" type="submit" disabled={!input.trim()}>
          SEND
        </Btn>
      </form>
    </Modal>
  )
}
