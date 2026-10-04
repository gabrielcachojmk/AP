import { useMemo } from 'react'
import { photos, scenes } from '../../content'
import type { Tier } from '../../lib/gpu'
import { Handwriting } from '../../components/Handwriting'
import { PhotoPlane, createPlaneState } from './PhotoPlane'
import { useScrub } from './useScrub'

const { horizon } = scenes

type Props = { tier: Tier; onActive: (active: boolean) => void }

/** Horizon: the palette turns to dawn, the camera pulls back and there is finally air. */
export function HorizonScene({ tier, onActive }: Props) {
  const plane = useMemo(() => createPlaneState({ zoom: 1.25, offset: 0.03, warp: 0.1 }), [])
  const ink = useMemo(() => horizon.lines.map(() => ({ current: 0 })), [])
  const finalInk = useMemo(() => ({ current: 0 }), [])

  const section = useScrub(
    (tl, el) => {
      const frame = el.querySelector('.horizon__frame')
      const kicker = el.querySelector('.horizon__kicker')

      tl.fromTo(frame, { scale: 1.2, y: '6vh' }, { scale: 0.8, y: 0, duration: 1, ease: 'power1.inOut' }, 0)
        .to(plane.current, { zoom: 1.0, offset: 0, duration: 1 }, 0)
        .fromTo(kicker, { opacity: 0 }, { opacity: 0.6, duration: 0.1 }, 0.05)

      const slot = 0.5 / ink.length
      ink.forEach((line, i) => {
        tl.to(line, { current: 1, duration: slot * 0.85 }, 0.2 + i * slot)
      })
      tl.to(finalInk, { current: 1, duration: 0.22 }, 0.76)
    },
    { onActive },
  )

  return (
    <section className="scene horizon" ref={section} aria-label="Os próximos anos">
      <div className="scene__frame">
        <div className="horizon__frame">
          <PhotoPlane photo={photos.horizon} tier={tier} state={plane} warmth={0.35} />
        </div>
        <div className="horizon__text">
          <p className="kicker horizon__kicker">{horizon.kicker}</p>
          {horizon.lines.map((line, i) => (
            <Handwriting as="p" mode="manual" pace="flow" progress={ink[i]} className="horizon__line" key={i}>
              {line}
            </Handwriting>
          ))}
          <Handwriting as="p" mode="manual" progress={finalInk} className="horizon__final">
            {horizon.final}
          </Handwriting>
        </div>
      </div>
    </section>
  )
}
