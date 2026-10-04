import { useMemo } from 'react'
import { photos, scenes } from '../../content'
import type { Tier } from '../../lib/gpu'
import { Handwriting } from '../../components/Handwriting'
import { PhotoPlane, createPlaneState } from './PhotoPlane'
import { useScrub } from './useScrub'

const { home } = scenes

/** Diptych: two photos travel toward each other until they almost touch; warm paper; slow "you are". */
export function HomeScene({ tier }: { tier: Tier }) {
  const left = useMemo(() => createPlaneState({ zoom: 1.08, warp: 0.5 }), [])
  const right = useMemo(() => createPlaneState({ zoom: 1.08, warp: 0.5 }), [])
  const ink = useMemo(() => home.lines.map(() => ({ current: 0 })), [])

  const section = useScrub((tl, el) => {
    const a = el.querySelector('.home__a')
    const b = el.querySelector('.home__b')
    const kicker = el.querySelector('.home__kicker')

    tl.fromTo(a, { xPercent: -70, rotate: -6, opacity: 0 }, { xPercent: -4, rotate: -1.5, opacity: 1, duration: 0.55, ease: 'power2.out' }, 0)
      .fromTo(b, { xPercent: 70, rotate: 6, opacity: 0 }, { xPercent: 4, rotate: 1.5, opacity: 1, duration: 0.55, ease: 'power2.out' }, 0)
      .to(left.current, { zoom: 1.0, duration: 1 }, 0)
      .to(right.current, { zoom: 1.0, duration: 1 }, 0)
      .fromTo(kicker, { opacity: 0 }, { opacity: 0.6, duration: 0.1 }, 0.15)

    const slot = 0.6 / ink.length
    ink.forEach((line, i) => {
      tl.to(line, { current: 1, duration: slot * 0.85 }, 0.36 + i * slot)
    })
  })

  return (
    <section className="scene home" ref={section} aria-label="O que você é">
      <div className="scene__frame">
        <p className="kicker home__kicker">{home.kicker}</p>
        <div className="home__pair">
          <div className="home__a">
            <PhotoPlane photo={photos.home[0]} tier={tier} state={left} warmth={0.9} />
          </div>
          <div className="home__b">
            <PhotoPlane photo={photos.home[1]} tier={tier} state={right} warmth={0.9} />
          </div>
        </div>
        <div className="home__text">
          {home.lines.map((line, i) => (
            <Handwriting as="p" mode="manual" pace="flow" progress={ink[i]} className="home__line" key={i}>
              {line}
            </Handwriting>
          ))}
        </div>
      </div>
    </section>
  )
}
