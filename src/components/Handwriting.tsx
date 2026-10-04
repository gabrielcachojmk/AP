import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react'
import { TegakiRenderer, type TegakiRendererHandle, type TegakiBundle, type TimelineConfig, type TimeControlMode } from 'tegaki'
import gsap from 'gsap'
import { inkFont, scriptFont } from '../lib/handwriting'

export type HandwritingHandle = {
  /** Jump to a point in the stroke timeline, 0..1. */
  seek: (progress: number) => void
  /** Play from the beginning at the given speed. */
  play: (speed?: number) => void
  /** Change playback speed while playing. */
  setSpeed: (speed: number) => void
  /** 0..1 of the stroke timeline already drawn. */
  readonly progress: number
}

type Props = {
  children: string
  /** `ink` = Caveat (body text), `script` = Parisienne (names, greeting) */
  face?: 'ink' | 'script'
  /**
   * `auto`   — starts writing on mount (or after `delay` seconds).
   * `manual` — stays at 0 until `seek`/`play` is called, or follows `progress` (scroll-driven scenes).
   */
  mode?: 'auto' | 'manual'
  /**
   * `natural` — each glyph finishes before the next begins (short lines, names).
   * `flow`    — glyphs overlap like cursive, roughly 2x faster (long paragraphs).
   */
  pace?: 'natural' | 'flow'
  speed?: number
  delay?: number
  /** For manual mode: a `{ current: number }` progress that the component follows every frame. */
  progress?: { current: number }
  onComplete?: () => void
  className?: string
  style?: CSSProperties
  as?: 'p' | 'span' | 'div' | 'h1'
  /** Extra canvas supersampling; use 2 when the element is scaled up by a CSS transform. */
  pixelRatio?: number
}

const faces: Record<NonNullable<Props['face']>, TegakiBundle> = { ink: inkFont, script: scriptFont }

const effects = {
  pressureWidth: { strength: 0.55 },
  taper: { startLength: 0.06, endLength: 0.14 },
} as const

const timings: Record<NonNullable<Props['pace']>, TimelineConfig> = {
  natural: { glyphGap: 0.05, wordGap: 0.16, lineGap: 0.35 },
  flow: { wordGap: 0.12, lineGap: 0.3, stagger: { advance: '45%' } },
}

/** Text that writes itself, stroke by stroke. Thin wrapper over Tegaki with our fonts and pacing. */
export const Handwriting = forwardRef<HandwritingHandle, Props>(function Handwriting(
  {
    children,
    face = 'ink',
    mode = 'auto',
    pace = 'natural',
    speed = 1,
    delay = 0,
    progress,
    onComplete,
    className,
    style,
    as = 'p',
    pixelRatio = 1,
  },
  ref,
) {
  const quality = useMemo(() => ({ smoothing: true, pixelRatio }), [pixelRatio])
  const tegaki = useRef<TegakiRendererHandle>(null)
  // Imperative playback wins over the prop-derived default; kept in a ref so a
  // parent re-render doesn't hand the engine a stale `playing: false` again.
  const override = useRef<TimeControlMode['uncontrolled'] | null>(null)

  const seek = (p: number) => tegaki.current?.engine?.seek(`${Math.max(0, Math.min(1, p)) * 100}%`)

  useImperativeHandle(ref, () => ({
    seek,
    play: (s = speed) => {
      const engine = tegaki.current?.engine
      if (!engine) return
      override.current = { mode: 'uncontrolled', speed: s, playing: true }
      engine.update({ time: override.current })
      engine.restart()
    },
    setSpeed: (s) => {
      override.current = { mode: 'uncontrolled', speed: s, playing: true }
      tegaki.current?.engine?.update({ time: override.current })
    },
    get progress() {
      const engine = tegaki.current?.engine
      if (!engine || !engine.duration) return 0
      return engine.currentTime / engine.duration
    },
  }))

  // Scroll-driven: follow an external progress value each frame without re-rendering React.
  useEffect(() => {
    if (mode !== 'manual' || !progress) return
    let last = -1
    const tick = () => {
      const p = progress.current
      if (Math.abs(p - last) < 0.0005) return
      last = p
      seek(p)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [mode, progress])

  return (
    <TegakiRenderer
      ref={tegaki}
      as={as}
      font={faces[face]}
      className={className}
      style={{ display: 'block', margin: 0, ...style }}
      effects={effects}
      quality={quality}
      timing={timings[pace]}
      time={
        override.current ??
        (mode === 'auto' ? { mode: 'uncontrolled', speed, delay, playing: true } : { mode: 'uncontrolled', playing: false })
      }
      onComplete={onComplete}
    >
      {children}
    </TegakiRenderer>
  )
})
