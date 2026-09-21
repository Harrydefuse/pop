import { loadConfig } from './config.js'
import { Tracker } from './tracker.js'
import { MockTracker } from './mock.js'
import { createServer } from './server.js'

const config = loadConfig()
const tracker = config.mock ? new MockTracker(config) : new Tracker(config)

const server = createServer(tracker, config)
server.listen(config.port, '127.0.0.1', () => {
  console.log('')
  console.log('  VALORANT rank overlay')
  console.log(`  Overlay  →  http://localhost:${config.port}/overlay   (add this as an OBS Browser Source)`)
  console.log(`  Controls →  http://localhost:${config.port}/control`)
  if (config.mock) console.log('  Running in --mock mode: data is fake, a game "finishes" every few seconds.')
  console.log('')
})

tracker.start().catch((err) => {
  console.error(`[fatal] ${err.message}`)
  process.exit(1)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close()
    process.exit(0)
  })
}
