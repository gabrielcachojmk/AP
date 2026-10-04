export type Tier = 'full' | 'lite'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return false
    // Some software renderers expose WebGL but crawl. Treat them as lite.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    if (dbg) {
      const renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).toLowerCase()
      if (/swiftshader|llvmpipe|software/.test(renderer)) return false
    }
    return true
  } catch {
    return false
  }
}

function lowEndHeuristics(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) return true
  return false
}

function forcedTier(): Tier | null {
  const forced = new URLSearchParams(window.location.search).get('tier')
  return forced === 'lite' || forced === 'full' ? forced : null
}

/** True when the tier was pinned via `?tier=`; runtime downgrades are skipped. */
export function isTierForced(): boolean {
  return forcedTier() !== null
}

/** Decide the render tier before anything mounts. */
export function detectTier(): Tier {
  const forced = forcedTier()
  if (forced) return forced
  if (prefersReducedMotion()) return 'lite'
  if (!hasWebGL()) return 'lite'
  if (lowEndHeuristics()) return 'lite'
  return 'full'
}

/**
 * Sample frame rate for a short window once the heavy scene is running.
 * Calls `onLow` once if the average drops under the threshold.
 */
export function watchFps(onLow: () => void, { seconds = 2, threshold = 28 } = {}): () => void {
  let frames = 0
  let start = 0
  let raf = 0
  let done = false

  const tick = (t: number) => {
    if (done) return
    if (!start) start = t
    frames++
    const elapsed = (t - start) / 1000
    if (elapsed >= seconds) {
      done = true
      if (frames / elapsed < threshold) onLow()
      return
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return () => {
    done = true
    cancelAnimationFrame(raf)
  }
}

export const dpr: [number, number] = [1, 2]
