import { useCallback, useEffect, useRef, useState } from 'react'

/** Where the bot's API lives. Vite proxies /api to it in dev. */
const API = import.meta.env.VITE_BOT_API ?? ''

const EMPTY = {
  connected: false,
  loading: true,
  error: null,
  state: null,
  feed: [],
  activity: [],
  equity: [],
}

/**
 * One connection to the bot: a REST snapshot for initial state, then an SSE
 * stream for live updates. If the stream drops, we fall back to polling and
 * keep trying to reconnect — the dashboard should degrade to "slightly stale"
 * rather than to a blank screen.
 */
export function useBotStream({ pollMs = 15_000 } = {}) {
  const [data, setData] = useState(EMPTY)
  const sourceRef = useRef(null)
  const mountedRef = useRef(true)

  const loadSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/state`)
      if (!response.ok) throw new Error(`api returned ${response.status}`)
      const payload = await response.json()
      if (!mountedRef.current) return
      setData((previous) => ({
        ...previous,
        loading: false,
        error: null,
        state: payload,
        feed: payload.feed ?? [],
        activity: payload.activity ?? [],
        equity: payload.equity ?? [],
      }))
    } catch (error) {
      if (!mountedRef.current) return
      setData((previous) => ({ ...previous, loading: false, error: error.message }))
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadSnapshot()

    let retryTimer = null
    const connect = () => {
      const source = new EventSource(`${API}/api/stream`)
      sourceRef.current = source

      source.addEventListener('open', () => {
        setData((previous) => ({ ...previous, connected: true, error: null }))
      })

      const patchState = (patch) =>
        setData((previous) => ({ ...previous, state: previous.state ? { ...previous.state, ...patch } : previous.state }))

      source.addEventListener('snapshot', (event) => {
        patchState(JSON.parse(event.data))
        setData((previous) => ({ ...previous, connected: true }))
      })
      source.addEventListener('stage', (event) => patchState({ stage: JSON.parse(event.data).stage }))
      source.addEventListener('waiting', (event) => patchState(JSON.parse(event.data)))
      source.addEventListener('cycle:start', () => patchState({ stage: 'starting' }))

      source.addEventListener('cycle:end', (event) => {
        const { summary, sample } = JSON.parse(event.data)
        setData((previous) => ({
          ...previous,
          state: { ...previous.state, ...summary },
          equity: sample ? [...previous.equity, sample].slice(-500) : previous.equity,
        }))
      })

      source.addEventListener('decisions', (event) => {
        const decisions = JSON.parse(event.data)
        setData((previous) => ({ ...previous, feed: [...decisions, ...previous.feed].slice(0, 120) }))
      })

      source.addEventListener('activity', (event) => {
        const entry = JSON.parse(event.data)
        setData((previous) => ({ ...previous, activity: [entry, ...previous.activity].slice(0, 60) }))
      })

      // Positions change on open/close; refresh the authoritative snapshot.
      source.addEventListener('position:open', loadSnapshot)
      source.addEventListener('position:close', loadSnapshot)

      source.addEventListener('error', () => {
        setData((previous) => ({ ...previous, connected: false }))
        source.close()
        // EventSource retries on its own, but only for transient failures —
        // a bot that was stopped and restarted needs a fresh connection.
        retryTimer = setTimeout(connect, 4000)
      })
    }

    connect()
    const poll = setInterval(() => {
      if (!sourceRef.current || sourceRef.current.readyState !== EventSource.OPEN) loadSnapshot()
    }, pollMs)

    return () => {
      mountedRef.current = false
      clearInterval(poll)
      if (retryTimer) clearTimeout(retryTimer)
      sourceRef.current?.close()
    }
  }, [loadSnapshot, pollMs])

  const scanNow = useCallback(async () => {
    await fetch(`${API}/api/scan`, { method: 'POST' })
  }, [])

  return { ...data, refresh: loadSnapshot, scanNow }
}
