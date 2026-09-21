import fs from 'node:fs'
import { request } from './http.js'
import { readLockfile, getEntitlements, getChatSession, getRegionLocale, shardFor } from './riot/localApi.js'
import { PlayerDataClient, getClientVersion } from './riot/pd.js'
import { TierCatalog } from './riot/tiers.js'

/**
 * Prints what the local Riot Client looks like from here. Run with --check
 * when the overlay cannot connect: it reports which endpoints answer, so the
 * difference between "not signed in", "stale lockfile" and "wrong process" is
 * visible rather than guessed at.
 */
export async function runCheck(config) {
  const line = (label, value) => console.log(`  ${label.padEnd(24)} ${value}`)
  console.log('\nVALORANT rank overlay — connection check\n')

  line('Lockfile path', config.lockfilePath)
  if (!fs.existsSync(config.lockfilePath)) {
    line('Lockfile', 'NOT FOUND')
    console.log(
      '\nVerdict: the Riot Client is not running, or it is installed somewhere\n' +
        'unusual. Start VALORANT and run this again. If it is running, set\n' +
        '"lockfilePath" in config.json to the real location.\n',
    )
    return
  }

  let lock
  try {
    lock = readLockfile(config.lockfilePath)
  } catch (err) {
    line('Lockfile', `unreadable — ${err.message}`)
    return
  }

  const age = Math.round((Date.now() - fs.statSync(config.lockfilePath).mtimeMs) / 1000)
  line('Lockfile', 'found')
  line('Client port', String(lock.port))
  line('Client process id', lock.pid)
  line('Written', `${age}s ago`)

  const auth = `Basic ${Buffer.from(`riot:${lock.password}`).toString('base64')}`
  const routes = [
    ['/entitlements/v1/token', 'auth tokens'],
    ['/chat/v1/session', 'account + region'],
    ['/chat/v4/presences', 'in-game status'],
    ['/riotclient/region-locale', 'region'],
  ]

  console.log('')
  const results = {}
  for (const [route, purpose] of routes) {
    try {
      const res = await request(`${lock.protocol}://127.0.0.1:${lock.port}${route}`, {
        headers: { Authorization: auth, Accept: 'application/json' },
        insecure: true,
        timeout: 5000,
      })
      results[route] = res.status
      line(`${res.status}`, `${route}  (${purpose})`)
    } catch (err) {
      results[route] = err.code || 'error'
      line(err.code || 'ERROR', `${route}  (${purpose}) — ${err.message}`)
    }
  }

  console.log('')
  const entitlements = results['/entitlements/v1/token']
  if (entitlements === 200) {
    await reportRankData(lock, config)
  } else if (entitlements === 404) {
    console.log(
      'Verdict: something is listening on that port but does not serve the Riot\n' +
        'Client API. Either the client is not finished signing in, or the lockfile\n' +
        'is left over from an earlier session and another program now has the port.\n\n' +
        'Fix: fully quit VALORANT *and* the Riot Client (check the system tray, and\n' +
        'End task on "Riot Client" / "RiotClientServices" in Task Manager), then\n' +
        'start VALORANT again and wait until you are at the play menu.\n',
    )
  } else if (typeof entitlements === 'string') {
    console.log(
      'Verdict: nothing answered on that port, so the lockfile is stale. Fully quit\n' +
        'VALORANT and the Riot Client, then start the game again.\n',
    )
  } else {
    console.log(`Verdict: unexpected response ${entitlements} from the client. Restart\nVALORANT; if it persists, send this output on.\n`)
  }
}

/**
 * With the client reachable, show what Riot actually returns for this account.
 * Which acts carry a rank, and what the last ranked match says, is the only
 * way to tell "genuinely unranked" from "read the wrong act".
 */
async function reportRankData(lock, config) {
  const line = (label, value) => console.log(`  ${label.padEnd(24)} ${value}`)
  try {
    const auth = await getEntitlements(lock)
    const session = await getChatSession(lock)
    const puuid = auth.puuid || session.puuid
    const region = session.region || (await getRegionLocale(lock))
    const shard = config.shard || shardFor(region)

    line('Account', `${session.name}#${session.tag}`)
    line('Player id', puuid ? `${puuid.slice(0, 8)}… (present)` : 'MISSING')
    line('Region / shard', `${region || 'unknown'} / ${shard}`)

    if (!puuid) {
      console.log('\nVerdict: the client has not published a player id yet. Wait until you\nare at the VALORANT play menu and run this again.\n')
      return
    }

    const version = await getClientVersion(config.valorantLogPath)
    line('Client version', version)

    const pd = new PlayerDataClient({ shard, auth, version })
    const mmr = await pd.getMmr(puuid)

    const catalog = new TierCatalog(config.cacheDir, config.overrideDir)
    await catalog.refreshAct()
    line('Current act (valorant-api)', catalog.actId || 'could not be determined')

    const bySeason = mmr?.QueueSkills?.competitive?.SeasonalInfoBySeasonID || {}
    const acts = Object.entries(bySeason)
    console.log(`\n  Ranked history: ${acts.length} act(s) on record`)
    for (const [actId, info] of acts) {
      const marker = actId === catalog.actId ? ' <- current' : ''
      console.log(
        `    ${actId.slice(0, 8)}…  tier ${String(info.CompetitiveTier ?? 0).padStart(2)}` +
          `  ${String(info.RankedRating ?? 0).padStart(3)} RR` +
          `  ${info.NumberOfWins ?? 0}W / ${info.NumberOfGames ?? 0} games${marker}`,
      )
    }

    const latest = mmr?.LatestCompetitiveUpdate
    if (latest?.MatchID) {
      const when = latest.MatchStartTime ? new Date(latest.MatchStartTime).toLocaleString() : 'unknown date'
      console.log(
        `\n  Last ranked match: tier ${latest.TierAfterUpdate}, ${latest.RankedRatingAfterUpdate} RR` +
          ` (${latest.RankedRatingEarned >= 0 ? '+' : ''}${latest.RankedRatingEarned}) on ${when}`,
      )
      console.log(`    in act ${String(latest.SeasonID || '').slice(0, 8)}…`)
    } else {
      console.log('\n  Last ranked match: none on record')
    }

    const ranked = acts.filter(([, info]) => (info.CompetitiveTier || 0) > 0)
    console.log('')
    if (ranked.length || latest?.TierAfterUpdate > 0) {
      console.log('Verdict: rank data is present and the overlay should show it. If it still\nreads Unranked, send this output on.\n')
    } else {
      console.log('Verdict: Riot reports no ranked tier for this account in any act on record,\nso the overlay is showing exactly what Riot returns. Finish placements (or\nplay a competitive game) and it will populate.\n')
    }
  } catch (err) {
    console.log(`\nCould not read rank data: ${err.message}`)
    if (err.body) console.log(`  response: ${err.body}`)
    console.log('')
  }
}
