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
const { e1rm, newRecords, foldRecords, foldWeek, weekSeries, weekOverWeek, weekKey, topSet, foldLastSets, lastPlan } =
  await server.ssrLoadModule('/src/game/progress.js')
// The real activity, not a stand-in: minutes are worked out from the activity's
// own minPerUnit, so a hand-made stub without one quietly folds zero minutes
// into every week and the test passes on nothing.
const { ACTIVITIES } = await server.ssrLoadModule('/src/game/config.js')
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

console.log(fails ? `\n${fails} failed\n` : '\nall passed\n')
await server.close()
process.exit(fails ? 1 : 0)
