import fs from 'node:fs'
import { getJson } from '../http.js'

/**
 * The Riot Client writes a lockfile while it runs containing the port and
 * password for its local API. Format: name:pid:port:password:protocol
 */
export function readLockfile(lockfilePath) {
  if (!fs.existsSync(lockfilePath)) {
    const err = new Error('Riot Client lockfile not found — is VALORANT running?')
    err.code = 'NO_LOCKFILE'
    throw err
  }
  const parts = fs.readFileSync(lockfilePath, 'utf8').trim().split(':')
  if (parts.length < 5) throw new Error('Riot Client lockfile is malformed')
  const [name, pid, port, password, protocol] = parts
  return { name, pid, port: Number(port), password, protocol }
}

function localHeaders(lock) {
  return {
    Authorization: `Basic ${Buffer.from(`riot:${lock.password}`).toString('base64')}`,
    Accept: 'application/json',
  }
}

function localUrl(lock, route) {
  return `${lock.protocol}://127.0.0.1:${lock.port}${route}`
}

async function localGet(lock, route) {
  return getJson(localUrl(lock, route), { headers: localHeaders(lock), insecure: true, timeout: 5000 })
}

/** Access token + entitlement needed to talk to Riot's player-data endpoints. */
export async function getEntitlements(lock) {
  const data = await localGet(lock, '/entitlements/v1/token')
  return { accessToken: data.accessToken, entitlementsToken: data.token, puuid: data.subject }
}

/** Riot ID and the account's region, straight from the running client. */
export async function getChatSession(lock) {
  const data = await localGet(lock, '/chat/v1/session')
  return {
    puuid: data.puuid,
    name: data.game_name,
    tag: data.game_tag,
    region: (data.region || '').toLowerCase(),
  }
}

/**
 * The client's own region, used when the chat session has not published one
 * yet. Returned uppercase, unlike the chat session's.
 */
export async function getRegionLocale(lock) {
  try {
    const data = await localGet(lock, '/riotclient/region-locale')
    return (data.region || '').toLowerCase()
  } catch {
    return ''
  }
}

// LATAM and BR accounts live on the NA shard; everything else matches.
/**
 * The client reports platform-style region codes (la1, br1, oc1 …) as well as
 * plain ones, and several regions share a play shard. Anything unrecognised
 * falls back to na, and the tracker then probes for the right one.
 */
const SHARDS = {
  na: 'na', na1: 'na', latam: 'na', la1: 'na', la2: 'na', br: 'na', br1: 'na',
  eu: 'eu', eu1: 'eu', euw1: 'eu', eun1: 'eu', ru: 'eu', tr1: 'eu',
  ap: 'ap', oc1: 'ap', sg2: 'ap', ph2: 'ap', th2: 'ap', tw2: 'ap', vn2: 'ap', jp1: 'ap',
  kr: 'kr', kr1: 'kr',
}

export const ALL_SHARDS = ['na', 'ap', 'eu', 'kr']

export function shardFor(region) {
  return SHARDS[String(region || '').toLowerCase()] || 'na'
}

/**
 * Presence carries a base64 blob with the session loop state
 * (MENUS / PREGAME / INGAME) — the fastest local signal that a match ended.
 */
export async function getSelfPresence(lock, puuid) {
  const data = await localGet(lock, '/chat/v4/presences')
  const mine = (data.presences || []).find((p) => p.puuid === puuid)
  if (!mine || !mine.private) return null
  try {
    const decoded = JSON.parse(Buffer.from(mine.private, 'base64').toString('utf8'))
    return {
      state: decoded.sessionLoopState || 'MENUS',
      queueId: decoded.queueId || '',
      partySize: decoded.partySize || 1,
      competitiveTier: decoded.competitiveTier ?? null,
      matchMap: decoded.matchMap || '',
    }
  } catch {
    return null
  }
}
