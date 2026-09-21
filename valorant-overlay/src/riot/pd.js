import fs from 'node:fs'
import { getJson } from '../http.js'

// Riot rejects player-data requests without a plausible client platform header.
const CLIENT_PLATFORM = Buffer.from(
  JSON.stringify({
    platformType: 'PC',
    platformOS: 'Windows',
    platformOSVersion: '10.0.19042.1.256.64bit',
    platformChipset: 'Unknown',
  }),
).toString('base64')

let cachedVersion = null
let cachedVersionAt = 0

/**
 * VALORANT's own log records the build it is running, which is both exact and
 * available offline. Preferred over the web lookup for that reason.
 */
function versionFromLog(logPath) {
  if (!logPath || !fs.existsSync(logPath)) return null
  // Only the header of the log holds the build banner, and the file is large.
  const handle = fs.openSync(logPath, 'r')
  try {
    const buffer = Buffer.alloc(64 * 1024)
    const read = fs.readSync(handle, buffer, 0, buffer.length, 0)
    const head = buffer.subarray(0, read).toString('utf8')
    const branch = head.match(/Branch:\s*(\S+)/)
    const build = head.match(/Build version:\s*(\d+)/)
    const changelist = head.match(/Changelist:\s*(\d+)/)
    if (!branch || !build || !changelist) return null
    return `${branch[1]}-shipping-${build[1]}-${changelist[1]}`
  } catch {
    return null
  } finally {
    fs.closeSync(handle)
  }
}

/**
 * VALORANT logs the endpoints it actually talks to, which names the shard this
 * installation really plays on. More reliable than mapping a region code,
 * because the client reports codes that do not map one-to-one onto shards.
 */
export function shardFromLog(logPath) {
  if (!logPath || !fs.existsSync(logPath)) return null
  let text = ''
  const handle = fs.openSync(logPath, 'r')
  try {
    const size = fs.fstatSync(handle).size
    const span = Math.min(size, 4 * 1024 * 1024)
    const buffer = Buffer.alloc(span)
    fs.readSync(handle, buffer, 0, span, 0)
    text = buffer.toString('utf8')
  } catch {
    return null
  } finally {
    fs.closeSync(handle)
  }

  // glz-{region}-{n}.{shard}.a.pvp.net names both; pd.{shard} names the shard.
  const glz = text.match(/glz-([a-z0-9]+)-\d+\.([a-z0-9]+)\.a\.pvp\.net/i)
  if (glz) return { region: glz[1].toLowerCase(), shard: glz[2].toLowerCase() }
  const pd = text.match(/\bpd\.([a-z0-9]+)\.a\.pvp\.net/i)
  if (pd) return { region: null, shard: pd[1].toLowerCase() }
  return null
}

/** The live client version, required as a header on player-data requests. */
export async function getClientVersion(logPath) {
  if (cachedVersion && Date.now() - cachedVersionAt < 60 * 60 * 1000) return cachedVersion

  const local = versionFromLog(logPath)
  if (local) {
    cachedVersion = local
    cachedVersionAt = Date.now()
    return cachedVersion
  }

  try {
    const data = await getJson('https://valorant-api.com/v1/version')
    cachedVersion = data.data.riotClientVersion
    cachedVersionAt = Date.now()
  } catch {
    // A stale version string still works for these endpoints far more often
    // than no version string at all.
    cachedVersion = cachedVersion || 'release-10.00-shipping-0-000000'
  }
  return cachedVersion
}

/** Guards against requesting /players/ with nothing on the end of it. */
function requirePuuid(puuid) {
  if (!puuid) throw new Error('No player id available from the Riot Client yet')
  return puuid
}

/**
 * A record that came back successfully but holds no ranked history at all.
 * Usually means the right player queried on the wrong shard.
 */
export function isEmptyMmr(mmr) {
  if (!mmr) return true
  const seasonal = mmr.QueueSkills?.competitive?.SeasonalInfoBySeasonID
  const hasSeasons = seasonal && Object.keys(seasonal).length > 0
  return !hasSeasons && !mmr.LatestCompetitiveUpdate?.MatchID
}

export class PlayerDataClient {
  constructor({ shard, auth, version }) {
    this.shard = shard
    this.auth = auth
    this.version = version
  }

  get base() {
    return `https://pd.${this.shard}.a.pvp.net`
  }

  headers() {
    return {
      Authorization: `Bearer ${this.auth.accessToken}`,
      'X-Riot-Entitlements-JWT': this.auth.entitlementsToken,
      'X-Riot-ClientPlatform': CLIENT_PLATFORM,
      'X-Riot-ClientVersion': this.version,
      Accept: 'application/json',
    }
  }

  /** Current tier, RR, act record and the most recent ranked match. */
  async getMmr(puuid) {
    return getJson(`${this.base}/mmr/v1/players/${requirePuuid(puuid)}`, { headers: this.headers() })
  }

  /** Recent competitive matches with the RR gained or lost on each. */
  async getCompetitiveUpdates(puuid, count = 20) {
    const data = await getJson(
      `${this.base}/mmr/v1/players/${requirePuuid(puuid)}/competitiveupdates?startIndex=0&endIndex=${count}&queue=competitive`,
      { headers: this.headers() },
    )
    return data.Matches || []
  }

  /**
   * Full match detail. Only used to settle win/loss/draw accurately — the sign
   * of RR earned is a good guess but not always right.
   */
  async getMatchOutcome(matchId, puuid) {
    const data = await getJson(`${this.base}/match-details/v1/matches/${matchId}`, { headers: this.headers() })
    const player = (data.players || []).find((p) => p.subject === puuid)
    if (!player) return null
    const teams = data.teams || []
    const mine = teams.find((t) => t.teamId === player.teamId)
    if (!mine) return null
    if (mine.won) return 'win'
    const other = teams.find((t) => t.teamId !== player.teamId)
    if (other && other.roundsWon === mine.roundsWon) return 'draw'
    return 'loss'
  }
}
