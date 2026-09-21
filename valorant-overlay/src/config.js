import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const defaults = {
  // Port the overlay + control page are served on.
  port: 3040,
  // Where session/record state is kept between restarts.
  stateFile: path.join(root, '.state.json'),
  // Drop your own rank art here as <tier>.png to override Riot's.
  overrideDir: path.join(root, 'public', 'ranks'),
  cacheDir: path.join(root, '.cache'),
  // Override only if the Riot Client is installed somewhere unusual.
  lockfilePath: path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'Riot Games',
    'Riot Client',
    'Config',
    'lockfile',
  ),
  // Read to determine the installed client version without going online.
  valorantLogPath: path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'VALORANT',
    'Saved',
    'Logs',
    'ShooterGame.log',
  ),
  // Override if region detection ever picks the wrong shard (na/eu/ap/kr).
  shard: null,
  // How often to read local presence for the in-game -> menus transition.
  presenceIntervalMs: 2000,
  // Background poll of rank data when nothing is happening.
  idlePollMs: 30000,
  // Poll rate while in a match or right after one ends.
  activePollMs: 3000,
  // How long to keep fast-polling after a match ends, waiting for RR to land.
  settleWindowMs: 180000,
  // Starting rank for --mock: Immortal 2 at 60 RR.
  mockTier: 25,
  mockRr: 60,
  // Reset the session record automatically if the agent was down this long.
  sessionIdleResetMs: 6 * 60 * 60 * 1000,
}

export function loadConfig() {
  const file = path.join(root, 'config.json')
  let fromFile = {}
  if (fs.existsSync(file)) {
    try {
      fromFile = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (err) {
      console.error(`[config] config.json could not be parsed, using defaults: ${err.message}`)
    }
  }

  const config = { ...defaults, ...fromFile, root }
  if (process.env.PORT) config.port = Number(process.env.PORT)
  config.mock = process.argv.includes('--mock')
  fs.mkdirSync(config.cacheDir, { recursive: true })
  return config
}
