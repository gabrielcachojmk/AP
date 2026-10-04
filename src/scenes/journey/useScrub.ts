import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Build = (tl: gsap.core.Timeline, section: HTMLElement) => void

type Options = {
  /** Called when the section enters/leaves the viewport (used for chrome colour). */
  onActive?: (active: boolean) => void
  scrub?: number | boolean
}

/**
 * Creates a timeline scrubbed across a tall section whose inner frame is sticky.
 * Progress 0 = section top hits viewport top; 1 = section bottom hits viewport bottom.
 */
export function useScrub(build: Build, { onActive, scrub = 0.6 }: Options = {}) {
  const section = useRef<HTMLElement>(null)
  const buildRef = useRef(build)
  buildRef.current = build
  const activeRef = useRef(onActive)
  activeRef.current = onActive

  useEffect(() => {
    const el = section.current
    if (!el) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub,
          onToggle: (self) => activeRef.current?.(self.isActive),
        },
      })
      buildRef.current(tl, el)
    }, el)
    return () => ctx.revert()
  }, [scrub])

  return section
}

export { ScrollTrigger }
