import { useEffect, useState } from 'react'
import { sound } from '../lib/audio'

export function MuteButton({ light = false }: { light?: boolean }) {
  const [muted, setMuted] = useState(sound.muted)

  useEffect(() => sound.subscribe(setMuted), [])

  if (!sound.available) return null

  return (
    <button
      type="button"
      className="mute"
      data-muted={muted}
      data-light={light}
      onClick={() => sound.toggle()}
      aria-pressed={!muted}
      aria-label={muted ? 'Ativar som' : 'Silenciar'}
    >
      <span className="mute__dot" aria-hidden="true" />
      {muted ? 'som' : 'silenciar'}
    </button>
  )
}
