import { createHash } from 'node:crypto'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Files that are never worth carrying around on a phone. */
const SKIP = /(^|\/)(sw\.js|\.DS_Store)$/

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, root, out)
    else out.push('/' + relative(root, full).split('\\').join('/'))
  }
  return out
}

/**
 * Writes `dist/sw.js` after the bundle is emitted, with the list of files to
 * precache baked in. A generated list means the hashed asset names are always
 * right, and a hash of that list becomes the cache name, so a deploy that
 * changes nothing does not throw away a phone's cache.
 *
 * Rolled by hand rather than pulling in a plugin: the whole worker is sixty
 * lines and we want to be able to read it.
 */
function serviceWorker() {
  let base = '/'
  return {
    name: 'lvl100-service-worker',
    apply: 'build',
    configResolved(config) {
      // A project page is served from a subdirectory, so every path the worker
      // caches — and the scope it claims — hangs off the base rather than root.
      base = config.base
    },
    closeBundle() {
      const dist = join(process.cwd(), 'dist')
      let files
      try {
        files = walk(dist)
      } catch {
        return // nothing was emitted (e.g. a library build) — nothing to cache
      }
      const kept = files.filter((f) => !SKIP.test(f)).sort()
      const version = createHash('sha256')
        .update(kept.map((f) => f + ':' + statSync(join(dist, f)).size).join('\n'))
        .digest('hex')
        .slice(0, 12)
      const precache = kept.map((f) => base.replace(/\/$/, '') + f)

      writeFileSync(join(dist, 'sw.js'), worker(version, precache, base))
    },
  }
}

const worker = (version, precache, base) => `// Generated at build time. Do not edit by hand.
const CACHE = 'lvl100-${version}'
const SHELL = '${base}index.html'
const PRECACHE = ${JSON.stringify(precache, null, 2)}

// Take a copy of everything on install so the first offline launch works even
// if the user never visited a second screen.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  )
})

// Deliberately no skipWaiting: a new build waits until every tab is closed.
// Swapping the bundle under a running rest timer would lose the session.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const cacheable = (res) => res && res.status === 200 && res.type === 'basic'

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Map tiles and anything else off-origin go straight to the network and are
  // never stored — a cached tile set would be stale and enormous.
  if (url.origin !== self.location.origin) return

  // Navigations: try the network so a fresh deploy is picked up, fall back to
  // the cached shell. Hash routing means every deep link is the same document.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (cacheable(res)) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(SHELL, copy))
          }
          return res
        })
        .catch(() => caches.match(SHELL).then((hit) => hit ?? Response.error())),
    )
    return
  }

  // Everything else is content-hashed or static: serve from the cache first and
  // only reach for the network when we have never seen it.
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit
      return fetch(req).then((res) => {
        if (cacheable(res)) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
        }
        return res
      })
    }),
  )
})
`

// https://vite.dev/config/
export default defineConfig({
  // Root by default; a project page lives under /<repo>/, so the deploy sets
  // VITE_BASE and every asset, the manifest and the worker follow it.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), serviceWorker()],
})
