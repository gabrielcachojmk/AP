import { useMemo } from 'react'
import { photos, scenes } from '../../content'
import type { Tier } from '../../lib/gpu'
import { Handwriting } from '../../components/Handwriting'
import { PhotoPlane, createPlaneState } from './PhotoPlane'
import { useScrub } from './useScrub'

const { memory } = scenes

/** Cinema: one full-bleed frame, slow Ken Burns, lines written like subtitles. */
export function MemoryScene({ tier }: { tier: Tier }) {
  const plane = useMemo(() => createPlaneState({ zoom: 1.02, reveal: 0, warp: 0.3 }), [])
  const ink = useMemo(() => memory.lines.map(() => ({ current: 0 })), [])

  const section = useScrub((tl, el) => {
    const lines = el.querySelectorAll<HTMLElement>('.memory__line')
    const hint = el.querySelector('.memory__hint')

    tl.to(hint, { opacity: 0, duration: 0.08, ease: 'power1.out' }, 0)
      .to(plane.current, { reveal: 1, duration: 0.18, ease: 'power2.out' }, 0)
      .to(plane.current, { zoom: 1.2, offset: -0.04, duration: 1 }, 0)

    const slot = 0.74 / lines.length
    lines.forEach((line, i) => {
      const at = 0.18 + i * slot
      tl.set(line, { opacity: 1 }, at)
        .to(ink[i], { current: 1, duration: slot * 0.6 }, at)
      if (i < lines.length - 1) {
        tl.to(line, { opacity: 0, y: -10, duration: slot * 0.2, ease: 'power2.in' }, at + slot * 0.8)
      }
    })
  })

  return (
    <section className="scene memory" ref={section}>
      <div className="scene__frame">
        <PhotoPlane photo={photos.memory} tier={tier} state={plane} className="memory__photo" warmth={0.7} />
        <div className="memory__shade" aria-hidden="true" />
        <p className="memory__hint" aria-hidden="true">
          <span>role para baixo</span>
        </p>
        <div className="memory__subs">
          {memory.lines.map((line, i) => (
            <div className="memory__line" key={i}>
              <Handwriting as="span" mode="manual" progress={ink[i]}>
                {line}
              </Handwriting>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
