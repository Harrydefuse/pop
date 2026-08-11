import { useCallback, useEffect, useRef, useState } from 'react'

/** Where the bot's API lives. Vite proxies /api to it in dev. */
const API = import.meta.env.VITE_BOT_API ?? ''

/**
 * Trade ideas from the bot's screener.
 *
 * Deliberately not on the SSE stream: an ideas run costs a candle request per
 * symbol plus a model call per write-up, so it is fetched on demand and served
 * from the bot's cache. The server tells us whether what we got is stale and
 * whether a refresh is already running, and this hook polls only while one is
 * in flight — never on an idle page.
 */
export function useIdeas() {
  const [data, setData] = useState({ loading: true, error: null, result: null })
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/ideas`)
      const payload = await response.json()
      if (!mountedRef.current) return null
      if (!response.ok) throw new Error(payload.error ?? `api returned ${response.status}`)
      setData({ loading: false, error: null, result: payload })
      return payload
    } catch (error) {
      if (!mountedRef.current) return null
      setData((previous) => ({ ...previous, loading: false, error: error.message }))
      return null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  // Poll only while the bot says a scan is running, then stop. A dashboard left
  // open overnight should make no requests at all.
  const running = data.result?.running ?? false
  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [running, load])

  const rescan = useCallback(async () => {
    setData((previous) => ({ ...previous, error: null }))
    const response = await fetch(`${API}/api/ideas/scan`, { method: 'POST' })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setData((previous) => ({ ...previous, error: payload.error ?? `scan refused (${response.status})` }))
      return
    }
    // Reflect "running" immediately so the button and the polling loop engage
    // without waiting a round trip for the next state read.
    setData((previous) => ({ ...previous, result: { ...previous.result, running: true } }))
    load()
  }, [load])

  return { ...data, refresh: load, rescan }
}

/** The Pine script for one idea, fetched only when the user asks for it. */
export async function fetchPine(symbol) {
  const response = await fetch(`${API}/api/ideas/pine?symbol=${encodeURIComponent(symbol)}`)
  if (!response.ok) throw new Error(`no script available for ${symbol}`)
  return response.text()
}
