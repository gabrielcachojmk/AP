import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from './useScrub'
import { photos, scenes } from '../../content'
import { Handwriting, type HandwritingHandle } from '../../components/Handwriting'

const { echo } = scenes

type Props = { onRestart: () => void; onActive: (active: boolean) => void }

/** Seal: the paper returns, the thesis is written once more, then the sign-off and the signature. */
export function EchoScene({ onRestart, onActive }: Props) {
  const section = useRef<HTMLElement>(null)
  const line = useRef<HandwritingHandle>(null)
  const signoff = useRef<HandwritingHandle>(null)
  const signature = useRef<HandwritingHandle>(null)
  const activeRef = useRef(onActive)
  activeRef.current = onActive

  useEffect(() => {
    const el = section.current
    if (!el) return
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.echo__in')
      gsap.set(items, { opacity: 0, y: 22 })
      ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        once: true,
        onEnter: () => {
          gsap.to(items, { opacity: 1, y: 0, duration: 1.6, stagger: 0.28, ease: 'power2.out' })
          gsap.delayedCall(0.9, () => line.current?.play(1.6))
        },
      })
      ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        onToggle: (self) => activeRef.current?.(self.isActive),
      })
    }, el)
    return () => ctx.revert()
  }, [])

  const again = () => {
    gsap.to(section.current, { opacity: 0, duration: 0.9, ease: 'power2.inOut', onComplete: onRestart })
  }

  return (
    <section className="scene echo" ref={section} aria-label="Fecho">
      <div className="echo__inner">
        <figure className="echo__photo echo__in">
          <img src={photos.echo.src} alt={photos.echo.alt} loading="lazy" decoding="async" />
        </figure>
        <div className="echo__in">
          <Handwriting
            ref={line}
            as="p"
            mode="manual"
            pace="flow"
            className="echo__line"
            onComplete={() => gsap.delayedCall(0.5, () => signoff.current?.play(1.2))}
          >
            {echo.line}
          </Handwriting>
        </div>
        <p className="echo__date echo__in">{echo.date}</p>
        <div className="echo__signoff echo__in">
          <Handwriting
            ref={signoff}
            as="span"
            mode="manual"
            className="echo__signoff-line"
            onComplete={() => gsap.delayedCall(0.3, () => signature.current?.play(0.9))}
          >
            {echo.signoff}
          </Handwriting>
          <Handwriting ref={signature} as="span" face="script" mode="manual" className="echo__signature">
            {echo.signature}
          </Handwriting>
        </div>
        <button className="echo__again echo__in" type="button" onClick={again}>
          {echo.again}
        </button>
      </div>
    </section>
  )
}
