import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useTransform, animate } from 'framer-motion'

export default function CountUp({ to, decimals = 0, suffix = '', prefix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`)
  const nodeRef = useRef(null)

  useEffect(() => {
    if (!inView) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const controls = animate(count, to, { duration: reduced ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [inView, to, count])

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (nodeRef.current) nodeRef.current.textContent = v
    })
  }, [rounded])

  return (
    <span ref={ref}>
      <span ref={nodeRef}>{prefix}0{suffix}</span>
    </span>
  )
}
