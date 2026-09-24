/**
 * The progression maths, checked against answers worked out by hand.
 *
 * This is the first logic in the app with an exactly right answer rather than a
 * feel: an estimated one-rep max either matches the Epley formula or it does
 * not, and a personal best either fires on the right session or hands out XP
 * for turning up. Both of those are worth pinning down.
 *
 * Run:  node tools/progress.test.mjs
 */
import { createServer } from 'vite'

const server = await createServer({
  root: new URL('..', import.meta.url).pathname,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})
const { e1rm, newRecords, foldRecords, foldWeek, weekSeries, weekOverWeek, weekKey, weekStart, weekActivities, topSet, foldLastSets, lastPlan } =
  await server.ssrLoadModule('/src/game/progress.js')
// The real activity, not a stand-in: minutes are worked out from the activity's
// own minPerUnit, so a hand-made stub without one quietly folds zero minutes
// into every week and the test passes on nothing.
const { ACTIVITIES } = await server.ssrLoadModule('/src/game/config.js')
const { bestWindow, effortsIn, foldEfforts, effortsFromLog, readEffort, pinnedEfforts } =
  await server.ssrLoadModule('/src/game/efforts.js')
const { EXERCISES, searchExercises, muscleOf, muscleSplit, neglected, exerciseByName } =
  await server.ssrLoadModule('/src/game/exercises.js')
const { buildCard, encodeCard, decodeCard, leaderboard } = await server.ssrLoadModule('/src/game/profile.js')
const { baselineMinutes, coinsFor, rollMilestone, MILESTONES, bracketXp, campaignState, xpToNext, resolveFight, swingFor, fightPower, parAttack, bossHit, arenaLadder } =
  await server.ssrLoadModule('/src/game/engine.js')
const { ARENAS, arenaFor } = await server.ssrLoadModule('/src/game/arenas.js')
const { CAMPAIGN } = await server.ssrLoadModule('/src/game/campaign.js')
const { nextTarget, targetLabel, beatsRecord, plateLoad, planToday } =
  await server.ssrLoadModule('/src/game/coach.js')
const { SPLITS, GOALS, splitById, goalById, nextDay, recommend, todaysSession, prescription } =
  await server.ssrLoadModule('/src/game/splits.js')
const { setTotals, byLift } = await server.ssrLoadModule('/src/game/session.js')
const { MAX_LEVEL } = await server.ssrLoadModule('/src/game/config.js')
const { CATALOG, INITIAL_STATE } = await server.ssrLoadModule('/src/game/data.js')
const { reducer } = await server.ssrLoadModule('/src/game/store.jsx')
const { MAX_SHIELDS } = await server.ssrLoadModule('/src/game/config.js')
const { todayKey, dayKeyPlus } = await server.ssrLoadModule('/src/game/engine.js')
const { PILLARS, pillarOf, pillarWeek, pillarBest, pillarEmpty, keepsStreak, daysTrained, STREAK_MIN_MINUTES } =
  await server.ssrLoadModule('/src/game/pillars.js')
const { GAMES, playsAim } = await server.ssrLoadModule('/src/game/config.js')
const { petSprite, PET_SPRITES } = await server.ssrLoadModule('/src/game/sprites.js')
const { petStage, PET_STAGES, TREAT_PER_SESSION, feedPet, treatsToNext, petPct } =
  await server.ssrLoadModule('/src/game/engine.js')
const { RARITY_ORDER } = await server.ssrLoadModule('/src/game/config.js')
const gym = ACTIVITIES.find((a) => a.id === 'gym')

let fails = 0
const is = (label, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) return console.log('  ok   ' + label)
  fails++
  console.log(`  FAIL ${label}\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`)
}

console.log('\nestimated one-rep max')
is('a single is the weight itself', e1rm(1, 100), 100)
is('eight at eighty is 101.3', Math.round(e1rm(8, 80) * 10) / 10, 101.3)
is('a bodyweight set has no maximum', e1rm(12, 0), 0)
is('and neither does no reps', e1rm(0, 80), 0)

console.log('\nwhat counts as a personal best')
is('the first time you do a lift is not one', newRecords({}, [{ lift: 'Bench press', reps: 8, weight: 80 }]), [])
const board = foldRecords({}, [{ lift: 'Bench press', reps: 8, weight: 80 }], 1000)
is('though it does go on the board', Math.round(board['Bench press'].e1rm * 10) / 10, 101.3)
is('beating it is one', newRecords(board, [{ lift: 'Bench press', reps: 6, weight: 90 }]).map((r) => r.lift), ['Bench press'])
is('repeating it is not', newRecords(board, [{ lift: 'Bench press', reps: 8, weight: 80 }]), [])
is('and neither is a hundred grams more', newRecords(board, [{ lift: 'Bench press', reps: 8, weight: 80.1 }]), [])
is('a lift with no record yet is not', newRecords(board, [{ lift: 'Squat', reps: 5, weight: 200 }]), [])
is('bodyweight work can never be one', newRecords({ 'Pull-up': { e1rm: 0 } }, [{ lift: 'Pull-up', reps: 30, weight: 0 }]), [])
const lighter = foldRecords(board, [{ lift: 'Bench press', reps: 3, weight: 70 }], 2000)
is('an easy day does not lower the record', Math.round(lighter['Bench press'].e1rm * 10) / 10, 101.3)

console.log('\nwhat you did last time')
is('the top set is the heaviest, not the last',
  topSet([{ reps: 8, weight: 60 }, { reps: 6, weight: 80 }, { reps: 12, weight: 40 }]),
  { reps: 6, weight: 80 })
is('and on a tie, the one with more reps',
  topSet([{ reps: 5, weight: 80 }, { reps: 8, weight: 80 }]), { reps: 8, weight: 80 })
is('nothing lifted, nothing to repeat', topSet([]), null)
const lastA = foldLastSets({}, [
  { lift: 'Bench press', reps: 8, weight: 60 },
  { lift: 'Bench press', reps: 6, weight: 70 },
  { lift: 'Squat', reps: 5, weight: 100 },
], 5000)
is('each lift keeps its own sets', Object.keys(lastA).sort(), ['Bench press', 'Squat'])
is('in the order they were done', lastA['Bench press'].sets, [{ reps: 8, weight: 60 }, { reps: 6, weight: 70 }])
const lastB = foldLastSets(lastA, [{ lift: 'Squat', reps: 3, weight: 120 }], 9000)
is('a new session replaces that lift', lastB.Squat, { at: 9000, sets: [{ reps: 3, weight: 120 }] })
is('and leaves the lifts it did not touch', lastB['Bench press'].at, 5000)
is('a session with no sets changes nothing', foldLastSets(lastA, [], 9999), lastA)

console.log('\nthe weekly challenge')
const { challengeFor, challengeProgress, CHALLENGES } = await server.ssrLoadModule('/src/game/challenge.js')
is('the same week always draws the same challenge',
  challengeFor('2026-09-07').id, challengeFor('2026-09-07').id)
is('and it is one from the rota',
  CHALLENGES.some((c) => c.id === challengeFor('2026-09-07').id), true)
{
  // Spread the keys wide enough that a hash collapsing to one value shows up.
  const picked = new Set()
  for (let i = 1; i <= 40; i++) picked.add(challengeFor(`2026-01-${String(i).padStart(2, '0')}`).id)
  is('different weeks do not all draw the same one', picked.size > 1, true)
}
{
  const t = Date.now()
  const wk = weekKey(t)
  // Scored directly rather than through whichever one the hash draws — the
  // first version of this test happened to draw the only challenge that reads
  // the log, handed it an empty one, and reported a bug that was not there.
  const week = { key: wk, at: t - 3600_000, sessions: 9, minutes: 600, volume: 99000, km: 99, xp: 0 }
  const thisWeek = [{ at: t, activityId: 'run' }, { at: t, activityId: 'gym' },
                    { at: t, activityId: 'swim' }, { at: t, activityId: 'mobility' }]
  for (const c of CHALLENGES) {
    is(`${c.id}: a big week clears it`, c.of(week, thisWeek) >= c.goal, true)
    is(`${c.id}: an empty week does not`, c.of({ ...week, sessions: 0, minutes: 0, volume: 0, km: 0 }, []) >= c.goal, false)
  }
  is('sessions before this week do not count towards the spread',
    CHALLENGES.find((c) => c.id === 'spread').of(week, [{ at: t - 99 * 3600_000, activityId: 'run' }]), 0)

  const full = { weeks: [week], log: thisWeek }
  is('a week that clears its challenge is done', challengeProgress(full, t).done, true)
  is('and unclaimed until it is paid', challengeProgress(full, t).claimed, false)
  is('a claim on this week reads as claimed',
    challengeProgress({ ...full, challenge: { week: wk, claimed: true } }, t).claimed, true)
  is('a claim on last week does not',
    challengeProgress({ ...full, challenge: { week: '1999-01-04', claimed: true } }, t).claimed, false)
  is('an empty week is not done', challengeProgress({ weeks: [], log: [] }, t).done, false)
}

console.log('\nrepeating a session')
const gymLog = (at, lifts) => ({ at, activityId: 'gym', detail: { mode: 'strength', lifts: lifts.map((lift) => ({ lift })) } })
is('the most recent gym session is the one repeated',
  lastPlan([gymLog(300, ['Bench press', 'Squat']), gymLog(200, ['Deadlift'])]).lifts,
  ['Bench press', 'Squat'])
is('runs and walks are skipped',
  lastPlan([{ at: 400, activityId: 'run' }, gymLog(200, ['Deadlift'])]).lifts, ['Deadlift'])
is('a gym session that logged nothing is skipped',
  lastPlan([gymLog(400, []), gymLog(200, ['Squat'])]).lifts, ['Squat'])
is('and an empty log has nothing to repeat', lastPlan([]), null)

console.log('\nthe rolling weeks')
const act = gym
const now = Date.now()
let weeks = foldWeek([], { act, amount: 45, xp: 300, detail: { mode: 'strength', volume: 5000 } }, now)
weeks = foldWeek(weeks, { act, amount: 30, xp: 200, detail: { mode: 'strength', volume: 3000 } }, now)
is('two sessions land in the one week', [weeks.length, weeks[0].sessions, weeks[0].volume], [1, 2, 8000])
is('and their minutes add up', weeks[0].minutes, 75 * gym.minPerUnit)
weeks = foldWeek(weeks, { act, amount: 60, xp: 400, detail: null }, now - 7 * 24 * 3600 * 1000)
is('a different week gets its own row', weeks.length, 2)
is('and the newest is first', weeks[0].key, weekKey(now))
is('the series fills in the weeks you missed', weekSeries(weeks, 4).length, 4)
const wow = weekOverWeek(weeks, 'minutes')
is('this week is compared with last', [wow.now, wow.prev], [75 * gym.minPerUnit, 60 * gym.minPerUnit])
is('with nothing to compare to, no percentage', weekOverWeek([weeks[0]], 'minutes').pct, null)

console.log('\nbest efforts')
const KM = (s) => s * 1000
is('the quickest 5k inside a 10k is the one that counts',
  bestWindow([300, 300, 250, 250, 250, 250, 250, 300, 300, 300].map(KM), 5), KM(1250))
is('a window longer than the run has no answer', bestWindow([KM(300)], 5), null)
is('one kilometre is the fastest single split', bestWindow([320, 290, 310].map(KM), 1), KM(290))

const ran = { activityId: 'run', detail: { mode: 'distance', metres: 10200, splits: Array(10).fill(KM(300)) } }
const ranIds = effortsIn(ran).map((e) => e.id)
is('a 10k is evidence of a 1k, a 5k, a 10k and a longest',
  ranIds, ['run:d1', 'run:d5', 'run:d10', 'run:far'])
is('a swim is only measured at the distances swimmers use',
  effortsIn({ activityId: 'swim', detail: { mode: 'distance', metres: 2000, splits: [KM(1500), KM(1600)] } })
    .map((e) => e.id),
  ['swim:d1', 'swim:d2', 'swim:far'])
is('a set at an odd number of reps is not a mark anyone quotes',
  effortsIn({ activityId: 'gym', sets: [{ lift: 'Squat', reps: 7, weight: 100 }] }).length, 0)
is('a set at eight is', effortsIn({ activityId: 'gym', sets: [{ lift: 'Squat', reps: 8, weight: 100 }] })[0].id,
  'lift:Squat:8')

let bests = foldEfforts({}, ran, 1000)
is('the first of anything goes straight on the board', bests['run:d5'].value, KM(1500))
bests = foldEfforts(bests, { activityId: 'run', detail: { mode: 'distance', metres: 5100, splits: Array(5).fill(KM(280)) } }, 2000)
is('a quicker 5k replaces it', bests['run:d5'].value, KM(1400))
is('but the longer run is still the longest', bests['run:far'].value, 10200)
bests = foldEfforts(bests, { activityId: 'run', detail: { mode: 'distance', metres: 5100, splits: Array(5).fill(KM(320)) } }, 3000)
is('and a slower one changes nothing', [bests['run:d5'].value, bests['run:d5'].at], [KM(1400), 2000])

const seeded = effortsFromLog(
  [{ at: 500, activityId: 'run', detail: { mode: 'distance', metres: 5000, splits: Array(5).fill(KM(300)) } }],
  { Squat: { e1rm: 141, reps: 5, weight: 120, at: 700 } },
)
is('a board can be rebuilt out of a log', seeded['run:d5'].value, KM(1500))
is('and the record board fills in the lifts the log does not keep', seeded['lift:Squat:5'].value, 120)

is('a time reads as a time', readEffort('run:d5', { value: KM(1490) }).value, '24:50')
is('a long one grows an hour', readEffort('run:d10', { value: KM(3725) }).value, '1:02:05')
is('a distance reads in kilometres', readEffort('ride:far', { value: 42195 }).value, '42.2')
is('a lift reads in kilos', readEffort('lift:Bench press:8', { value: 80 }).name, 'Bench press × 8')

is('only what was pinned shows, and only if it exists',
  pinnedEfforts(bests, ['run:d5', 'run:nope', 'run:far']).map((e) => e.id), ['run:d5', 'run:far'])
is('and never more than three',
  pinnedEfforts(bests, ['run:d1', 'run:d5', 'run:d10', 'run:far']).length, 3)

console.log('\nthe exercise catalogue')
is('every name is unique', new Set(EXERCISES.map((e) => e.name)).size, EXERCISES.length)
is('every one of the old eighteen still resolves',
  ['Bench press', 'Squat', 'Deadlift', 'Overhead press', 'Barbell row', 'Pull-up', 'Dip', 'Lat pulldown',
   'Leg press', 'Romanian deadlift', 'Lunge', 'Hip thrust', 'Bicep curl', 'Tricep extension', 'Lateral raise',
   'Calf raise', 'Plank', 'Other'].filter((n) => !exerciseByName(n)), [])
is('a name match at the start beats one in the middle',
  searchExercises('press')[0].name.toLowerCase().startsWith('press') ||
    searchExercises('press').findIndex((e) => e.name === 'Leg press') >
      searchExercises('press').findIndex((e) => e.name === 'Bench press'),
  true)
is('searching the muscle finds the muscle', searchExercises('glute').every((e) => e.muscle === 'glutes' || /glute/i.test(e.name)), true)
is('searching the equipment finds the shelf', searchExercises('kettlebell').every((e) => e.gear === 'kettlebell' || /kettlebell/i.test(e.name)), true)
is('a custom exercise joins the list', searchExercises('zercher', { custom: [{ name: 'Zercher squat', muscle: 'legs', gear: 'barbell' }] })[0].name, 'Zercher squat')
is('and it will not shadow one already there', searchExercises('', { custom: [{ name: 'squat', muscle: 'core', gear: 'other' }] }).filter((e) => e.name.toLowerCase() === 'squat').length, 1)
is('an unknown lift still has a home', muscleOf('Something nobody has heard of'), 'full')

const day = 24 * 3600 * 1000
const strength = (at, lifts) => ({ at, detail: { mode: 'strength', lifts } })
const split = muscleSplit(
  [
    strength(Date.now() - day, [{ lift: 'Bench press', sets: 4 }, { lift: 'Squat', sets: 4 }]),
    strength(Date.now() - 3 * day, [{ lift: 'Deadlift', sets: 3 }]),
    strength(Date.now() - 90 * day, [{ lift: 'Bicep curl', sets: 9 }]),
  ],
  { days: 30 },
)
is('sets land under the muscle they train',
  Object.fromEntries(split.groups.filter((g) => g.sets).map((g) => [g.id, g.sets])),
  { chest: 4, back: 3, legs: 4 })
is('and a session from three months ago is not this month', split.total, 11)
is('the group that is behind gets named', neglected(split).id !== undefined, true)
is('with nothing logged there is nothing to say', neglected(muscleSplit([], {})), null)

console.log('\nthe profile card')
const stateOf = (over = {}) => ({
  player: {
    name: 'ROOKIE', handle: 'rookie', classId: 'ironstride', level: 12, xp: 0, streak: 9,
    stats: { STR: 400, END: 300, AGI: 200, VIT: 250, FOCUS: 100 },
    inventory: [{ id: 'i1', slot: 'chest', kind: 'chest', rarity: 'epic', level: 4, stats: { STR: 6, VIT: 4 } }],
    equipped: { chest: 'i1' }, pets: [], activePetId: null, stones: [], efforts: ['run:d5'], ...over.player,
  },
  weeks: [], bests: { 'run:d5': { kind: 'time', value: 1400000, at: 1 } }, ...over,
})
const card = buildCard(stateOf())
is('the card carries what is worth showing',
  [card.name, card.level, card.streak, card.efforts.length, card.worn.length], ['ROOKIE', 12, 9, 1, 1])
is('and nothing that is not', ['log', 'explored', 'routes', 'bests'].filter((k) => k in card), [])
is('a card survives the round trip', decodeCard(encodeCard(card)).handle, 'rookie')
is('a name with an accent survives it too', decodeCard(encodeCard({ ...card, name: 'RÉMY 🏃' })).name, 'RÉMY 🏃')
is('junk decodes to nothing', decodeCard('hello'), null)
is('so does an empty string', decodeCard(''), null)
is('and so does a truncated code', decodeCard(encodeCard(card).slice(0, 40)), null)
is('a save code is not a profile card', decodeCard('LVL100.1|eyJhIjoxfQ=='), null)

const them = { ...card, name: 'THEM', handle: 'them', level: 30, power: 9000 }
const ladder = leaderboard(stateOf(), [them])
is('the ladder is by level, highest first', ladder.map((c) => c.name), ['THEM', 'ROOKIE'])
is('and it knows which one is you', ladder.find((c) => c.me).name, 'ROOKIE')

// ---------------------------------------------------------------- the economy
// The payout is measured against your own median session, which is the whole
// reason a walker is not punished for walking. That only holds if the numbers
// behave, so the shape of the curve is pinned here rather than eyeballed.
console.log('\ncoins are scaled to your own normal')
const walk = ACTIVITIES.find((a) => a.id === 'walk')
const run = ACTIVITIES.find((a) => a.id === 'run')
const cold = { streak: 0 }
const logOf = (...mins) => mins.map((m) => ({ activityId: 'walk', amount: m }))

is('an empty log floors the baseline at 15 minutes', baselineMinutes([]), 15)
is('otherwise it is your median session', baselineMinutes(logOf(10, 20, 60)), 20)
is('and never below the floor', baselineMinutes(logOf(2, 3, 4)), 15)

const beginner = logOf(20, 20, 20)
const athlete = logOf(60, 60, 60)
is('a 20-minute walk pays a beginner more than the same walk pays an athlete',
  coinsFor(cold, beginner, walk, 20, true) > coinsFor(cold, athlete, walk, 20, true), true)
is('a walk and a run of the same length pay the same',
  coinsFor(cold, beginner, walk, 30, true), coinsFor(cold, beginner, run, 5, true))
is('a one-minute session cannot be farmed', coinsFor(cold, beginner, walk, 1, true) <= 10, true)
is('going far past your own normal stops paying more',
  coinsFor(cold, beginner, walk, 90, true), coinsFor(cold, beginner, walk, 200, true))
is('a streak multiplies it', coinsFor({ streak: 100 }, beginner, walk, 30, true) >
  coinsFor(cold, beginner, walk, 30, true), true)
is('unverified pays half', coinsFor(cold, beginner, walk, 30, false),
  Math.round(coinsFor(cold, beginner, walk, 30, true) / 2))

console.log('\nloot comes from milestones, with a floor on each')
for (const [kind, spec] of Object.entries(MILESTONES)) {
  const floor = RARITY_ORDER.indexOf(spec.floor)
  const rolls = Array.from({ length: 200 }, () => rollMilestone(CATALOG, kind))
  is(`${kind} always drops exactly one thing`, rolls.every((d) => d.length === 1), true)
  is(`${kind} never drops below ${spec.floor}`,
    rolls.every((d) => RARITY_ORDER.indexOf(d[0].rarity) >= floor), true)
}
is('an unknown milestone drops nothing', rollMilestone(CATALOG, 'nonsense'), [])

// The boss you are on is decided by your level, and its health is the XP of
// the bracket it owns. If those two ever come apart, a boss either dies a
// fifth of the way through its own level range or can never be finished at
// all, so both halves are pinned here.
console.log('\nthe boss is the level bracket')
const bosses = (level, defeated = [], damage = {}) =>
  campaignState({ level }, { defeated, damage })

is('the first boss stands at level 1, so a new character is already fighting',
  CAMPAIGN[0].level, 1)
is('a level-1 character is in front of the first boss', bosses(1).current.id, CAMPAIGN[0].id)
is('its health is the XP from its level to the next boss\'s',
  bosses(1).hp, bracketXp(CAMPAIGN[0].level, CAMPAIGN[1].level))
is('which is also the XP it takes to cross the bracket',
  bosses(1).hp, [...Array(CAMPAIGN[1].level - CAMPAIGN[0].level)].reduce((n, _, i) => n + xpToNext(CAMPAIGN[0].level + i), 0))
is('the bracket is named on the state', bosses(1).band, `LEVEL 1-${CAMPAIGN[1].level - 1}`)

is('levelling past a boss you have not beaten does not skip it',
  bosses(40).current.id, CAMPAIGN[0].id)
is('beating it moves you to the next one',
  bosses(40, [CAMPAIGN[0].id]).current.id, CAMPAIGN[1].id)
is('clearing everything your level opens leaves nothing to hit',
  bosses(1, [CAMPAIGN[0].id]).current, null)
is('and names the one waiting, with how far off it is',
  [bosses(1, [CAMPAIGN[0].id]).locked.id, bosses(1, [CAMPAIGN[0].id]).gatedBy],
  [CAMPAIGN[1].id, CAMPAIGN[1].level - 1])

const last = CAMPAIGN[CAMPAIGN.length - 1]
const allButLast = CAMPAIGN.slice(0, -1).map((b) => b.id)
is('the last boss has a finite pool rather than an infinite one',
  Number.isFinite(bosses(MAX_LEVEL, allButLast).hp), true)
is('and it runs to the level cap',
  bosses(MAX_LEVEL, allButLast).hp, bracketXp(last.level, MAX_LEVEL))
is('and its bracket is named up to the cap, not past it',
  bosses(MAX_LEVEL, allButLast).band, `LEVEL ${last.level}-${MAX_LEVEL}`)
is('with every boss down the road is clear',
  bosses(MAX_LEVEL, CAMPAIGN.map((b) => b.id)).finished, true)

is('damage is banked per boss, not pooled',
  bosses(40, [], { [CAMPAIGN[1].id]: 999 }).damage, 0)
is('and is capped at the pool', bosses(1, [], { [CAMPAIGN[0].id]: 1e9 }).pct, 1)

// A trip to the arena is once a day and its damage sticks either way, so what
// matters is that it cannot be the whole fight. Rolled on a fixed die, because
// this is about the size of the swing rather than the luck.
console.log('\nthe arena finishes a boss, it does not replace the training')
const flat = () => 0.5
const arena = (worn) => {
  const c = campaignState(INITIAL_STATE.player, { defeated: INITIAL_STATE.campaign.defeated, damage: {} })
  return resolveFight(INITIAL_STATE.player, INITIAL_STATE.log, c.current, c.hp, Math.round(c.hp * worn), flat)
}
is('a boss nobody has touched cannot be put down in one visit', arena(0).won, false)
is('nor one worn a third of the way down', arena(0.33).won, false)
is('nor one worn past halfway, in a room that guards', arena(0.62).won, false)
is('one worn two thirds down falls', arena(0.68).won, true)
is('a losing visit still takes a bite out of it', arena(0).dealt > 0, true)

// Guard is the only thing that separates one arena from another beyond size,
// so it is worth pinning that it is applied, that it is applied to the SWING,
// and that it is applied to nothing else.
console.log('\nthe arena you are in turns part of your swing aside')
// The bare swing, before the room gets to it: the same arithmetic swingFor
// does, written out, so the assertion is about the guard and nothing else.
const bare = (bossId) => {
  const i = CAMPAIGN.findIndex((b) => b.id === bossId)
  const player = { ...INITIAL_STATE.player, level: CAMPAIGN[i].level }
  const c = campaignState(player, { defeated: CAMPAIGN.slice(0, i).map((b) => b.id), damage: {} })
  const me = fightPower(player, INITIAL_STATE.log)
  const ratio = Math.min(2.2, Math.max(0.3, me.attack / parAttack(c.current.level)))
  return {
    swing: swingFor(player, INITIAL_STATE.log, c.current, c.hp),
    raw: c.hp * 0.075 * ratio,
    guard: c.arena.guard,
    player,
    c,
  }
}
for (const id of ['golem', 'ironjaw', 'lvl100']) {
  const b = bare(id)
  is(`${arenaFor(id).name} takes ${Math.round(b.guard * 100)}% off every swing`,
    b.swing, Math.max(1, Math.round(b.raw * (1 - b.guard))))
}
is('Stone takes nothing off', arenaFor('golem').guard, 0)
is('and Everforge takes nearly half', arenaFor('lvl100').guard, 0.45)

// The rule the whole ladder stands on: a boss's health is its bracket's XP, so
// a session has to deal exactly what it pays or the health bar and the level
// bar stop being the same bar.
const session = { tag: 'gym', name: 'Gym' }
is('a logged session deals its XP in full, whatever room it is in',
  [bossHit(CAMPAIGN[0], session, 400).damage, bossHit(CAMPAIGN[CAMPAIGN.length - 1], session, 400).damage],
  [400, 400])

console.log('\nten arenas, one per bracket')
is('there is an arena for every boss', ARENAS.length, CAMPAIGN.length)
is('and every arena points at a boss that exists',
  ARENAS.every((a) => CAMPAIGN.some((b) => b.id === a.boss)), true)
is('they are numbered one to ten in order',
  ARENAS.map((a) => a.n), CAMPAIGN.map((_, i) => i + 1))
is('guard never goes down as you climb',
  ARENAS.every((a, i) => i === 0 || a.guard >= ARENAS[i - 1].guard), true)
const rungs = arenaLadder()
is('the ladder starts at level 1 and ends at the cap',
  [rungs[0].from, rungs[rungs.length - 1].to], [1, MAX_LEVEL])
is('and no bracket leaves a level unaccounted for',
  rungs.every((r, i) => i === 0 || r.from === rungs[i - 1].to + 1), true)
is('every rung carries the boss that stands in it',
  rungs.map((r) => r.boss.id), CAMPAIGN.map((b) => b.id))

// Getting out, the gym, and the games you already play. These are what the
// app is for, so each one has to report a number that moved rather than a
// total that only ever grows.
console.log('\nthe three things you are here to get better at')
const bucket = (id) => pillarOf(id)?.id ?? null
is('a walk is getting out', bucket('walk'), 'out')
is('so is a swim', bucket('swim'), 'out')
is('a gym session is the gym', bucket('gym'), 'gym')
is('so is calisthenics', bucket('bodyweight'), 'gym')
is('aim training is gaming', bucket('aim'), 'gaming')
is('so is a VOD review', bucket('vod'), 'gaming')
is('sleep belongs to none of them — it is recovery, not improvement', bucket('sleep'), null)
is('every activity but sleep has a home',
  ACTIVITIES.filter((a) => !pillarOf(a.id)).map((a) => a.id), ['sleep'])
is('and no activity has two', ACTIVITIES.every((a) => PILLARS.filter((p) => p.activities.includes(a.id)).length <= 1), true)

const WEEK = 7 * 24 * 3600 * 1000
const wk = (at, byAct) => ({ key: weekKey(at), at: weekStart(at), sessions: 0, minutes: 0, volume: 0, km: 0, xp: 0, byAct })
const NOW = Date.now()
const twoWeeks = [
  wk(NOW, { run: { sessions: 2, minutes: 60, km: 10 }, walk: { sessions: 1, minutes: 30, km: 2 } }),
  wk(NOW - WEEK, { run: { sessions: 1, minutes: 30, km: 5 } }),
]
const out = pillarWeek(twoWeeks, PILLARS.find((p) => p.id === 'out'), NOW)
is('getting out adds every activity in it', out.km, 12)
is('and counts the sessions', out.sessions, 3)
is('and says what it did against last week', out.delta, 7)
is('measured in the unit people quote', out.unit, 'km')

// A week of swimming covers no ground the app can see, and reporting zero for
// it would be the app calling a good week nothing.
const poolOnly = [wk(NOW, { swim: { sessions: 3, minutes: 90, km: 0 } }), wk(NOW - WEEK, {})]
is('a week with no measurable distance falls back to minutes',
  pillarWeek(poolOnly, PILLARS.find((p) => p.id === 'out'), NOW).unit, 'min')
is('and reports the minutes', pillarWeek(poolOnly, PILLARS.find((p) => p.id === 'out'), NOW).value, 90)

// The case that read "0.0 km, 1 session": a walk logged by the clock after a
// week that had runs in it. The unit follows this week, not last.
const walkedOnly = [wk(NOW, { walk: { sessions: 1, minutes: 42, km: 0 } }), wk(NOW - WEEK, { run: { sessions: 2, minutes: 60, km: 10 } })]
const walked = pillarWeek(walkedOnly, PILLARS.find((p) => p.id === 'out'), NOW)
is('a week of walks after a week of runs is not headed "0 km"', [walked.unit, walked.value], ['min', 42])
is('and the comparison is like for like', walked.delta, 42 - 60)

// The freshest proof, not the biggest: a 5k from March answers "am I getting
// better" worse than a bench single from Tuesday.
const pillarBoard = {
  'run:d5': { kind: 'time', value: 1500000, at: NOW - 90 * 86400000 },
  'lift:Bench press:5': { kind: 'weight', value: 100, at: NOW - 86400000 },
  'aim:score': { kind: 'score', value: 84210, at: NOW },
}
is('the gym shows its most recent lift', pillarBest(PILLARS.find((p) => p.id === 'gym'), pillarBoard).value, '100')
is('getting out shows its distance best', pillarBest(PILLARS.find((p) => p.id === 'out'), pillarBoard).name, '5k run')
is('gaming shows the aim score', pillarBest(PILLARS.find((p) => p.id === 'gaming'), pillarBoard).name, 'Best aim score')
is('a pillar with nothing behind it shows nothing', pillarBest(PILLARS.find((p) => p.id === 'gaming'), {}), null)

// An aim session is minutes in a chair unless it carries the number the
// trainer gave you, which is the only thing that says you improved.
console.log('\naim training keeps a score')
const aimOf = (detail) => effortsIn({ activityId: 'aim', detail })
is('a scored session is evidence', aimOf({ mode: 'aim', score: 84210, accuracy: 91.4 }).length, 2)
is('the score is one of them', aimOf({ mode: 'aim', score: 84210 })[0].id, 'aim:score')
is('an unscored session is not', aimOf({ mode: 'aim', score: 0, accuracy: 0 }), [])
is('a higher score takes the board',
  foldEfforts({ 'aim:score': { kind: 'score', value: 1000, at: 1 } }, { activityId: 'aim', detail: { mode: 'aim', score: 2000 } })['aim:score'].value, 2000)
is('a lower one does not',
  foldEfforts({ 'aim:score': { kind: 'score', value: 3000, at: 1 } }, { activityId: 'aim', detail: { mode: 'aim', score: 2000 } })['aim:score'].value, 3000)
is('and it reads out as a score', readEffort('aim:score', { value: 84210 }).name, 'Best aim score')

// A pet can carry a drawing per growth stage. Every slot is optional and
// falls back down the stages, so adding one grid has to be a complete change
// rather than a thing you can only do four at a time.
console.log('\na pet can change shape as it levels')
const at = (n) => petStage(n).idx
is('there are four forms, not five', PET_STAGES.length, 4)
is('and a form number maps straight onto its drawing', [1, 2, 3, 4].map(at), [0, 1, 2, 3])
is('a bad stage is clamped rather than rendering nothing', [at(0), at(9), at(undefined)], [0, 3, 0])
is('each form is drawn bigger than the one before',
  PET_STAGES.every((s, i) => i === 0 || s.scale > PET_STAGES[i - 1].scale), true)
is('and is worth more than the one before',
  PET_STAGES.every((s, i) => i === 0 || s.bonus > PET_STAGES[i - 1].bonus), true)

// The costs are the whole economy of the collection, so they are pinned here
// rather than left to whatever the screen happens to render.
console.log('\ntreats are what move a pet up')
is('the three steps cost 5, 15 and 50', PET_STAGES.map((s) => s.cost), [5, 15, 50, 0])
is('so a finished pet is seventy sessions',
  PET_STAGES.reduce((n, s) => n + s.cost, 0), 70)
is('and a session pays exactly one treat', TREAT_PER_SESSION, 1)

const hatch = { rarity: 'common', stat: 'VIT', stage: 1, fed: 0 }
is('a treat short of the cost does not evolve it',
  [feedPet(hatch, 4).pet.stage, feedPet(hatch, 4).pet.fed, feedPet(hatch, 4).grew], [1, 4, false])
is('the fifth one does', [feedPet(hatch, 5).pet.stage, feedPet(hatch, 5).grew], [2, true])
is('and the remainder carries into the next form rather than being eaten',
  [feedPet(hatch, 8).pet.stage, feedPet(hatch, 8).pet.fed], [2, 3])
is('pouring the whole seventy walks it all the way up',
  [feedPet(hatch, 70).pet.stage, feedPet(hatch, 70).spent], [4, 70])
is('and anything past that is not spent',
  [feedPet(hatch, 200).pet.stage, feedPet(hatch, 200).spent], [4, 70])
is('a fully grown pet takes no more treats',
  [feedPet({ ...hatch, stage: 4 }, 10).spent, treatsToNext({ stage: 4 })], [0, 0])
is('feeding nothing changes nothing', feedPet(hatch, 0).spent, 0)

// The bonus endpoints are what the old level curve reached, so a finished pet
// is worth what it always was — only the road to it changed.
is('a fully grown legendary is worth what it used to be',
  petPct({ rarity: 'legendary', stage: 4 }), 56)
is('and a hatchling common is where it used to start',
  petPct({ rarity: 'common', stage: 1 }), 3)

// pup has no growth series, which is the case the fallback exists for.
is('a pet with no stage art uses its one drawing at every level',
  [0, 1, 2, 3].every((i) => petSprite('pup', i) === PET_SPRITES.pup), true)
is('an unknown pet falls back rather than crashing', petSprite('nonsense', 3), PET_SPRITES.pup)

// The three that do have one carry a drawing for every stage.
for (const ref of ['frost', 'ember', 'zeus']) {
  is(`${ref} has a drawing for all four`, PET_SPRITES[ref].stages.length, 4)
  is(`and ${ref} shows a different one at each`,
    new Set([0, 1, 2, 3].map((i) => petSprite(ref, i))).size, 4)
  is(`and every ${ref} form is on the same canvas`,
    PET_SPRITES[ref].stages.every((g) => g.w === 50 && g.h === 44), true)
}

const juvenile = { id: 'x', w: 2, h: 2, palette: { a: '#111' }, grid: ['aa', 'aa'] }
const ascended = { id: 'x', w: 4, h: 4, palette: { a: '#222' }, grid: ['aaaa', 'aaaa', 'aaaa', 'aaaa'] }
const grown = { ...PET_SPRITES.pup, stages: [null, juvenile, null, ascended] }
const saved = PET_SPRITES.pup
PET_SPRITES.pup = grown
is('a hatchling with no art of its own uses the base', petSprite('pup', 0), grown)
is('a juvenile uses its own', petSprite('pup', 1), juvenile)
is('prime falls back to the juvenile rather than skipping ahead', petSprite('pup', 2), juvenile)
is('ascended uses its own', petSprite('pup', 3), ascended)
is('a later stage may be drawn on a bigger canvas', [petSprite('pup', 3).w, petSprite('pup', 3).h], [4, 4])
PET_SPRITES.pup = saved
is('and the fixture is put back', petSprite('pup', 3), saved)

// The filter on the profile offers what this person has done, not a fixed
// set. It used to read the folded weeks alone, which miss anything logged
// today, anything older than the thirteen kept, and anything from a week
// folded before the breakdown existed.
console.log('\nprogress offers what you have actually done')
const weekOfRun = [wk(NOW, { run: { sessions: 2, minutes: 60, km: 10 } })]
is('an activity in the weeks is offered', weekActivities(weekOfRun, []), ['run'])
is('an activity logged today is offered even before its week is folded',
  weekActivities([], [{ id: 'a', activityId: 'gym', at: NOW }]), ['gym'])
is('both sources together, most-used first',
  weekActivities(weekOfRun, [{ id: 'a', activityId: 'gym', at: NOW }]), ['run', 'gym'])
is('nothing done, nothing offered', weekActivities([], []), [])
is('and an activity nobody has ever done is never offered',
  weekActivities(weekOfRun, []).includes('swim'), false)

// What they play decides whether the app suggests aim training at all.
console.log('\nwhat you play changes what the app suggests')
const gaming = PILLARS.find((p) => p.id === 'gaming')
is('an FPS player is told aim training pays off in the game they named',
  pillarEmpty(gaming, ['valorant']), 'Aim training pays off in Valorant.')
is('somebody who plays neither gets the plain line', pillarEmpty(gaming, ['minecraft']),
  'Aim training and VOD review both count.')
is('and somebody who skipped the question gets the default', pillarEmpty(gaming, []), gaming.empty)
is('the other pillars ignore it', pillarEmpty(PILLARS[0], ['valorant']), PILLARS[0].empty)
is('playsAim reads the catalogue', [playsAim(['cs']), playsAim(['minecraft']), playsAim([])], [true, false, false])
is('every game has a name and a kind',
  GAMES.every((g) => g.id && g.name && g.kind), true)


// The coach is the part of the app with an opinion, so it is the part most
// worth pinning down: a bad suggestion is worse than no suggestion.
console.log('\nthe next set is one step on from the last one')
is('an unfinished rep range adds a rep', nextTarget([{ reps: 8, weight: 60 }]), { reps: 9, weight: 60, why: 'reps' })
is('the top of the range adds the smallest plate and drops back',
  nextTarget([{ reps: 12, weight: 60 }]), { reps: 5, weight: 62.5, why: 'weight' })
is('bodyweight work only ever goes up in reps',
  nextTarget([{ reps: 10, weight: 0 }]), { reps: 11, weight: 0, why: 'reps' })
is('it reads the heaviest set, not the last one — a drop set must not set you backwards',
  nextTarget([{ reps: 5, weight: 100 }, { reps: 12, weight: 40 }]), { reps: 6, weight: 100, why: 'reps' })
is('a lift with no history gets no opinion', nextTarget([]), null)
is('and the label reads the way a person says it',
  [targetLabel({ reps: 8, weight: 60 }), targetLabel({ reps: 8, weight: 0 })], ['60kg × 8', '8 reps'])

console.log('\na record is a record, and nothing else is')
const prBoard = { Bench: { e1rm: e1rm(6, 65) } }
is('beating the board is a record', Boolean(beatsRecord(prBoard, 'Bench', 7, 65)), true)
is('matching it is not', Boolean(beatsRecord(prBoard, 'Bench', 6, 65)), false)
is('a lift with no record yet is a first entry, not a best',
  Boolean(beatsRecord({}, 'Squat', 5, 200)), false)
is('and a warm-up can never be one', Boolean(beatsRecord(prBoard, 'Bench', 12, 100, true)), false)

console.log('\nwarm-ups are logged but they are not work')
const mixed = [{ lift: 'Bench', reps: 10, weight: 20, warmup: true }, { lift: 'Bench', reps: 5, weight: 80 }]
is('they stay out of the tonnage', setTotals(mixed), { sets: 1, reps: 5, volume: 400 })
is('they stay out of the per-lift breakdown', byLift(mixed).length, 1)
is('and they cannot set a record', newRecords({ Bench: { e1rm: 50 } }, [mixed[0]]), [])

console.log('\nthe bar loads in pairs')
is('60kg is a twenty a side', plateLoad(60), { bar: 20, side: [{ plate: 20, n: 1 }] })
is('an awkward number still comes out', plateLoad(82.5),
  { bar: 20, side: [{ plate: 25, n: 1 }, { plate: 5, n: 1 }, { plate: 1.25, n: 1 }] })
is('the empty bar is the empty bar', plateLoad(20), { bar: 20, side: [] })
is('and anything under the bar has no answer', plateLoad(15), null)

console.log('\ntoday has one answer, not a menu')
const DAY = 86400000
is('a blank week asks only that you start', planToday({ log: [] }).kind, 'start')
const pushOnly = {
  log: [{ id: 'a', activityId: 'gym', at: NOW - DAY, detail: { mode: 'strength', lifts: [
    { lift: 'Bench press', sets: 9 }, { lift: 'Squat', sets: 9 }, { lift: 'Overhead press', sets: 9 },
  ] } }],
}
is('a body with a hole in it names the hole', planToday(pushOnly, { now: NOW }).kind, 'muscle')
is('and points it at the gym', planToday(pushOnly, { now: NOW }).activityId, 'gym')


// A split is the one place the app makes a plan on somebody's behalf, so the
// rules it follows have to hold for every combination, not just the demo.
console.log('\na split knows what today is')
const ppl = splitById('ppl')
is('a fresh split starts at its first day', nextDay(ppl, []).day.name, 'Push')
const pushed = [{ at: NOW, detail: { mode: 'strength', lifts: [
  { lift: 'Bench press' }, { lift: 'Overhead press' }, { lift: 'Tricep pushdown' },
] } }]
is('after a push session it moves to pull', nextDay(ppl, pushed).day.name, 'Pull')
const legged = [{ at: NOW, detail: { mode: 'strength', lifts: [{ lift: 'Squat' }, { lift: 'Leg curl' }] } }]
is('and the cycle wraps', nextDay(ppl, legged).day.name, 'Push')
is('one exercise is not a training day and does not move the rotation',
  nextDay(ppl, [{ at: NOW, detail: { mode: 'strength', lifts: [{ lift: 'Wrist curl' }] } }]).day.name, 'Push')
is('but a back-only pull day still counts as pull',
  nextDay(ppl, [{ at: NOW, detail: { mode: 'strength', lifts: [
    { lift: 'Deadlift' }, { lift: 'Barbell row' }, { lift: 'Lat pulldown' },
  ] } }]).day.name, 'Legs')
is('every split has days and every day has muscles',
  SPLITS.every((s) => s.days.length && s.days.every((d) => d.muscles.length)), true)

console.log('\nthe same day is a different session for a different goal')
const forGoal = (g) => recommend(ppl.days[0], g, { log: [] })
is('each goal produces the number of exercises it asks for',
  GOALS.map((g) => forGoal(g.id).length), GOALS.map((g) => g.count))
is('strength leads on the barbell', forGoal('strong')[0], 'Bench press')
is('and general fitness does not', forGoal('fit')[0] === 'Bench press', false)
is('the three goals do not produce the same session',
  new Set(GOALS.map((g) => forGoal(g.id).join('|'))).size, 3)
is('nothing is suggested twice', GOALS.every((g) => {
  const list = forGoal(g.id)
  return new Set(list).size === list.length
}), true)
is('and no session pairs a movement with its own variant', GOALS.every((g) =>
  forGoal(g.id).every((a, i) => forGoal(g.id).every((b, j) => {
    if (i === j) return true
    const x = a.toLowerCase(); const y = b.toLowerCase()
    return !x.includes(y) && !y.includes(x)
  }))), true)

console.log('\nevery split and goal together produce a usable session')
let bad = []
for (const sp of SPLITS) for (const g of GOALS) for (const d of sp.days) {
  const list = recommend(d, g.id, { log: [] })
  if (list.length !== g.count) bad.push(`${sp.id}/${g.id}/${d.id} gave ${list.length}`)
}
is('all of them fill the session', bad, [])
is('and today reads back everything a card needs', (() => {
  const t = todaysSession('ul', 'muscle', [])
  return Boolean(t.day && t.exercises.length && t.prescribe && t.split && t.goal)
})(), true)
is('prescription is written the way a coach writes it', prescription('strong'), '5 × 3–6')
is('an unknown goal falls back rather than throwing', goalById('nonsense').id, 'muscle')
is('and an unknown split is simply absent', splitById('nonsense'), null)

console.log('\na chosen split outranks the app\'s own guess')
const withSplit = {
  player: { split: 'ppl', goal: 'strong' },
  log: [{ id: 'a', activityId: 'gym', at: NOW - 3600000, detail: { mode: 'strength', lifts: [
    { lift: 'Bench press', sets: 9 }, { lift: 'Squat', sets: 9 }, { lift: 'Overhead press', sets: 9 },
  ] } }],
}
is('the split drives the card', planToday(withSplit, { now: NOW }).kind, 'split')
is('and it carries the session with it',
  planToday(withSplit, { now: NOW }).session.exercises.length > 0, true)
is('but a blank week still just asks you to start',
  planToday({ player: { split: 'ppl', goal: 'strong' }, log: [] }, { now: NOW }).kind, 'start')


// The curve is the pace of the whole game, and it was wrong once: at 1.22 the
// road to level 100 was 1,472,277 XP, which is fourteen years at five sessions
// a week. These are the guards against it drifting back.
console.log('\nthe road is a length a person can actually walk')
const ROAD = bracketXp(1, 100)
is('level 100 is reachable inside four years at five sessions a week',
  ROAD / (400 * 5 * 52) < 4, true)
is('and it is not so short that it is over in one',
  ROAD / (400 * 5 * 52) > 2, true)
// The rooms are the reward, so the early ones have to arrive at a pace
// somebody notices. Five different arenas inside the first six months is the
// cadence that makes climbing feel like going somewhere.
is('the first five arenas are cleared inside six months',
  bracketXp(1, CAMPAIGN[5].level) / (400 * 5 * 52) * 12 < 6, true)
// A level should get dearer as you climb, but gently. The old curve nearly
// doubled the cost every twenty-five levels.
is('a late level costs less than ten times an early one',
  xpToNext(99) / xpToNext(10) < 10, true)
is('every level still costs more than the one before it',
  [...Array(98)].every((_, i) => xpToNext(i + 2) > xpToNext(i + 1)), true)
is('and the first level is small enough that one session clears it',
  xpToNext(1) < 200, true)


// The day roll. Every one of these was broken until now: the case that settles
// a new day was never dispatched by anything, so a streak could not go up, a
// shield could not be spent and the dailies never reset. These are the rules
// it is supposed to enforce, written down so they stay enforced.
console.log('\nthe day rolls over')
// A save mid-streak, seen yesterday, with one shield in the bank.
const KEY = (n) => dayKeyPlus(todayKey(), n)
const saveOn = (seen, claimed, over) => ({
  player: { streak: 12, shields: 1 },
  dailies: [{ id: 'active', done: true }, { id: 'b', done: true }, { id: 'c', done: true }],
  perfectToday: true,
  chest: { unlocked: true, openedToday: true },
  toasts: [],
  lastDayKey: seen,
  streakDay: claimed,
  ...over,
})
const roll = (save, today = todayKey()) => reducer(save, { type: 'dayRoll', today })

const sameDay = saveOn(todayKey(), todayKey())
is('the same day is left completely alone — the very same object back',
  roll(sameDay) === sameDay, true)
is('a new day resets the dailies',
  roll(saveOn(KEY(-1), KEY(-1))).dailies.every((d) => !d.done), true)
is('and the chest, and the perfect-day flag',
  [roll(saveOn(KEY(-1), KEY(-1))).chest, roll(saveOn(KEY(-1), KEY(-1))).perfectToday],
  [{ unlocked: false, openedToday: false }, false])
// Trained yesterday, so nothing was missed — today is not over yet.
is('a day trained keeps the streak and the shield',
  [roll(saveOn(KEY(-1), KEY(-1))).player.streak, roll(saveOn(KEY(-1), KEY(-1))).player.shields], [12, 1])
// Last trained two days ago: yesterday went by empty, and a shield covers it.
is('one missed day is paid for with one shield',
  [roll(saveOn(KEY(-1), KEY(-2))).player.streak, roll(saveOn(KEY(-1), KEY(-2))).player.shields], [12, 0])
is('and it says so',
  roll(saveOn(KEY(-1), KEY(-2))).toasts[0].title, 'Streak shield used')
// Two missed days against one shield. The second one lands.
is('two missed days with one shield ends the streak',
  [roll(saveOn(KEY(-1), KEY(-3))).player.streak, roll(saveOn(KEY(-1), KEY(-3))).player.shields], [0, 0])
is('and the streak has no anchor left to count from',
  roll(saveOn(KEY(-1), KEY(-3))).streakDay, null)
is('a missed day with no shield ends it immediately',
  roll(saveOn(KEY(-1), KEY(-2), { player: { streak: 12, shields: 0 } })).player.streak, 0)
is('a streak of nothing cannot be broken, and keeps its shields',
  roll(saveOn(KEY(-1), null, { player: { streak: 0, shields: 1 } })).player.shields, 1)
// Somebody who disappears for a year. The loop has to stop somewhere, and the
// answer is the same either way: the streak is gone.
is('a year away ends the streak without walking a year of days',
  roll(saveOn(KEY(-400), KEY(-400))).player.streak, 0)
is('a save that has never been seen adopts today rather than charging for it',
  [roll(saveOn(null, null)).player.streak, roll(saveOn(null, null)).lastDayKey], [12, todayKey()])
is('a clock that has gone backwards settles nothing',
  [roll(saveOn(KEY(3), KEY(3))).player.streak, roll(saveOn(KEY(3), KEY(3))).player.shields], [12, 1])
is('every roll leaves the calendar on today',
  [KEY(-1), KEY(-9), KEY(3), null].every((d) => roll(saveOn(d, d)).lastDayKey === todayKey()), true)

// The other half of the loop: the roll only ever takes the streak away, and
// training is what puts it up. This is the half people actually see.
console.log('\nand training claims the day')
const blank = reducer(undefined, { type: 'reset' })
const trained = (save) => reducer(save, { type: 'log', activityId: 'walk', amount: 30, verified: false })
is('the first session of the day puts the streak up',
  trained(blank).player.streak, blank.player.streak + 1)
is('and marks the day as claimed',
  trained(blank).streakDay, todayKey())
is('a second session the same day does not claim it twice',
  trained(trained(blank)).player.streak, blank.player.streak + 1)
is('the longest streak ever held only goes up',
  trained({ ...blank, player: { ...blank.player, streak: 40, lifetime: { ...blank.player.lifetime, streak: 99 } } })
    .player.lifetime.streak, 99)
// Yesterday's key with today's session: the streak is claimed on today, not on
// the stale key, whether or not the app noticed the date change first.
is('a session logged before the app noticed the date still claims today',
  trained({ ...blank, lastDayKey: KEY(-1), streakDay: KEY(-1), player: { ...blank.player, streak: 5 } })
    .player.streak, 6)

// What a day has to be before it counts as one. The streak used to move on
// any log at all, which made a sixty-second walk and a nap worth the same as
// an hour under the bar — and put a x1.5 multiplier behind typing in sleep.
const { weekStart: wkStart } = await server.ssrLoadModule('/src/game/progress.js')
console.log('\nand not everything logged is a day')
is('twenty minutes of walking is a day', keepsStreak('walk', 20), true)
is('nineteen is not', keepsStreak('walk', 19), false)
is('an hour in the gym is a day', keepsStreak('gym', 60), true)
is('so is a long lift logged by volume', keepsStreak('lift', 44), true)
is('sleep is logged and paid and holds nothing', keepsStreak('sleep', 480), false)
is('and neither does aim training, for all that it counts elsewhere',
  [keepsStreak('aim', 60), keepsStreak('vod', 45)], [false, false])
is('the bar is the one the Active daily already asks for', STREAK_MIN_MINUTES, 20)
// Through the reducer, which is where it actually matters.
const logged = (save, activityId, amount) => reducer(save, { type: 'log', activityId, amount, verified: false })
is('a nap does not move the streak',
  logged(blank, 'sleep', 8).player.streak, blank.player.streak)
is('and leaves the streak day where it was',
  logged(blank, 'sleep', 8).streakDay, blank.streakDay)
is('but it is still logged, and still paid XP',
  [logged(blank, 'sleep', 8).log.length - blank.log.length, logged(blank, 'sleep', 8).sessionReward.xp > 0],
  [1, true])
is('a two-minute walk does not move it either',
  logged(blank, 'walk', 2).player.streak, blank.player.streak)
is('a proper walk does',
  logged(blank, 'walk', 25).player.streak, blank.player.streak + 1)
// The weekly target counts the same kind of day, which is the whole point —
// two definitions of "a day" is what made the two systems read as a fight.
const dayAt = (n) => wkStart(Date.now()) + n * 86400000 + 3600000
is('a week of naps is no days trained',
  daysTrained([0, 1, 2, 3].map((n) => ({ activityId: 'sleep', amount: 8, at: dayAt(n) })), wkStart(Date.now())), 0)
is('a week of real sessions is four',
  daysTrained([0, 1, 2, 3].map((n) => ({ activityId: 'walk', amount: 30, at: dayAt(n) })), wkStart(Date.now())), 4)

// The other end of the shield: they were spendable and unearnable, which is a
// safety net with no rope. A week hit is what pays for one.
console.log('\na week hit banks a rest day')
// A log of n different days inside this week, oldest first, so weekStart sees
// them all. Monday is the week's start, so count forward from it.
const daysIn = (n) => [...Array(n)].map((_, i) => ({
  id: `l${i}`, activityId: 'walk', amount: 30, verified: false,
  at: wkStart(Date.now()) + i * 86400000 + 3600000, xp: 10,
}))
const weekOf = (n, over = {}) => ({
  ...blank,
  ...over,
  log: daysIn(n),
  player: { ...blank.player, goalDays: 4, shields: 0, ...over.player },
})
is('three days in is not the week yet',
  trained(weekOf(2)).player.shields, 0)
is('the session that makes it four banks one',
  trained(weekOf(3)).player.shields, 1)
is('and says so on the reward screen',
  trained(weekOf(3)).sessionReward.milestones.some((m) => m.kind === 'shield'), true)
is('a fifth and sixth day do not bank a second',
  trained(trained(weekOf(3))).player.shields, 1)
is('the bank has a ceiling',
  trained(weekOf(3, { player: { goalDays: 4, shields: MAX_SHIELDS } })).player.shields, MAX_SHIELDS)
// Days, not sessions: three sessions on one day is one day of training.
is('two sessions in a day do not count as two days',
  trained({ ...blank, log: [...daysIn(3), { id: 'x', activityId: 'walk', amount: 30, at: wkStart(Date.now()) + 7200000, xp: 10 }],
    player: { ...blank.player, goalDays: 5, shields: 0 } }).player.shields, 0)
is('somebody who set themselves two days banks one at two',
  trained(weekOf(1, { player: { goalDays: 2, shields: 0 } })).player.shields, 1)

console.log(fails ? `\n${fails} failed\n` : '\nall passed\n')
await server.close()
process.exit(fails ? 1 : 0)
