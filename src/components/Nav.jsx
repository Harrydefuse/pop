import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LINKS = [
  { href: '#features', label: 'Capabilities' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-panel-line bg-panel/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          <span className="font-display text-2xl font-semibold uppercase tracking-wide text-ink">Relay</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[13px] uppercase tracking-wider text-ink-dim transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#pricing"
          className="rounded-sm border border-signal/60 bg-signal/10 px-4 py-2 font-mono text-[13px] uppercase tracking-wider text-signal transition-colors hover:bg-signal hover:text-panel"
        >
          Start free
        </a>
      </nav>
    </motion.header>
  )
}
