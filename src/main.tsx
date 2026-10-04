import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  // lets you slow the whole piece down from the console: gsap.globalTimeline.timeScale(0.25)
  ;(window as unknown as { gsap: typeof gsap }).gsap = gsap
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
