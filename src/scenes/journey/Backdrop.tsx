import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dpr } from '../../lib/gpu'

const COUNT = 320

function Dust() {
  const points = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = Math.random() * -6
      speeds[i] = 0.05 + Math.random() * 0.12
    }
    return { positions, speeds }
  }, [])

  useFrame(({ clock }, delta) => {
    const geo = points.current?.geometry
    if (!geo) return
    const pos = geo.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      arr[i * 3] += Math.sin(t * 0.3 + i) * 0.0015
      if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = -4
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f1dfb8"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Fixed, always-behind canvas: drifting dust in warm light. */
export function Backdrop() {
  return (
    <div className="journey__backdrop" aria-hidden="true">
      <Canvas dpr={dpr} camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true, antialias: false }}>
        <Dust />
      </Canvas>
    </div>
  )
}
