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
const { e1rm, newRecords, foldRecords, foldWeek, weekSeries, weekOverWeek, weekKey } =
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
