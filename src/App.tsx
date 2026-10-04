import { useCallback, useEffect, useMemo, useState } from 'react'
import { detectTier, type Tier } from './lib/gpu'
import { sound } from './lib/audio'
import { Gate } from './components/Gate'
import { MuteButton } from './components/MuteButton'
import { EnvelopeStage } from './scenes/envelope/EnvelopeStage'
import { LetterScene } from './scenes/letter/LetterScene'
import { Journey } from './scenes/journey/Journey'

export type Phase = 'gate' | 'envelope' | 'letter' | 'journey'

const UNLOCK_KEY = 'carta:unlocked'

export default function App() {
  const [tier, setTier] = useState<Tier>(() => detectTier())
  const [phase, setPhase] = useState<Phase>(() =>
    sessionStorage.getItem(UNLOCK_KEY) === '1' ? 'envelope' : 'gate',
  )
  const [lightChrome, setLightChrome] = useState(false)

  useEffect(() => {
    document.body.dataset.phase = phase
    document.body.dataset.tier = tier
  }, [phase, tier])

  const unlock = useCallback(() => {
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setPhase('envelope')
  }, [])

  const degrade = useCallback(() => setTier('lite'), [])

  const restart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setLightChrome(false)
    setPhase('envelope')
  }, [])

  const stage = useMemo(() => {
    switch (phase) {
      case 'gate':
        return <Gate onUnlock={unlock} />
      case 'envelope':
        return (
          <EnvelopeStage
            tier={tier}
            onDegrade={degrade}
            onOpened={() => {
              sound.ambience()
              setPhase('letter')
            }}
          />
        )
      case 'letter':
        return <LetterScene tier={tier} onContinue={() => setPhase('journey')} />
      case 'journey':
        return <Journey tier={tier} onRestart={restart} onLightChange={setLightChrome} />
    }
  }, [phase, tier, unlock, degrade, restart])

  return (
    <>
      {stage}
      <div className="grain" aria-hidden="true" />
      {phase !== 'gate' && <MuteButton light={lightChrome} />}
    </>
  )
}
