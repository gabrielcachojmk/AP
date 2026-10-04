import { Howl } from 'howler'
import { audio as audioConfig } from '../content'

const howls: Partial<Record<keyof typeof audioConfig, Howl>> = {}
let muted = true
const listeners = new Set<(m: boolean) => void>()

function get(key: keyof typeof audioConfig): Howl | undefined {
  const src = audioConfig[key]
  if (!src) return undefined
  if (!howls[key]) {
    howls[key] = new Howl({ src: [src], loop: key === 'ambience', volume: key === 'ambience' ? 0.25 : 0.6, html5: true })
  }
  return howls[key]
}

export const sound = {
  get muted() {
    return muted
  },
  available: Boolean(audioConfig.paper || audioConfig.ambience),
  setMuted(next: boolean) {
    muted = next
    Howler_mute(next)
    listeners.forEach((l) => l(next))
  },
  toggle() {
    sound.setMuted(!muted)
  },
  subscribe(fn: (m: boolean) => void): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  paper() {
    if (muted) return
    get('paper')?.play()
  },
  ambience() {
    if (muted) return
    const h = get('ambience')
    if (h && !h.playing()) h.play()
  },
}

function Howler_mute(next: boolean) {
  Object.values(howls).forEach((h) => h?.mute(next))
}
