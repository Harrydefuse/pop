import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Site from './site/Site.jsx'

/**
 * Hash routing on purpose: `#/app` deep-links straight into the prototype and
 * survives a refresh on any static host, with no server rewrite rule to forget.
 */
const readRoute = () => (window.location.hash.startsWith('#/app') ? 'app' : 'site')

export function Root() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  if (route === 'app') return <App onExit={() => { window.location.hash = '' }} />
  return <Site onEnterApp={() => { window.location.hash = '#/app' }} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
