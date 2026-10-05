import { Suspense, lazy, useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Photo } from '../../content'
import type { Tier } from '../../lib/gpu'

export type PlaneState = {
  /** 1 = cover fit; >1 zooms in */
  zoom: number
  /** vertical parallax in uv units (-0.2..0.2) */
  offset: number
  /** paper-like ripple strength 0..1 */
  warp: number
  /** 0 = hidden, 1 = fully visible */
  reveal: number
}

export function createPlaneState(partial: Partial<PlaneState> = {}): { current: PlaneState } {
  return { current: { zoom: 1, offset: 0, warp: 0, reveal: 1, ...partial } }
}

type Props = {
  photo: Photo
  tier: Tier
  state: { current: PlaneState }
  className?: string
  /** warm colour grading strength 0..1 */
  warmth?: number
}

const PhotoPlaneGL = lazy(() => import('./PhotoPlaneGL').then((m) => ({ default: m.PhotoPlaneGL })))

function LitePlane({ photo, state, className }: Omit<Props, 'tier' | 'warmth'>) {
  const img = useRef<HTMLImageElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tick = () => {
      const s = state.current
      if (img.current) {
        img.current.style.transform = `scale(${s.zoom}) translateY(${(s.offset * 100).toFixed(2)}%)`
      }
      if (wrap.current) {
        const cut = ((1 - s.reveal) * 100).toFixed(2)
        wrap.current.style.clipPath = `inset(${cut}% 0 0 0)`
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [state])

  return (
    <div ref={wrap} className={`photo-plane photo-plane--lite ${className ?? ''}`}>
      <img ref={img} src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
    </div>
  )
}

/** A photo rendered as a WebGL plane with zoom, parallax, ripple and reveal; falls back to an <img>. */
export function PhotoPlane({ photo, tier, state, className, warmth = 0.6 }: Props) {
  if (tier === 'lite') return <LitePlane photo={photo} state={state} className={className} />

  return (
    <Suspense fallback={<LitePlane photo={photo} state={state} className={className} />}>
      <PhotoPlaneGL photo={photo} state={state} className={className} warmth={warmth} />
    </Suspense>
  )
}
