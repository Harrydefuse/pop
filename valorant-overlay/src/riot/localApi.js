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

// LATAM and BR accounts live on the NA shard; everything else matches.
const SHARDS = { na: 'na', latam: 'na', br: 'na', eu: 'eu', ap: 'ap', kr: 'kr' }

export function shardFor(region) {
  return SHARDS[region] || 'na'
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
