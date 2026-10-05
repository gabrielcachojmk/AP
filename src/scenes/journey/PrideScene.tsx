import { useMemo } from 'react'
import { photos, scenes } from '../../content'
import type { Tier } from '../../lib/gpu'
import { Handwriting } from '../../components/Handwriting'
import { PhotoPlane, createPlaneState } from './PhotoPlane'
import { useScrub } from './useScrub'

const { pride } = scenes

/** Swell: a single portrait the camera approaches and holds; light blooms; one full breath of text. */
export function PrideScene({ tier }: { tier: Tier }) {
  const plane = useMemo(() => createPlaneState({ zoom: 1.0, warp: 0.15 }), [])
  const ink = useMemo(() => ({ lead: { current: 0 }, body: { current: 0 }, close: { current: 0 } }), [])

  const section = useScrub((tl, el) => {
    const frame = el.querySelector('.pride__portrait')
    const glow = el.querySelector('.pride__glow')

    tl.fromTo(frame, { scale: 0.82, opacity: 0, y: 40 }, { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0)
      .to(plane.current, { zoom: 1.16, offset: -0.03, duration: 1 }, 0)
      .fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.25)
      .to(ink.lead, { current: 1, duration: 0.22 }, 0.26)
      .to(ink.body, { current: 1, duration: 0.34 }, 0.46)
      .to(ink.close, { current: 1, duration: 0.14 }, 0.82)
  })

  return (
    <section className="scene pride" ref={section}>
      <div className="scene__frame">
        <div className="pride__glow" aria-hidden="true" />
        <div className="pride__portrait">
          <PhotoPlane photo={photos.pride} tier={tier} state={plane} warmth={0.85} />
        </div>
        <div className="pride__text">
          <Handwriting as="p" mode="manual" progress={ink.lead} className="pride__lead">
            {pride.lead}
          </Handwriting>
          <Handwriting as="p" mode="manual" pace="flow" progress={ink.body} className="pride__body">
            {pride.body}
          </Handwriting>
          <Handwriting as="p" mode="manual" progress={ink.close} className="pride__close">
            {pride.close}
          </Handwriting>
        </div>
      </div>
    </section>
  )
}
