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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // An unregistrable worker (private mode, a host without HTTPS) costs the
      // user nothing — the app still runs, it just won't run offline.
    })
  })
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
