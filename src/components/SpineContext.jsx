import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const SpineContext = createContext(null)

export function SpineProvider({ children }) {
  const [nodes, setNodes] = useState([])

  const register = useCallback((id, label, ref) => {
    setNodes((prev) => {
      if (prev.some((n) => n.id === id)) return prev
      return [...prev, { id, label, ref }]
    })
  }, [])

  return <SpineContext.Provider value={{ nodes, register }}>{children}</SpineContext.Provider>
}

export function useSpineNode(id, label) {
  const ref = useRef(null)
  const ctx = useContext(SpineContext)

  useEffect(() => {
    if (!ctx) return
    ctx.register(id, label, ref)
  }, [ctx, id, label])

  return ref
}

export function useSpineNodes() {
  const ctx = useContext(SpineContext)
  return ctx ? ctx.nodes : []
}
