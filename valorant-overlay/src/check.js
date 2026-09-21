import fs from 'node:fs'
import path from 'node:path'
import { request } from './http.js'
import { readLockfile, getEntitlements, getChatSession, getRegionLocale, shardFor } from './riot/localApi.js'
import { PlayerDataClient, getClientVersion } from './riot/pd.js'
import { TierCatalog } from './riot/tiers.js'

/**
 * Collects everything it prints so the whole run can be written to a file.
 * A console window that closes too fast should never lose the output.
 */
class Report {
  constructor() {
    this.lines = []
  }

  say(text = '') {
    console.log(text)
    this.lines.push(text)
  }

  field(label, value) {
    this.say(`  ${String(label).padEnd(24)} ${value}`)
  }

  save(file) {
    try {
      fs.writeFileSync(file, `${this.lines.join('\n')}\n`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Reports on the local Riot Client and, if it can reach it, on the rank data
 * Riot returns. Run with --check when the overlay will not show a rank.
 * Never throws: a diagnostic that crashes tells you nothing.
 */
function readVersion(config) {
  try {
    return JSON.parse(fs.readFileSync(path.join(config.root, 'package.json'), 'utf8')).version
  } catch {
    return 'unknown'
  }
}

export async function runCheck(config) {
  const report = new Report()
  const outputFile = path.join(config.root, 'check-output.txt')
  const dataFile = path.join(config.root, 'rank-data.json')

  report.say('')
  report.say(`VALORANT rank overlay — connection check (v${readVersion(config)})`)
  report.say(`Run at ${new Date().toLocaleString()}`)
  report.say('')

  try {
    await inspect(report, config, dataFile)
  } catch (err) {
    report.say('')
    report.say(`The check itself failed: ${err && err.message}`)
    if (err && err.stack) report.say(String(err.stack).split('\n').slice(1, 4).join('\n'))
  }

  report.say('')
  if (report.save(outputFile)) {
    report.say(`This output was also saved to:`)
    report.say(`  ${outputFile}`)
    console.log('')
  }
}

async function inspect(report, config, dataFile) {
  report.field('Lockfile path', config.lockfilePath)

  if (!fs.existsSync(config.lockfilePath)) {
    report.field('Lockfile', 'NOT FOUND')
    report.say('')
    report.say('Verdict: the Riot Client is not running, or is installed somewhere')
    report.say('unusual. Start VALORANT, wait for the play menu, and run this again.')
    return
  }

  let lock
  try {
    lock = readLockfile(config.lockfilePath)
  } catch (err) {
    report.field('Lockfile', `unreadable — ${err.message}`)
    return
  }

  const age = Math.round((Date.now() - fs.statSync(config.lockfilePath).mtimeMs) / 1000)
  report.field('Lockfile', 'found')
  report.field('Client port', String(lock.port))
  report.field('Written', `${age}s ago`)
  report.say('')

  const auth = `Basic ${Buffer.from(`riot:${lock.password}`).toString('base64')}`
  const probes = [
    ['/entitlements/v1/token', 'auth tokens'],
    ['/chat/v1/session', 'account + region'],
    ['/chat/v4/presences', 'in-game status'],
  ]

  const results = {}
  for (const [route, purpose] of probes) {
    try {
      const res = await request(`${lock.protocol}://127.0.0.1:${lock.port}${route}`, {
        headers: { Authorization: auth, Accept: 'application/json' },
        insecure: true,
        timeout: 5000,
      })
      results[route] = res.status
      report.field(String(res.status), `${route}  (${purpose})`)
    } catch (err) {
      results[route] = err.code || 'ERROR'
      report.field(err.code || 'ERROR', `${route}  (${purpose})`)
    }
  }
  report.say('')

  const entitlements = results['/entitlements/v1/token']
  if (entitlements === 404) {
    report.say('Verdict: something is listening on that port but it is not the Riot Client')
    report.say('API — either it has not finished signing in, or an old lockfile is pointing')
    report.say('at the wrong process.')
    report.say('')
    report.say('Fix: fully quit VALORANT and the Riot Client (check the system tray, and')
    report.say('End task on "Riot Client" and "RiotClientServices" in Task Manager), then')
    report.say('start VALORANT and wait for the play menu.')
    return
  }
  if (typeof entitlements === 'string') {
    report.say('Verdict: nothing answered on that port, so the lockfile is stale. Fully quit')
    report.say('VALORANT and the Riot Client, then start the game again.')
    return
  }
  if (entitlements !== 200) {
    report.say(`Verdict: the client answered ${entitlements} instead of 200. It is probably`)
    report.say('still starting up — wait for the play menu and run this again.')
    return
  }

  await inspectRank(report, config, lock, dataFile)
}

async function inspectRank(report, config, lock, dataFile) {
  const auth = await getEntitlements(lock)
  const session = await getChatSession(lock)
  const puuid = auth.puuid || session.puuid
  const region = session.region || (await getRegionLocale(lock))
  const shard = config.shard || shardFor(region)

  report.field('Account', `${session.name || '?'}#${session.tag || '?'}`)
  report.field('Player id', puuid ? `${puuid.slice(0, 8)}… (present)` : 'MISSING')
  report.field('Region / shard', `${region || 'unknown'} / ${shard}`)

  if (!puuid) {
    report.say('')
    report.say('Verdict: the client has not published a player id yet. Wait until you are')
    report.say('at the VALORANT play menu and run this again.')
    return
  }

  const version = await getClientVersion(config.valorantLogPath)
  report.field('Client version', version)

  const pd = new PlayerDataClient({ shard, auth, version })

  let mmr
  try {
    mmr = await pd.getMmr(puuid)
  } catch (err) {
    report.say('')
    report.say(`Verdict: the rank request failed — ${err.message}`)
    if (err.body) report.say(`  Riot replied: ${err.body}`)
    return
  }

  const catalog = new TierCatalog(config.cacheDir, config.overrideDir)
  await catalog.refreshAct()
  report.field('Current act (valorant-api)', catalog.actId || 'could not be determined')

  // Save the raw payload so the exact shape can be inspected if the summary
  // below does not explain the problem.
  try {
    const redacted = JSON.parse(JSON.stringify(mmr))
    if (redacted.Subject) redacted.Subject = 'REDACTED'
    fs.writeFileSync(dataFile, JSON.stringify({ shard, version, currentAct: catalog.actId, mmr: redacted }, null, 2))
    report.field('Raw data saved to', dataFile)
  } catch {
    report.field('Raw data', 'could not be saved')
  }

  const queues = Object.keys(mmr?.QueueSkills || {})
  report.say('')
  report.field('Queues on record', queues.length ? queues.join(', ') : 'NONE')

  const competitive = mmr?.QueueSkills?.competitive
  const bySeason = competitive?.SeasonalInfoBySeasonID || {}
  const acts = Object.entries(bySeason)

  report.say('')
  report.say(`  Ranked history: ${acts.length} act(s) on record`)
  for (const [actId, info] of acts) {
    const marker = actId === catalog.actId ? '  <- current act' : ''
    report.say(
      `    ${actId.slice(0, 8)}…  tier ${String(info.CompetitiveTier ?? 0).padStart(2)}` +
        `  ${String(info.RankedRating ?? 0).padStart(4)} RR` +
        `  ${info.NumberOfWins ?? 0}W / ${info.NumberOfGames ?? 0} games` +
        `${info.LeaderboardRank ? `  #${info.LeaderboardRank}` : ''}${marker}`,
    )
  }

  const latest = mmr?.LatestCompetitiveUpdate
  report.say('')
  if (latest && latest.MatchID) {
    const when = latest.MatchStartTime ? new Date(latest.MatchStartTime).toLocaleString() : 'unknown date'
    report.say(`  Last ranked match: tier ${latest.TierAfterUpdate}, ${latest.RankedRatingAfterUpdate} RR on ${when}`)
    report.say(`    recorded in act ${String(latest.SeasonID || '').slice(0, 8)}…`)
  } else {
    report.say('  Last ranked match: none on record')
  }

  const ranked = acts.filter(([, info]) => (info.CompetitiveTier || 0) > 0)
  report.say('')
  if (ranked.length || (latest && latest.TierAfterUpdate > 0)) {
    report.say('Verdict: rank data is present. If the overlay still reads Unranked, send')
    report.say('this file and rank-data.json on — the summary above says where it is.')
  } else {
    report.say('Verdict: Riot returns no ranked tier for this account in any act on record.')
    report.say('If you do have a rank in game, send rank-data.json on: it means the rank')
    report.say('is somewhere in the response that this tool is not reading.')
  }
}
