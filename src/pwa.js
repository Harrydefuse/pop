/**
 * Everything to do with LVL100 being an app you keep rather than a page you
 * visit: the service worker that makes it run with no signal, and the
 * home-screen install prompt.
 */

const isBrowser = typeof window !== 'undefined'

/**
 * The single-file build inlines every asset into one document and is opened
 * off `file:`. There is nothing to fetch and no origin to control, so
 * registering there would only throw.
 */
function canRegister() {
  if (!isBrowser || !('serviceWorker' in navigator)) return false
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return false
  return document.querySelector('script[src]') !== null
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !canRegister()) return
  // After load, so the first paint never competes with the precache download.
  window.addEventListener('load', async () => {
    // Relative to the base, so it works at a domain root and under a project
    // page's subdirectory alike.
    const base = import.meta.env.BASE_URL
    let reg
    try {
      reg = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base })
    } catch {
      // An unregistrable worker (private mode, a host without HTTPS) costs the
      // user nothing — the app still runs, it just won't run offline.
      return
    }

    // A new build downloads itself and then waits, because taking over mid
    // workout would throw away a running timer. So say it is there and let the
    // person pick the moment.
    const watch = (worker) => {
      if (!worker) return
      const check = () => worker.state === 'installed' && navigator.serviceWorker.controller && offerUpdate(reg)
      check()
      worker.addEventListener('statechange', check)
    }
    watch(reg.waiting)
    reg.addEventListener('updatefound', () => watch(reg.installing))

    // Ask again whenever the app comes back to the front. A phone on the home
    // screen can sit for days between opens; without this it would only look
    // for a new build on a cold start.
    let last = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || Date.now() - last < 60000) return
      last = Date.now()
      reg.update().catch(() => {})
    })

    // The reload happens once the new worker is actually in charge, not when
    // it is asked to take over — otherwise the old bundle loads again. Only
    // when this tab asked for it, though: the first worker of all claims the
    // page as soon as it activates, and reloading on that would mean every
    // first visit bounced for no reason.
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!asked || reloading) return
      reloading = true
      window.location.reload()
    })
  })
}

/* ------------------------------------------------------------ new versions */

let waiting = null
let asked = false
const updateListeners = new Set()

function offerUpdate(reg) {
  if (waiting) return
  waiting = reg.waiting ?? reg.installing
  updateListeners.forEach((fn) => fn())
}

export const updateReady = () => waiting !== null

export function subscribeUpdate(fn) {
  updateListeners.add(fn)
  return () => updateListeners.delete(fn)
}

/** Hand over to the build that is waiting. The page reloads by itself after. */
export function applyUpdate() {
  if (!waiting) return
  asked = true
  waiting.postMessage({ type: 'SKIP_WAITING' })
}

/* ----------------------------------------------------------------- install */

let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

if (isBrowser) {
  // Captured at module load: Chrome fires this once, early, and if nobody
  // calls preventDefault the chance to prompt is gone.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export const isStandalone = () =>
  isBrowser &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true)

/** iOS has no install prompt at all — it wants the share sheet instead. */
export const isIOS = () =>
  isBrowser &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent)

export function subscribeInstall(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const canInstall = () => deferred !== null

/** Returns true if the user accepted. Resolves false if there was no prompt. */
export async function promptInstall() {
  if (!deferred) return false
  const e = deferred
  deferred = null
  notify()
  e.prompt()
  const { outcome } = await e.userChoice
  return outcome === 'accepted'
}
