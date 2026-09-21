import { EventEmitter } from 'node:events'
import { TierCatalog } from './riot/tiers.js'

/**
 * Stand-in for the real tracker so the overlay can be positioned and styled in
 * OBS without VALORANT running. Plays a fake ranked game every few seconds.
 */
export class MockTracker extends EventEmitter {
  constructor(config) {
    super()
    this.config = config
    this.catalog = new TierCatalog(config.cacheDir, config.overrideDir)
    this.tier = config.mockTier
    this.rr = config.mockRr
    this.status = 'menus'
    this.games = []
    this.sessionStartedAt = Date.now()
    this.state = this.buildState()
  }

  async start() {
    await this.catalog.refresh()
    this.publish()
    this.tick()
  }

  async tick() {
    for (;;) {
      await sleep(8000)
      this.status = 'ingame'
      this.publish()
      await sleep(6000)
      this.playGame()
      this.status = 'menus'
      this.publish()
    }
  }

  playGame() {
    const won = Math.random() > 0.45
    const swing = won ? 14 + Math.round(Math.random() * 12) : -(12 + Math.round(Math.random() * 10))
    this.rr += swing
    if (this.tier >= 24) {
      // Immortal and above: RR accumulates rather than resetting per tier.
      this.rr = Math.max(0, this.rr)
    } else {
      while (this.rr >= 100 && this.tier < 24) {
        this.rr -= 100
        this.tier += 1
      }
      while (this.rr < 0 && this.tier > 3) {
        this.rr += 100
        this.tier -= 1
      }
      if (this.tier <= 3 && this.rr < 0) this.rr = 0
    }
    this.games.push({
      id: `mock-${this.games.length}`,
      outcome: won ? 'win' : 'loss',
      rr: swing,
      tierAfter: this.tier,
      at: Date.now(),
    })
  }

  resetSession() {
    this.games = []
    this.sessionStartedAt = Date.now()
    this.publish()
  }

  buildState() {
    const tier = this.catalog.get(this.tier)
    const record = this.games.reduce(
      (acc, game) => {
        if (game.outcome === 'win') acc.wins += 1
        else if (game.outcome === 'loss') acc.losses += 1
        else acc.draws += 1
        acc.rrDelta += game.rr
        return acc
      },
      { wins: 0, losses: 0, draws: 0, rrDelta: 0 },
    )

    return {
      type: 'state',
      connected: true,
      mock: true,
      status: this.status,
      error: null,
      player: { name: 'MockPlayer', tag: 'DEMO', region: 'na' },
      rank: {
        tier: this.tier,
        name: tier.name,
        group: tier.group,
        division: tier.division,
        color: tier.color,
        icon: tier.icon,
        placementsLeft: null,
      },
      rr: this.rr,
      rrMax: this.tier >= 24 ? null : 100,
      leaderboardRank: 0,
      session: { ...record, games: this.games, startedAt: this.sessionStartedAt },
      act: { wins: 40 + record.wins, games: 71 + this.games.length },
      updatedAt: Date.now(),
    }
  }

  publish() {
    this.state = this.buildState()
    this.emit('update', this.state)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
