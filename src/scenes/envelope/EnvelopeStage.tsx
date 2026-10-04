import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Tier } from '../../lib/gpu'
import { isTierForced, watchFps } from '../../lib/gpu'
import { sound } from '../../lib/audio'
import { scenes } from '../../content'
import { Handwriting, type HandwritingHandle } from '../../components/Handwriting'
import type { EnvelopeHandle } from './Envelope3D'
import { EnvelopeLite } from './EnvelopeLite'
import './envelope.css'

// WebGL stack only ships to devices that will actually use it.
const Envelope3D = lazy(() => import('./Envelope3D').then((m) => ({ default: m.Envelope3D })))

type Props = {
  tier: Tier
  onDegrade: () => void
  onOpened: () => void
}

/** If the scene ever fails to report back, keep the story moving. */
const OPEN_TIMEOUT_MS = 9000
/** Upper bound for the handwritten line; only matters if the engine never fires onComplete. */
const LINE_TIMEOUT_MS = 12000

export function EnvelopeStage({ tier, onDegrade, onOpened }: Props) {
  // Separate refs per variant: R3F tears its scene down on a later tick, and that
  // late ref cleanup would otherwise null out a handle the lite envelope just set.
  const envelope3d = useRef<EnvelopeHandle>(null)
  const envelopeLite = useRef<EnvelopeHandle>(null)
  const root = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLParagraphElement>(null)
  const lineInk = useRef<HandwritingHandle>(null)
  const lineDone = useRef<() => void>(() => {})
  const hint = useRef<HTMLParagraphElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const openingRef = useRef(false)
  const [ready, setReady] = useState(tier === 'lite')
  // The envelope only invites a touch once her name has finished being written.
  const [inviting, setInviting] = useState(false)

  // Sample FPS only while the WebGL scene is idle; never downgrade mid-opening.
  useEffect(() => {
    if (tier !== 'full' || !ready || isTierForced()) return
    return watchFps(() => {
      if (!openingRef.current) onDegrade()
    })
  }, [tier, ready, onDegrade])

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.envelope-stage__scene', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [ready])

  useEffect(() => {
    if (!inviting) return
    const ctx = gsap.context(() => {
      gsap.fromTo(hint.current, { opacity: 0, y: 8 }, { opacity: 0.55, y: 0, duration: 1.4, ease: 'power2.out', delay: 0.6 })
    }, root)
    return () => ctx.revert()
  }, [inviting])

  const handleOpen = useCallback(async () => {
    const envelope = tier === 'full' ? envelope3d.current : envelopeLite.current
    if (openingRef.current || !envelope || !ready || !inviting) return
    openingRef.current = true
    sound.paper()
    gsap.killTweensOf(hint.current)
    gsap.to(hint.current, { opacity: 0, duration: 0.5 })

    const opened = envelope.open()
    const openSafety = new Promise<void>((r) => setTimeout(r, OPEN_TIMEOUT_MS))

    // The single line is written by hand once the sheet is filling the frame,
    // and nothing moves on until the last stroke lands.
    const lineWritten = new Promise<void>((resolve) => {
      lineDone.current = resolve
      setTimeout(resolve, LINE_TIMEOUT_MS)
    })
    gsap.delayedCall(3.1, () => {
      gsap.set(line.current, { opacity: 1 })
      lineInk.current?.play(1.4)
    })

    await Promise.all([Promise.race([opened, openSafety]), lineWritten])
    await gsap
      .timeline()
      .to(line.current, { opacity: 0, duration: 0.7, ease: 'power2.in' }, 1.0)
      .to(veil.current, { opacity: 1, duration: 1.1, ease: 'power2.inOut' }, 1.1)
      .then()
    onOpened()
  }, [onOpened, ready, inviting, tier])

  const nameWritten = useCallback(() => setInviting(true), [])

  return (
    <div className="envelope-stage" ref={root} data-ready={ready} onPointerDown={handleOpen}>
      <div className="envelope-stage__scene">
        {tier === 'full' ? (
          <Suspense fallback={null}>
            <Envelope3D ref={envelope3d} onReady={() => setReady(true)} onNameWritten={nameWritten} />
          </Suspense>
        ) : (
          <EnvelopeLite ref={envelopeLite} onNameWritten={nameWritten} />
        )}
      </div>

      <p className="envelope-stage__hint" ref={hint} aria-hidden="true">
        {scenes.ritual.hint}
      </p>

      <p className="envelope-stage__line" ref={line}>
        <Handwriting ref={lineInk} as="span" mode="manual" onComplete={() => lineDone.current()}>
          {scenes.ritual.afterSeal}
        </Handwriting>
      </p>

      <div className="envelope-stage__veil" ref={veil} aria-hidden="true" />

      <button className="sr-only" type="button" onClick={handleOpen}>
        Abrir a carta
      </button>
    </div>
  )
}
