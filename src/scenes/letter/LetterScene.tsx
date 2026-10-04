import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Tier } from '../../lib/gpu'
import { scenes } from '../../content'
import { Handwriting, type HandwritingHandle } from '../../components/Handwriting'
import './letter.css'

const InkPaper = lazy(() => import('./InkPaper').then((m) => ({ default: m.InkPaper })))

type Props = {
  tier: Tier
  onContinue: () => void
}

const { thesis } = scenes
const GREETING_SPEED = 1
const BODY_SPEED = 2.6
const HURRY = 3

export function LetterScene({ tier, onContinue }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const cta = useRef<HTMLButtonElement>(null)
  const blocks = useRef<(HandwritingHandle | null)[]>([])
  const current = useRef(0)
  const speedScale = useRef(1)
  const progress = useRef(0)
  const [done, setDone] = useState(false)

  const total = 1 + thesis.paragraphs.length

  const startBlock = useCallback((i: number) => {
    current.current = i
    const base = i === 0 ? GREETING_SPEED : BODY_SPEED
    blocks.current[i]?.play(base * speedScale.current)
  }, [])

  const finishBlock = useCallback(
    (i: number) => {
      if (i !== current.current) return
      if (i + 1 < total) {
        gsap.delayedCall(0.35, () => startBlock(i + 1))
      } else {
        setDone(true)
        gsap.fromTo(cta.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 0.5 })
      }
    },
    [startBlock, total],
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sheet.current,
        { opacity: 0, y: 24, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'power2.out', onComplete: () => startBlock(0) },
      )
    }, root)

    // ink wash follows the pen: finished blocks + the one being written
    const tick = () => {
      const i = current.current
      const local = blocks.current[i]?.progress ?? 0
      progress.current = Math.min(1, (i + local) / total)
    }
    gsap.ticker.add(tick)

    return () => {
      ctx.revert()
      gsap.ticker.remove(tick)
    }
  }, [startBlock, total])

  const hurry = () => {
    if (speedScale.current >= HURRY) return
    speedScale.current = HURRY
    const i = current.current
    blocks.current[i]?.setSpeed((i === 0 ? GREETING_SPEED : BODY_SPEED) * HURRY)
  }

  const leave = () => {
    gsap.to(root.current, { opacity: 0, duration: 1.1, ease: 'power2.inOut', onComplete: onContinue })
  }

  return (
    <div className="letter" ref={root} data-tier={tier} onPointerDown={hurry}>
      {/* lite paper sits underneath in both tiers so there is never a blank frame while the shader loads */}
      <div className="letter__paper-lite" aria-hidden="true" />
      {tier === 'full' && (
        <Suspense fallback={null}>
          <InkPaper progress={progress} />
        </Suspense>
      )}

      <article className="letter__sheet" ref={sheet}>
        <Handwriting
          ref={(h) => {
            blocks.current[0] = h
          }}
          as="p"
          face="script"
          mode="manual"
          className="letter__greeting"
          onComplete={() => finishBlock(0)}
        >
          {thesis.greeting}
        </Handwriting>

        {thesis.paragraphs.map((text, i) => (
          <Handwriting
            key={i}
            ref={(h) => {
              blocks.current[i + 1] = h
            }}
            as="p"
            face="ink"
            pace="flow"
            mode="manual"
            className="letter__paragraph"
            onComplete={() => finishBlock(i + 1)}
          >
            {text}
          </Handwriting>
        ))}

        <button
          className="letter__cta"
          ref={cta}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            leave()
          }}
          tabIndex={done ? 0 : -1}
          aria-hidden={!done}
        >
          <span>{thesis.cta}</span>
          <i aria-hidden="true" />
        </button>
      </article>
    </div>
  )
}
