import { useEffect, useRef, useState, type FormEvent } from 'react'
import gsap from 'gsap'
import { password, recipient } from '../content'
import { Handwriting } from './Handwriting'
import './Gate.css'

function normalize(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gate__inner > *', {
        y: 18,
        opacity: 0,
        duration: 1.4,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.2,
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (normalize(value) === normalize(password)) {
      gsap.to(root.current, {
        opacity: 0,
        duration: 0.9,
        ease: 'power2.inOut',
        onComplete: onUnlock,
      })
      return
    }
    setError(true)
    gsap.fromTo(field.current, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
  }

  return (
    <div className="gate" ref={root}>
      <form className="gate__inner" onSubmit={submit}>
        <p className="kicker">para</p>
        <Handwriting as="h1" face="script" className="gate__name" delay={0.9} speed={0.9}>
          {recipient}
        </Handwriting>
        <p className="gate__prompt">Digite a senha.</p>
        <label className="sr-only" htmlFor="gate-word">
          Palavra do cartão
        </label>
        <input
          ref={field}
          id="gate-word"
          className="gate__input"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          aria-invalid={error}
          aria-describedby={error ? 'gate-error' : undefined}
        />
        <button className="gate__submit" type="submit">
          abrir
        </button>
        <p id="gate-error" className="gate__error" role="alert" data-visible={error}>
          Não é essa. Tenta de novo, com calma.
        </p>
      </form>
    </div>
  )
}
