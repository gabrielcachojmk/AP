import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { dpr } from '../../lib/gpu'
import { getPaperBump } from '../../lib/textures'
import { scenes } from '../../content'
import { Handwriting } from '../../components/Handwriting'

export type EnvelopeHandle = {
  /** Plays the opening and resolves when the letter is framed. */
  open: () => Promise<void>
}

type Props = {
  onReady?: () => void
  /** Fires when the handwritten name has finished being drawn on the envelope. */
  onNameWritten?: () => void
}

const W = 3.2
const H = 2.1
const PAPER = '#efe3cc'
const PAPER_DARK = '#e2d2b3'
const PAPER_INNER = '#d9c6a3'
const GOLD = '#c9a24c'

function cameraDistance(aspect: number) {
  return Math.max(5.6, 6.35 / aspect)
}

function triangle(a: [number, number], b: [number, number], c: [number, number]) {
  const shape = new THREE.Shape()
  shape.moveTo(...a)
  shape.lineTo(...b)
  shape.lineTo(...c)
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

function Rig({ zoom }: { zoom: { current: number } }) {
  const { camera, size } = useThree()
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  useFrame(() => {
    const aspect = size.width / size.height
    const base = cameraDistance(aspect)
    const z = THREE.MathUtils.lerp(base, base * 0.62, zoom.current)
    const y = THREE.MathUtils.lerp(0.35, 1.5, zoom.current)
    camera.position.set(0, y, z)
    target.set(0, THREE.MathUtils.lerp(0, 1.3, zoom.current), 0)
    camera.lookAt(target)
  })
  return null
}

const RELIEF = '#efd48a'

/** Raised bunny on the wax: head, two long ears, a small nose. Built from squashed spheres so it reads at any size. */
function BunnyRelief() {
  return (
    <group position={[0, -0.01, 0.036]}>
      {/* head */}
      <mesh position={[0, -0.075, 0]} scale={[0.105, 0.098, 0.03]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshStandardMaterial color={RELIEF} metalness={0.85} roughness={0.28} />
      </mesh>
      {/* cheeks */}
      <mesh position={[-0.055, -0.1, 0.004]} scale={[0.05, 0.04, 0.026]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={RELIEF} metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0.055, -0.1, 0.004]} scale={[0.05, 0.04, 0.026]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={RELIEF} metalness={0.85} roughness={0.28} />
      </mesh>
      {/* ears */}
      <mesh position={[-0.058, 0.1, 0]} rotation={[0, 0, 0.22]} scale={[0.038, 0.135, 0.026]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={RELIEF} metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0.058, 0.1, 0]} rotation={[0, 0, -0.22]} scale={[0.038, 0.135, 0.026]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={RELIEF} metalness={0.85} roughness={0.28} />
      </mesh>
      {/* inner ears, slightly sunken tone */}
      <mesh position={[-0.058, 0.1, 0.02]} rotation={[0, 0, 0.22]} scale={[0.016, 0.085, 0.01]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#c9a24c" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0.058, 0.1, 0.02]} rotation={[0, 0, -0.22]} scale={[0.016, 0.085, 0.01]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#c9a24c" metalness={0.9} roughness={0.4} />
      </mesh>
      {/* nose */}
      <mesh position={[0, -0.07, 0.03]} scale={[0.016, 0.012, 0.01]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#8f6c25" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Candle() {
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (!light.current) return
    const t = clock.elapsedTime
    light.current.intensity = 16 + Math.sin(t * 7.3) * 1.1 + Math.sin(t * 13.1) * 0.6
    light.current.position.x = 2.4 + Math.sin(t * 0.9) * 0.15
  })
  return <pointLight ref={light} position={[2.4, 2.6, 3.8]} color="#ffe0b4" distance={16} decay={2} />
}

const Scene = forwardRef<EnvelopeHandle, Props>(function Scene({ onReady, onNameWritten }, ref) {
  const group = useRef<THREE.Group>(null)
  const flap = useRef<THREE.Group>(null)
  const seal = useRef<THREE.Group>(null)
  const sealMat = useRef<THREE.MeshStandardMaterial>(null)
  const letter = useRef<THREE.Mesh>(null)
  const nameEl = useRef<HTMLDivElement>(null)
  const zoom = useRef(0)
  const opening = useRef(false)
  const bump = useMemo(() => getPaperBump(), [])

  const geo = useMemo(() => {
    const hw = W / 2
    const hh = H / 2
    // Every fold is built relative to its own hinge so it can be tilted a few degrees:
    // that tiny angle is what lets light draw the creases.
    return {
      left: triangle([0, hh], [0, -hh], [hw, -0.25]),
      right: triangle([0, hh], [0, -hh], [-hw, -0.25]),
      bottom: triangle([-hw, 0], [hw, 0], [0, hh - 0.25]),
      flap: triangle([-hw, 0], [hw, 0], [0, -1.32]),
    }
  }, [])

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useFrame(({ clock }) => {
    if (!group.current || opening.current) return
    const t = clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.45) * 0.06
    group.current.rotation.x = Math.sin(t * 0.32) * 0.03
    group.current.position.y = Math.sin(t * 0.7) * 0.03
  })

  useImperativeHandle(ref, () => ({
    open: () =>
      new Promise<void>((resolve) => {
        if (!group.current || !flap.current || !seal.current || !letter.current || !sealMat.current) {
          resolve()
          return
        }
        opening.current = true
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: resolve })

        tl.to(group.current.rotation, { x: 0, y: 0, duration: 0.6 }, 0)
          .to(group.current.position, { y: 0, duration: 0.6 }, 0)
          // seal flares, then cracks away
          .to(sealMat.current, { emissiveIntensity: 1.6, duration: 0.45, ease: 'power2.out' }, 0.1)
          .to(seal.current.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 0.45, ease: 'power2.out' }, 0.1)
          .to(seal.current.rotation, { z: 0.6, duration: 0.5, ease: 'power3.in' }, 0.55)
          .to(seal.current.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: 'power3.in' }, 0.55)
          .to(nameEl.current, { opacity: 0, duration: 0.5 }, 0.55)
          // flap lifts up and folds back, behind the envelope — never over the sheet
          .to(flap.current.rotation, { x: 2.6, duration: 1.5 }, 1.0)
          // letter slides out and tilts toward camera
          .to(letter.current.position, { y: 1.75, duration: 1.5 }, 1.9)
          .to(letter.current.position, { z: 0.65, duration: 1.1 }, 2.7)
          .to(letter.current.rotation, { x: -0.18, duration: 1.1 }, 2.7)
          .to(zoom, { current: 1, duration: 2.2, ease: 'power2.inOut' }, 2.2)
      }),
  }))

  return (
    <>
      <Rig zoom={zoom} />
      <ambientLight intensity={0.5} color="#f5e4c8" />
      <hemisphereLight args={['#f1dfb8', '#2a1a10', 0.5]} />
      <Candle />
      <directionalLight position={[-4, 3, 2]} intensity={0.8} color="#b9c6de" />
      {/* lifts the inner face of the flap once it swings back */}
      <spotLight position={[0, 5, -1.5]} angle={0.7} penumbra={0.8} intensity={22} color="#ffe2b8" distance={12} decay={2} />

      <group ref={group}>
        {/* back panel */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[W, H, 0.05]} />
          <meshStandardMaterial color={PAPER_DARK} roughness={0.9} bumpMap={bump} bumpScale={0.6} />
        </mesh>
        {/* inner lining visible when flap opens */}
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[W - 0.04, H - 0.04]} />
          <meshStandardMaterial color={PAPER_INNER} roughness={1} />
        </mesh>

        {/* the letter, hidden behind the front pocket */}
        <mesh ref={letter} position={[0, -0.05, 0.012]}>
          <planeGeometry args={[W - 0.36, H - 0.22]} />
          <meshStandardMaterial color="#f4ead7" roughness={0.95} bumpMap={bump} bumpScale={0.35} />
        </mesh>

        {/* front pocket: three folds, each hinged on its outer edge and tilted toward the camera */}
        <group position={[-W / 2, 0, 0.03]} rotation={[0, -0.09, 0]}>
          <mesh geometry={geo.left}>
            <meshStandardMaterial color={PAPER} roughness={0.9} bumpMap={bump} bumpScale={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <group position={[W / 2, 0, 0.03]} rotation={[0, 0.09, 0]}>
          <mesh geometry={geo.right}>
            <meshStandardMaterial color={PAPER_DARK} roughness={0.9} bumpMap={bump} bumpScale={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <group position={[0, -H / 2, 0.034]} rotation={[0.08, 0, 0]}>
          <mesh geometry={geo.bottom}>
            <meshStandardMaterial color={PAPER} roughness={0.88} bumpMap={bump} bumpScale={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* top flap hinged on the top edge, resting slightly proud of the pocket */}
        <group ref={flap} position={[0, H / 2 + 0.01, 0.04]} rotation={[-0.07, 0, 0]}>
          <mesh geometry={geo.flap}>
            <meshStandardMaterial color="#f3e8d3" roughness={0.86} bumpMap={bump} bumpScale={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* wax seal at the flap tip */}
        <group ref={seal} position={[0, H / 2 - 1.28, 0.16]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.32, 0.07, 48]} />
            <meshStandardMaterial
              ref={sealMat}
              color={GOLD}
              metalness={0.85}
              roughness={0.32}
              emissive={GOLD}
              emissiveIntensity={0.35}
            />
          </mesh>
          {/* pressed rim */}
          <mesh position={[0, 0, 0.037]}>
            <torusGeometry args={[0.245, 0.012, 10, 64]} />
            <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.35} />
          </mesh>
          <BunnyRelief />
        </group>

        {/* handwritten name */}
        <Html transform position={[0, -0.62, 0.12]} distanceFactor={4.2} zIndexRange={[5, 0]} pointerEvents="none">
          <div ref={nameEl} className="envelope3d__name">
            <Handwriting as="span" face="script" delay={1.6} speed={0.9} pixelRatio={2} onComplete={onNameWritten}>
              {scenes.ritual.envelopeName}
            </Handwriting>
          </div>
        </Html>
      </group>

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.75} luminanceSmoothing={0.3} intensity={0.55} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  )
})

export const Envelope3D = forwardRef<EnvelopeHandle, Props>(function Envelope3D({ onReady, onNameWritten }, ref) {
  return (
    <Canvas
      className="envelope3d"
      dpr={dpr}
      camera={{ fov: 35, near: 0.1, far: 50, position: [0, 0.35, 6.5] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#120d0a')
      }}
    >
      <Scene ref={ref} onReady={onReady} onNameWritten={onNameWritten} />
    </Canvas>
  )
})
