import { motion, useScroll } from 'framer-motion'

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left bg-signal"
      style={{ scaleX: scrollYProgress, boxShadow: '0 0 8px 1px rgba(255,122,51,0.6)' }}
    />
  )
}
