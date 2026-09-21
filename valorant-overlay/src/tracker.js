import fs from 'node:fs'
import { EventEmitter } from 'node:events'
import {
  readLockfile,
  getEntitlements,
  getChatSession,
  getRegionLocale,
  shardFor,
  getSelfPresence,
} from './riot/localApi.js'
import { PlayerDataClient, getClientVersion } from './riot/pd.js'
import { TierCatalog } from './riot/tiers.js'

const MAX_OUTCOME_ATTEMPTS = 6

/**
 * Owns all of the polling and turns it into a single overlay-shaped state
 * object. Emits 'update' whenever that object changes.
 */
export class Tracker extends EventEmitter {
  constructor(config) {
    super()
    this.config = config
    this.catalog = new TierCatalog(config.cacheDir, config.overrideDir)
    this.lock = null
    this.auth = null
    this.identity = null
    this.pd = null

    this.presenceState = 'MENUS'
    this.lastMatchId = null
    this.matches = []
    this.outcomes = new Map()
    this.outcomeAttempts = new Map()
    this.settleUntil = 0
    this.mmr = null
    this.lastError = null
    this.lastSummary = null
    this.connected = false

    this.session = this.loadSession()
    this.state = this.buildState()
  }

  // ---------------------------------------------------------------- session

  loadSession() {
    try {
      const saved = JSON.parse(fs.readFileSync(this.config.stateFile, 'utf8'))
      const goneFor = Date.now() - (saved.lastSeen || 0)
      if (saved.startedAt && goneFor < this.config.sessionIdleResetMs) {
        if (saved.outcomes) for (const [id, outcome] of Object.entries(saved.outcomes)) this.outcomes.set(id, outcome)
        return { startedAt: saved.startedAt }
      }
    } catch {
      // No usable state file — start a fresh session.
    }
    return { startedAt: Date.now() }
  }

  saveSession() {
    try {
      fs.writeFileSync(
        this.config.stateFile,
        JSON.stringify(
          { startedAt: this.session.startedAt, lastSeen: Date.now(), outcomes: Object.fromEntries(this.outcomes) },
          null,
          2,
        ),
      )
    } catch (err) {
      console.error(`[tracker] could not persist session state: ${err.message}`)
    }
  }

  resetSession() {
    this.session = { startedAt: Date.now() }
    this.saveSession()
    this.publish()
  }

  // ------------------------------------------------------------- connection

  async connect() {
    this.lock = readLockfile(this.config.lockfilePath)
    this.auth = await getEntitlements(this.lock)
    const session = await getChatSession(this.lock)

    // The chat session publishes a name before it publishes a puuid, so take
    // the id from the entitlements token, where it is always present, and keep
    // chat for the display name only.
    const puuid = this.auth.puuid || session.puuid
    if (!puuid) {
      const err = new Error('Riot Client has not finished signing in')
      err.code = 'NO_PUUID'
      throw err
    }

    const region = session.region || (await getRegionLocale(this.lock))
    this.identity = { puuid, name: session.name, tag: session.tag, region }

    const shard = this.config.shard || shardFor(region)
    this.pd = new PlayerDataClient({ shard, auth: this.auth, version: await getClientVersion(this.config.valorantLogPath) })
    this.connected = true
    this.lastError = null
    console.log(`[tracker] connected as ${session.name}#${session.tag} (${shard})`)
  }

  async start() {
    await this.catalog.refresh()
    this.loop()
    this.presenceLoop()
    // Tier names and icons change between acts; a daily refresh is plenty.
    setInterval(() => this.catalog.refresh().catch(() => {}), 24 * 60 * 60 * 1000)
  }

  // ------------------------------------------------------------------ loops

  /**
   * Local presence is cheap and instant, so it runs on its own fast timer. The
   * INGAME -> MENUS transition is what opens the fast-poll settle window.
   */
  async presenceLoop() {
    for (;;) {
      if (this.connected) {
        try {
          const presence = await getSelfPresence(this.lock, this.identity.puuid)
          if (presence && presence.state !== this.presenceState) {
            const previous = this.presenceState
            this.presenceState = presence.state
            if (previous === 'INGAME' && presence.state !== 'INGAME') {
              console.log('[tracker] match ended — watching for the rank update')
              this.settleUntil = Date.now() + this.config.settleWindowMs
              this.refresh().catch(() => {})
            }
            this.publish()
          }
        } catch {
          // Presence failures are handled by the main loop's reconnect.
        }
      }
      await sleep(this.config.presenceIntervalMs)
    }
  }

  async loop() {
    for (;;) {
      try {
        if (!this.connected) await this.connect()
        await this.refresh()
      } catch (err) {
        this.handleFailure(err)
      }
      await sleep(this.pollInterval())
    }
  }

  pollInterval() {
    if (!this.connected) return 5000
    if (this.presenceState === 'INGAME' || Date.now() < this.settleUntil) return this.config.activePollMs
    return this.config.idlePollMs
  }

  handleFailure(err) {
    // Tokens die when the client restarts; drop them and reconnect next tick.
    this.connected = false
    this.lock = null
    this.auth = null
    this.pd = null
    const { short, detail } = describeFailure(err)
    // One line per change of state, so a long wait does not fill the console.
    if (this.lastError !== short) {
      this.lastError = short
      console.error(`[tracker] ${short}${detail ? ` — ${detail}` : ''}`)
      if (err.status === 404) console.error('[tracker] run check.bat for a full diagnosis')
    }
    this.publish()
  }

  // ------------------------------------------------------------------- data

  async refresh() {
    const mmr = await this.pd.getMmr(this.identity.puuid)
    this.mmr = mmr

    const latestId = mmr.LatestCompetitiveUpdate?.MatchID || null
    const isNewMatch = latestId && latestId !== this.lastMatchId
    if (isNewMatch) {
      this.lastMatchId = latestId
      this.settleUntil = 0
      this.matches = await this.pd.getCompetitiveUpdates(this.identity.puuid)
    } else if (!this.matches.length) {
      this.matches = await this.pd.getCompetitiveUpdates(this.identity.puuid)
    }

    await this.resolveOutcomes()
    this.saveSession()
    this.publish()
    this.reportRank()
  }

  /**
   * Say what was read, so the console answers "is it working?" on its own.
   * Only on change, so an idle session stays quiet.
   */
  reportRank() {
    const { rank, rr, session } = this.state
    const summary =
      rank.tier > 0
        ? `${rank.name} · ${rr} RR · session ${session.wins}-${session.losses}`
        : 'no ranked rating found for the current act — play a competitive game, or finish placements'
    if (summary === this.lastSummary) return
    this.lastSummary = summary
    console.log(`[tracker] ${summary}`)
  }

  /**
   * RR sign is a decent guess but a loss can still net positive RR at low
   * ranks, so confirm against match detail and cache the answer per match.
   */
  async resolveOutcomes() {
    const pending = this.sessionMatches().filter((m) => !this.outcomes.has(m.MatchID))
    for (const match of pending.slice(0, 3)) {
      const attempts = this.outcomeAttempts.get(match.MatchID) || 0
      if (attempts >= MAX_OUTCOME_ATTEMPTS) continue
      this.outcomeAttempts.set(match.MatchID, attempts + 1)
      try {
        const outcome = await this.pd.getMatchOutcome(match.MatchID, this.identity.puuid)
        if (outcome) this.outcomes.set(match.MatchID, outcome)
      } catch {
        // Match detail lags a little behind the RR update; retry next pass.
      }
    }
  }

  sessionMatches() {
    return this.matches
      .filter((m) => m.MatchStartTime >= this.session.startedAt)
      .sort((a, b) => a.MatchStartTime - b.MatchStartTime)
  }

  outcomeOf(match) {
    const known = this.outcomes.get(match.MatchID)
    if (known) return known
    if (match.RankedRatingEarned > 0) return 'win'
    if (match.RankedRatingEarned < 0) return 'loss'
    return 'draw'
  }

  // ------------------------------------------------------------------ state

  seasonalInfo() {
    const competitive = this.mmr?.QueueSkills?.competitive
    if (!competitive) return null
    const bySeason = competitive.SeasonalInfoBySeasonID || {}

    // The act valorant-api reports as live.
    if (this.catalog.actId && bySeason[this.catalog.actId]) return bySeason[this.catalog.actId]

    // Otherwise the act of the most recent ranked match, which is the current
    // act for anyone who has played one. This is the path taken whenever
    // valorant-api could not be reached.
    const latestActId = this.mmr?.LatestCompetitiveUpdate?.SeasonID
    if (latestActId && bySeason[latestActId]) return bySeason[latestActId]

    // Last resort. Key order here is Riot's, not chronological, so choose on
    // merit rather than position: an act you actually ranked in.
    const entries = Object.values(bySeason)
    const ranked = entries.filter((entry) => entry.CompetitiveTier > 0)
    if (!ranked.length) return entries.length ? entries[entries.length - 1] : null
    return ranked.reduce((best, entry) => ((entry.NumberOfGames || 0) >= (best.NumberOfGames || 0) ? entry : best))
  }

  /**
   * Tier and RR have to come from the same place or they contradict each
   * other. A tier of 0 means unranked, which is also how a stale act entry
   * looks, so fall through to the last ranked match when the act has no rank.
   */
  rankSource() {
    const seasonal = this.seasonalInfo()
    const latest = this.mmr?.LatestCompetitiveUpdate

    if (seasonal?.CompetitiveTier > 0) {
      return {
        tier: seasonal.CompetitiveTier,
        rr: seasonal.RankedRating || 0,
        leaderboard: seasonal.LeaderboardRank || 0,
        seasonal,
      }
    }
    if (latest?.TierAfterUpdate > 0) {
      return {
        tier: latest.TierAfterUpdate,
        rr: latest.RankedRatingAfterUpdate || 0,
        leaderboard: seasonal?.LeaderboardRank || 0,
        seasonal,
      }
    }
    return { tier: 0, rr: 0, leaderboard: 0, seasonal }
  }

  buildState() {
    const { tier: tierNumber, rr, leaderboard, seasonal } = this.rankSource()
    const tier = this.catalog.get(tierNumber)

    const games = this.sessionMatches().map((match) => ({
      id: match.MatchID,
      outcome: this.outcomeOf(match),
      rr: match.RankedRatingEarned,
      tierAfter: match.TierAfterUpdate,
      at: match.MatchStartTime,
    }))

    const record = games.reduce(
      (acc, game) => {
        if (game.outcome === 'win') acc.wins += 1
        else if (game.outcome === 'loss') acc.losses += 1
        else acc.draws += 1
        acc.rrDelta += game.rr
        return acc
      },
      { wins: 0, losses: 0, draws: 0, rrDelta: 0 },
    )

    const placementsLeft =
      tierNumber === 0 ? this.mmr?.QueueSkills?.competitive?.CurrentSeasonGamesNeededForRating ?? null : null

    return {
      type: 'state',
      connected: this.connected,
      mock: false,
      status: this.connected ? this.presenceState.toLowerCase() : 'offline',
      error: this.connected ? null : this.lastError,
      player: this.identity
        ? { name: this.identity.name, tag: this.identity.tag, region: this.identity.region }
        : null,
      rank: {
        tier: tierNumber,
        name: tier.name,
        group: tier.group,
        division: tier.division,
        color: tier.color,
        icon: tier.icon,
        placementsLeft,
      },
      rr,
      // Immortal and Radiant RR accumulates instead of resetting each tier, so
      // there is no 0-100 scale to draw a bar against.
      rrMax: tierNumber >= 24 ? null : 100,
      leaderboardRank: leaderboard,
      session: { ...record, games, startedAt: this.session.startedAt },
      act: seasonal ? { wins: seasonal.NumberOfWins || 0, games: seasonal.NumberOfGames || 0 } : null,
      updatedAt: Date.now(),
    }
  }

  publish() {
    const next = this.buildState()
    const changed = JSON.stringify(stripTimestamp(next)) !== JSON.stringify(stripTimestamp(this.state))
    this.state = next
    if (changed) this.emit('update', next)
  }
}

/**
 * Connection failures are shown on the overlay, which is on screen, so they
 * have to be short and free of URLs. The longer form goes to the console.
 */
function describeFailure(err) {
  if (err.code === 'NO_LOCKFILE') {
    return { short: 'VALORANT is not running', detail: 'waiting for it to start' }
  }
  if (err.code === 'NO_PUUID') {
    return { short: 'Riot Client is still signing in', detail: 'waiting for it to finish' }
  }
  if (err.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(err.message)) {
    return {
      short: 'Riot Client not responding',
      detail: 'its lockfile points at a port nothing is listening on — fully quit VALORANT and the Riot Client, then reopen',
    }
  }
  if (err.status === 404) {
    return {
      short: 'Waiting for the Riot Client',
      detail: 'it is not signed in yet, or an old lockfile is pointing somewhere wrong — reopen VALORANT and wait for the play menu',
    }
  }
  if (err.status === 401 || err.status === 403) {
    return { short: 'Riot Client refused the request', detail: 'restart VALORANT to refresh its credentials' }
  }
  return { short: 'Cannot reach the Riot Client', detail: err.message }
}

function stripTimestamp(state) {
  const copy = { ...state }
  delete copy.updatedAt
  return copy
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
