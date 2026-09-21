import fs from 'node:fs'
import path from 'node:path'
import { getJson, request } from '../http.js'

const GROUPS = [
  ['Unranked', '#8B8F94', 0, 0],
  ['Iron', '#5F5F5F', 3, 5],
  ['Bronze', '#9C6B3E', 6, 8],
  ['Silver', '#9CA3A8', 9, 11],
  ['Gold', '#E2C96B', 12, 14],
  ['Platinum', '#46A3C4', 15, 17],
  ['Diamond', '#C18BE8', 18, 20],
  ['Ascendant', '#2BB36A', 21, 23],
  ['Immortal', '#B63B52', 24, 26],
  ['Radiant', '#FFEC99', 27, 27],
]

/** Offline fallback so the overlay still renders if valorant-api is unreachable. */
function fallbackTiers() {
  const tiers = {}
  for (const [name, color, from, to] of GROUPS) {
    for (let tier = from; tier <= to; tier += 1) {
      const division = from === to ? '' : String(tier - from + 1)
      tiers[tier] = {
        tier,
        name: division ? `${name} ${division}` : name,
        group: name,
        division,
        color,
        icon: null,
      }
    }
  }
  return tiers
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function hexFromRiot(color) {
  if (!color || color.length < 6) return null
  return `#${color.slice(0, 6).toUpperCase()}`
}

export class TierCatalog {
  constructor(cacheDir) {
    this.iconDir = path.join(cacheDir, 'icons')
    this.tiers = fallbackTiers()
    this.actId = null
    fs.mkdirSync(this.iconDir, { recursive: true })
  }

  /** Pull live tier names, colors and icons, plus the current act's id. */
  async refresh() {
    await Promise.all([this.refreshTiers(), this.refreshAct()])
  }

  async refreshTiers() {
    try {
      const data = await getJson('https://valorant-api.com/v1/competitivetiers')
      const current = data.data[data.data.length - 1]
      for (const tier of current.tiers) {
        const group = titleCase(tier.divisionName || '')
        const name = titleCase(tier.tierName || '')
        if (!name || name === 'Unused') continue
        this.tiers[tier.tier] = {
          tier: tier.tier,
          name,
          group,
          division: name.replace(group, '').trim(),
          color: hexFromRiot(tier.color) || this.tiers[tier.tier]?.color || '#8B8F94',
          icon: tier.largeIcon || null,
        }
      }
      await this.cacheIcons()
    } catch (err) {
      console.error(`[tiers] falling back to built-in tier names: ${err.message}`)
    }
  }

  async refreshAct() {
    try {
      const data = await getJson('https://valorant-api.com/v1/seasons')
      const now = Date.now()
      const act = data.data.find(
        (season) =>
          season.parentUuid &&
          new Date(season.startTime).getTime() <= now &&
          new Date(season.endTime).getTime() > now,
      )
      if (act) this.actId = act.uuid
    } catch (err) {
      console.error(`[tiers] could not determine the current act: ${err.message}`)
    }
  }

  /** Store icons locally so the overlay renders even without internet in OBS. */
  async cacheIcons() {
    await Promise.all(
      Object.values(this.tiers).map(async (tier) => {
        if (!tier.icon) return
        const file = path.join(this.iconDir, `${tier.tier}.png`)
        if (fs.existsSync(file)) return
        try {
          const res = await request(tier.icon, { timeout: 15000 })
          if (res.status === 200) fs.writeFileSync(file, res.buffer)
        } catch {
          // The overlay falls back to the remote URL.
        }
      }),
    )
  }

  get(tier) {
    const known = this.tiers[tier]
    if (known) {
      const cached = path.join(this.iconDir, `${tier}.png`)
      return {
        ...known,
        localIcon: fs.existsSync(cached) ? `/icons/${tier}.png` : null,
      }
    }
    return { tier, name: 'Unranked', group: 'Unranked', division: '', color: '#8B8F94', icon: null, localIcon: null }
  }
}
