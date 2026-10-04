import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Photo } from '../../content'
import { dpr } from '../../lib/gpu'
import type { PlaneState } from './PhotoPlane'

type Props = {
  photo: Photo
  state: { current: PlaneState }
  className?: string
  warmth: number
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform vec2 uPlane;   // canvas w/h
  uniform vec2 uImage;   // image w/h
  uniform float uZoom;
  uniform float uOffset;
  uniform float uWarp;
  uniform float uReveal;
  uniform float uWarmth;
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  void main() {
    // cover fit
    float pa = uPlane.x / uPlane.y;
    float ia = uImage.x / uImage.y;
    vec2 scale = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
    vec2 uv = (vUv - 0.5) * scale / uZoom + 0.5;
    uv.y += uOffset;

    // paper ripple: subtle, slow, stronger at the edges
    float ed = length(vUv - 0.5);
    float ripple = sin(vUv.y * 14.0 + uTime * 0.9) * cos(vUv.x * 9.0 - uTime * 0.6);
    uv.x += ripple * 0.006 * uWarp * (0.4 + ed);

    vec3 col = texture2D(uMap, uv).rgb;

    // gentle film grade: lift blacks, warm mids
    col = mix(col, col * vec3(1.06, 0.98, 0.9) + vec3(0.03, 0.015, 0.0), uWarmth);
    col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 0.92);

    // grain
    float g = hash(vUv * uPlane + fract(uTime) * 100.0) - 0.5;
    col += g * 0.045;

    // reveal: torn-edge wipe; front runs past both ends so a full reveal has no seam
    float edge = (hash(floor(vUv * vec2(40.0, 1.0))) - 0.5) * 0.08;
    float front = (1.0 - uReveal) * 1.3 - 0.18;
    float mask = smoothstep(front - 0.06, front + 0.06, vUv.y + edge);
    // vignette
    col *= 1.0 - smoothstep(0.55, 1.0, ed) * 0.35;

    gl_FragColor = vec4(col, mask);
  }
`

function Plane({ src, state, warmth }: { src: string; state: { current: PlaneState }; warmth: number }) {
  const texture = useTexture(src)
  const mat = useRef<THREE.ShaderMaterial>(null)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
  }, [texture])

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uPlane: { value: new THREE.Vector2(1, 1) },
      uImage: { value: new THREE.Vector2(1, 1) },
      uZoom: { value: 1 },
      uOffset: { value: 0 },
      uWarp: { value: 0 },
      uReveal: { value: 1 },
      uWarmth: { value: warmth },
      uTime: { value: 0 },
    }),
    // texture identity is stable per src
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texture],
  )

  useFrame(({ clock, size }) => {
    const m = mat.current
    if (!m) return
    const img = texture.image as { width?: number; height?: number } | undefined
    m.uniforms.uPlane.value.set(size.width, size.height)
    m.uniforms.uImage.value.set(img?.width || 1, img?.height || 1)
    m.uniforms.uTime.value = clock.elapsedTime
    const s = state.current
    m.uniforms.uZoom.value += (s.zoom - m.uniforms.uZoom.value) * 0.12
    m.uniforms.uOffset.value += (s.offset - m.uniforms.uOffset.value) * 0.12
    m.uniforms.uWarp.value += (s.warp - m.uniforms.uWarp.value) * 0.1
    m.uniforms.uReveal.value += (s.reveal - m.uniforms.uReveal.value) * 0.12
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthTest={false} />
    </mesh>
  )
}

/** WebGL photo plane: cover fit, zoom, parallax, paper ripple, film grade and torn-edge reveal. */
export function PhotoPlaneGL({ photo, state, className, warmth }: Props) {
  return (
    <div className={`photo-plane ${className ?? ''}`} role="img" aria-label={photo.alt}>
      <Canvas dpr={dpr} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }} frameloop="always">
        <Suspense fallback={null}>
          <Plane src={photo.src} state={state} warmth={warmth} />
        </Suspense>
      </Canvas>
    </div>
  )
}
