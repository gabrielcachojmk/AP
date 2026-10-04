import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dpr } from '../../lib/gpu'

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
  uniform float uTime;
  uniform float uProgress;
  uniform float uAspect;

  // hash + value noise + fbm, cheap enough for phones
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);

    // paper: warm cream with fibres and soft blotches
    vec3 paper = vec3(0.945, 0.902, 0.823);
    float fibre = fbm(p * 90.0) * 0.06 - 0.03;
    float blotch = fbm(p * 3.5 + 2.0) * 0.08 - 0.04;
    vec3 col = paper + fibre + blotch;

    // ink wash: spreads downward with an irregular, bleeding edge
    float edge = fbm(p * 4.0 + uTime * 0.03) * 0.28 - 0.14;
    float front = 1.0 - uProgress * 1.15;
    float wash = smoothstep(front - 0.05, front + 0.22, uv.y + edge);
    // second, finer bleed so the front looks like ink meeting fibre
    float fine = fbm(p * 24.0 - uTime * 0.02);
    wash *= 0.65 + 0.35 * fine;
    vec3 ink = vec3(0.35, 0.26, 0.2);
    col = mix(col, col * 0.93 + ink * 0.02, wash * 0.9);

    // pooled ink at the very top, like where the pen rested
    float pool = smoothstep(0.02, 0.0, distance(uv, vec2(0.12, 0.93)) - 0.03 * uProgress) * uProgress;
    col = mix(col, ink, pool * 0.25);

    // soft vignette + light from upper left
    float light = 1.0 - distance(uv, vec2(0.3, 0.75)) * 0.25;
    col *= light;
    float vig = smoothstep(1.15, 0.35, distance(uv, vec2(0.5)));
    col = mix(col * 0.78, col, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`

function Plane({ progress }: { progress: { current: number } }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAspect: { value: 1 },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value = clock.elapsedTime
    mat.current.uniforms.uProgress.value += (progress.current - mat.current.uniforms.uProgress.value) * 0.08
    mat.current.uniforms.uAspect.value = size.width / size.height
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} depthTest={false} />
    </mesh>
  )
}

/** Fullscreen paper + spreading ink wash. `progress` is 0..1 and follows the text reveal. */
export function InkPaper({ progress }: { progress: { current: number } }) {
  return (
    <Canvas className="ink-paper" dpr={dpr} gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }} frameloop="always">
      <Plane progress={progress} />
    </Canvas>
  )
}
