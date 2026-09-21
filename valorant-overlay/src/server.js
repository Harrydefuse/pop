import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

export function createServer(tracker, config) {
  const publicDir = path.join(config.root, 'public')
  const iconDir = path.join(config.cacheDir, 'icons')
  const clients = new Set()

  tracker.on('update', (state) => {
    const payload = `data: ${JSON.stringify(state)}\n\n`
    for (const client of clients) client.write(payload)
  })

  // Browser sources survive sleeping laptops better with a periodic ping.
  setInterval(() => {
    for (const client of clients) client.write(': ping\n\n')
  }, 15000).unref()

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const route = url.pathname

    if (route === '/events') return streamEvents(req, res)
    if (route === '/api/state') return json(res, tracker.state)
    if (route === '/api/debug') return json(res, { version: config.version, ...tracker.debugInfo() })
    if (route === '/debug') return sendFile(res, path.join(publicDir, 'debug.html'))
    if (route === '/api/session/reset' && req.method === 'POST') {
      tracker.resetSession()
      return json(res, { ok: true })
    }
    if (route.startsWith('/icons/')) return sendFile(res, path.join(iconDir, path.basename(route)))
    if (route === '/' || route === '/overlay') return sendFile(res, path.join(publicDir, 'overlay.html'))
    if (route === '/control') return sendFile(res, path.join(publicDir, 'control.html'))

    const asset = path.join(publicDir, path.normalize(route).replace(/^([/\\])+/, ''))
    if (asset.startsWith(publicDir) && fs.existsSync(asset) && fs.statSync(asset).isFile()) {
      return sendFile(res, asset)
    }
    res.writeHead(404).end('Not found')
  })

  function streamEvents(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    res.write(`data: ${JSON.stringify(tracker.state)}\n\n`)
    clients.add(res)
    req.on('close', () => clients.delete(res))
  }

  return server
}

function json(res, body) {
  const payload = JSON.stringify(body)
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(payload)
}

function sendFile(res, file) {
  if (!fs.existsSync(file)) return res.writeHead(404).end('Not found')
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  })
  fs.createReadStream(file).pipe(res)
}
