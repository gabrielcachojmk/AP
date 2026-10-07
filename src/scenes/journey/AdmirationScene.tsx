import { useMemo } from 'react'
import { photos, scenes } from '../../content'
import { Handwriting } from '../../components/Handwriting'
import { useScrub } from './useScrub'

const { admiration } = scenes
const TILTS = [-5, 4, -3, 6]

/** Fragments: four cards dealt onto the table, one per scroll beat; the caption is jotted as each lands. */
export function AdmirationScene() {
  const ink = useMemo(() => admiration.fragments.map(() => ({ current: 0 })), [])

  const section = useScrub(
    (tl, el) => {
      const cards = el.querySelectorAll<HTMLElement>('.admire__card')

      const slot = 0.9 / cards.length
      cards.forEach((card, i) => {
        const at = 0.06 + i * slot
        tl.fromTo(
          card,
          { yPercent: 140, rotate: TILTS[i] * 3, opacity: 0 },
          { yPercent: 0, rotate: TILTS[i], opacity: 1, duration: slot * 0.45, ease: 'power4.out' },
          at,
        ).to(ink[i], { current: 1, duration: slot * 0.45 }, at + slot * 0.3)
        // earlier cards settle a touch lower/dimmer as the next lands
        if (i > 0) {
          tl.to(cards[i - 1], { scale: 0.96, filter: 'brightness(0.72)', duration: slot * 0.4, ease: 'power2.out' }, at + slot * 0.1)
        }
      })
    },
    { scrub: 0.35 },
  )

  return (
    <section className="scene admire" ref={section}>
      <div className="scene__frame">
        <ul className="admire__table">
          {admiration.fragments.map((text, i) => (
            <li className="admire__card" key={i} style={{ ['--i' as string]: i }}>
              <img src={photos.admiration[i]?.src} alt={photos.admiration[i]?.alt ?? ''} loading="lazy" decoding="async" />
              <Handwriting as="p" mode="manual" pace="flow" progress={ink[i]} className="admire__caption">
                {text}
              </Handwriting>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
