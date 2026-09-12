/**
 * Your profile, as something you can hand to someone.
 *
 * There is no server, so there is no follow button that could possibly work —
 * a friend list needs somewhere both people can read from, and this app has
 * nowhere. What it does have is the thing that makes a follow worth having:
 * a card with your character, your bests and your week on it.
 *
 * So a friend is a card you were given. You send yours, they paste it, and it
 * sits in their app until you send them a newer one. That is genuinely less
 * than Strava's follow, and it is stated plainly everywhere it appears rather
 * than dressed up as a live feed. When there is a backend, this same card is
 * what it would be syncing.
 */

import { powerScore, rankFor, classById, streakTier } from './engine'
import { pinnedEfforts } from './efforts'
import { weekSeries } from './progress'

const MAGIC = 'LVL100.CARD.1|'

/** How much of a week the card carries: this one, from the folded weeks. */
function thisWeek(weeks = []) {
  const series = weekSeries(weeks, 1)
  const w = series[series.length - 1] ?? { sessions: 0, minutes: 0, km: 0, volume: 0 }
  return {
    sessions: w.sessions ?? 0,
    minutes: Math.round(w.minutes ?? 0),
    km: Math.round((w.km ?? 0) * 10) / 10,
    volume: Math.round(w.volume ?? 0),
  }
}

/**
 * Everything on the card, and deliberately nothing else.
 *
 * No log, no routes, no map. A profile is what you are choosing to show, and
 * a code that quietly carried every place you have been for the last quarter
 * would be a tracking device you handed out at parties.
 */
export function buildCard(state) {
  const p = state.player
  const power = powerScore(p)
  return {
    v: 1,
    at: Date.now(),
    name: p.name,
    handle: p.handle,
    avatar: p.avatar,
    classId: p.classId,
    level: p.level,
    power,
    rank: rankFor(power).rank.name,
    streak: p.streak,
    week: thisWeek(state.weeks),
    // Only the three they pinned. The rest of the board is nobody's business.
    efforts: pinnedEfforts(state.bests ?? {}, p.efforts ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      value: e.value,
      unit: e.unit,
    })),
    // What is on the body, for the part of this that is showing off.
    worn: Object.entries(p.equipped ?? {})
      .map(([slot, id]) => {
        const item = p.inventory?.find((i) => i.id === id)
        return item ? { slot, kind: item.kind, rarity: item.rarity, level: item.level ?? 1 } : null
      })
      .filter(Boolean),
    pet: (() => {
      const pet = p.pets?.find((x) => x.id === p.activePetId)
      return pet ? { name: pet.name, ref: pet.ref, level: pet.level, rarity: pet.rarity } : null
    })(),
  }
}

export function encodeCard(card) {
  const bytes = new TextEncoder().encode(JSON.stringify(card))
  return MAGIC + btoa(String.fromCharCode(...bytes))
}

/** A card back out of a code, or null. Never throws at the person pasting. */
export function decodeCard(code) {
  const trimmed = String(code ?? '').trim().replace(/\s+/g, '')
  const cut = trimmed.indexOf('|')
  if (!trimmed.startsWith('LVL100.CARD') || cut < 0) return null
  try {
    const bytes = Uint8Array.from(atob(trimmed.slice(cut + 1)), (c) => c.charCodeAt(0))
    const card = JSON.parse(new TextDecoder().decode(bytes))
    if (!card?.name || typeof card.level !== 'number') return null
    return card
  } catch {
    return null
  }
}

/** The line under a friend's name: what they are and how far in. */
export function cardTitle(card) {
  const cls = classById(card.classId)
  return `${cls.name} · ${card.rank ?? 'Unranked'}`
}

/** How stale a card is, said the way a person would say it. */
export function cardAge(card, now = Date.now()) {
  const days = Math.floor((now - (card.at ?? now)) / 86400000)
  if (days <= 0) return 'sent today'
  if (days === 1) return 'sent yesterday'
  if (days < 14) return `sent ${days}d ago`
  if (days < 60) return `sent ${Math.round(days / 7)}w ago`
  return `sent ${Math.round(days / 30)}mo ago`
}

/**
 * You and your friends, ranked.
 *
 * By level rather than by power, because level only moves when you show up and
 * power can be bought with a lucky drop. A ladder that rewards turning up is
 * the kind that stays friendly.
 */
export function leaderboard(state, friends = []) {
  const me = { ...buildCard(state), me: true }
  return [me, ...friends]
    .sort((a, b) => b.level - a.level || b.power - a.power)
    .map((c, i) => ({ ...c, place: i + 1, tier: streakTier(c.streak ?? 0) }))
}
