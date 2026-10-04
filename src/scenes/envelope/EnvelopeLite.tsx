import { forwardRef, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'
import { scenes } from '../../content'
import { Handwriting } from '../../components/Handwriting'
import type { EnvelopeHandle } from './Envelope3D'

type Props = { onNameWritten?: () => void }

/** CSS 3D fallback with the same beats as the WebGL envelope. */
export const EnvelopeLite = forwardRef<EnvelopeHandle, Props>(function EnvelopeLite({ onNameWritten }, ref) {
  const stage = useRef<HTMLDivElement>(null)
  const env = useRef<HTMLDivElement>(null)
  const flap = useRef<HTMLDivElement>(null)
  const seal = useRef<HTMLDivElement>(null)
  const letter = useRef<HTMLDivElement>(null)
  const name = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    open: () =>
      new Promise<void>((resolve) => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: resolve })
        env.current?.classList.add('is-opening')
        tl.to(seal.current, { scale: 1.12, boxShadow: '0 0 40px 10px rgba(201,162,76,0.55)', duration: 0.45, ease: 'power2.out' }, 0.1)
          .to(seal.current, { rotate: 35, scale: 0, duration: 0.5, ease: 'power3.in' }, 0.55)
          .to(name.current, { opacity: 0, duration: 0.5 }, 0.55)
          .to(flap.current, { rotateX: 165, duration: 1.5 }, 1.0)
          .to(letter.current, { yPercent: -82, duration: 1.5 }, 1.9)
          .to(letter.current, { z: 120, rotateX: -8, duration: 1.1 }, 2.7)
          .to(stage.current, { scale: 1.45, y: '12vh', duration: 2.2 }, 2.2)
      }),
  }))

  return (
    <div className="envelope-lite" ref={stage}>
      <div className="envelope-lite__env" ref={env}>
        <div className="envelope-lite__back" />
        <div className="envelope-lite__letter" ref={letter} />
        <div className="envelope-lite__pocket envelope-lite__pocket--left" />
        <div className="envelope-lite__pocket envelope-lite__pocket--right" />
        <div className="envelope-lite__pocket envelope-lite__pocket--bottom" />
        <div className="envelope-lite__flap" ref={flap} />
        <div className="envelope-lite__seal" ref={seal}>
          <svg className="envelope-lite__bunny" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="bunny-relief" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f6e2a4" />
                <stop offset="1" stopColor="#d9b25e" />
              </linearGradient>
            </defs>
            <g fill="url(#bunny-relief)">
              <ellipse cx="38" cy="33" rx="8.5" ry="21" transform="rotate(-12 38 33)" />
              <ellipse cx="62" cy="33" rx="8.5" ry="21" transform="rotate(12 62 33)" />
              <ellipse cx="50" cy="66" rx="22" ry="20" />
              <ellipse cx="37" cy="72" rx="9" ry="7" />
              <ellipse cx="63" cy="72" rx="9" ry="7" />
            </g>
            <g fill="#c9a24c">
              <ellipse cx="38" cy="34" rx="3.5" ry="14" transform="rotate(-12 38 34)" />
              <ellipse cx="62" cy="34" rx="3.5" ry="14" transform="rotate(12 62 34)" />
            </g>
            <ellipse cx="50" cy="66" rx="3" ry="2.2" fill="#8f6c25" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#b8923f" strokeWidth="1.6" />
          </svg>
        </div>
        <div className="envelope-lite__name" ref={name}>
          <Handwriting as="span" face="script" delay={1.6} speed={0.9} onComplete={onNameWritten}>
            {scenes.ritual.envelopeName}
          </Handwriting>
        </div>
      </div>
    </div>
  )
})
