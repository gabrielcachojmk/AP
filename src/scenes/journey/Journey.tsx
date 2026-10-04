import { Suspense, lazy, useCallback, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import type { Tier } from '../../lib/gpu'
import { ScrollTrigger } from './useScrub'
import { MemoryScene } from './MemoryScene'
import { AdmirationScene } from './AdmirationScene'
import { PrideScene } from './PrideScene'
import { HomeScene } from './HomeScene'
import { HorizonScene } from './HorizonScene'
import { EchoScene } from './EchoScene'
import './journey.css'

const Backdrop = lazy(() => import('./Backdrop').then((m) => ({ default: m.Backdrop })))

type Props = {
  tier: Tier
  onRestart: () => void
  onLightChange: (light: boolean) => void
}

export function Journey({ tier, onRestart, onLightChange }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const lightCount = useRef(0)

  // Two light scenes can overlap during transitions; count instead of toggling.
  const handleLight = useCallback(
    (active: boolean) => {
      lightCount.current += active ? 1 : -1
      onLightChange(lightCount.current > 0)
    },
    [onLightChange],
  )

  useEffect(() => {
    window.scrollTo(0, 0)
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' })
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      gsap.ticker.lagSmoothing(500, 33)
    }
  }, [])

  return (
    <div className="journey" ref={root} data-tier={tier}>
      {tier === 'full' && (
        <Suspense fallback={null}>
          <Backdrop />
        </Suspense>
      )}
      <MemoryScene tier={tier} />
      <AdmirationScene />
      <PrideScene tier={tier} />
      <HomeScene tier={tier} />
      <HorizonScene tier={tier} onActive={handleLight} />
      <EchoScene onRestart={onRestart} onActive={handleLight} />
    </div>
  )
}
