import fs from 'node:fs'
import { EventEmitter } from 'node:events'
import { readLockfile, getEntitlements, getChatSession, shardFor, getSelfPresence } from './riot/localApi.js'
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
    this.identity = await getChatSession(this.lock)
    const shard = this.config.shard || shardFor(this.identity.region)
    this.pd = new PlayerDataClient({ shard, auth: this.auth, version: await getClientVersion(this.config.valorantLogPath) })
    this.connected = true
    this.lastError = null
    console.log(`[tracker] connected as ${this.identity.name}#${this.identity.tag} (${shard})`)
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
    const waiting = err.code === 'NO_LOCKFILE'
    const message = waiting ? 'VALORANT is not running' : err.message
    // One line per change of state, so a long wait does not fill the console.
    if (this.lastError !== message) {
      this.lastError = message
      console.error(`[tracker] ${message}${waiting ? ' — waiting for it to start' : ''}`)
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
    if (this.catalog.actId && bySeason[this.catalog.actId]) return bySeason[this.catalog.actId]
    // Fall back to the most recently played act.
    const entries = Object.values(bySeason)
    return entries.length ? entries[entries.length - 1] : null
  }

  buildState() {
    const seasonal = this.seasonalInfo()
    const latest = this.mmr?.LatestCompetitiveUpdate
    const tierNumber = seasonal?.CompetitiveTier ?? latest?.TierAfterUpdate ?? 0
    const rr = seasonal?.RankedRating ?? latest?.RankedRatingAfterUpdate ?? 0
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
      rrMax: 100,
      leaderboardRank: seasonal?.LeaderboardRank || 0,
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

function stripTimestamp(state) {
  const copy = { ...state }
  delete copy.updatedAt
  return copy
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
