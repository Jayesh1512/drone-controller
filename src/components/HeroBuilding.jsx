import { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text3D, Center } from '@react-three/drei'

function HelipadLight({ position, offset = 0 }) {
  const meshRef = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    // Slow flash — 1.5s cycle, offset so they don't all flash together
    const t = (clock.elapsedTime + offset) % 1.5
    const on = t < 0.15 // brief flash, then dark
    const intensity = on ? 1 : 0
    if (meshRef.current) meshRef.current.material.emissiveIntensity = on ? 3 : 0.05
    if (lightRef.current) lightRef.current.intensity = intensity * 2
  })

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.07, 0.15, 6]} />
        <meshLambertMaterial color="#3a3530" flatShading />
      </mesh>
      <mesh ref={meshRef} position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshStandardMaterial color="#ff4422" emissive="#ff2200" emissiveIntensity={0.05} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.12, 0]} color="#ff2200" intensity={0} distance={3} />
    </group>
  )
}

function GlowingLetters() {
  return (
    <group position={[0, 0.3, 0]}>
      <Center>
        <Text3D
          font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
          size={0.9}
          height={0.35}
          curveSegments={4}
          bevelEnabled
          bevelThickness={0.04}
          bevelSize={0.02}
          bevelSegments={2}
        >
          JAYESH
          <meshStandardMaterial
            color="#e8a030"
            emissive="#c8760a"
            emissiveIntensity={1.8}
            metalness={0.4}
            roughness={0.5}
          />
        </Text3D>
      </Center>
      {/* Warm light behind letters */}
      <pointLight color="#c8760a" intensity={5} distance={8} position={[0, 0.5, -0.5]} />
    </group>
  )
}

function FallbackLetters() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[5, 0.8, 0.3]} />
      <meshStandardMaterial color="#c8860a" emissive="#c8760a" emissiveIntensity={1.5} />
    </mesh>
  )
}

function BlinkLight({ position }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = Math.round(clock.elapsedTime) % 2 === 0 ? 3 : 0
  })
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshStandardMaterial color="#cc3300" emissive="#cc3300" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={ref} color="#cc3300" intensity={3} distance={3} />
    </group>
  )
}

export default function HeroBuilding() {
  const H = 10

  return (
    <group position={[0, 0, 0]}>
      {/* Base plinth */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.4, 5.2]} />
        <meshLambertMaterial color="#2a2018" flatShading />
      </mesh>

      {/* Main tower */}
      <mesh position={[0, H / 2 + 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, H, 3.6]} />
        <meshLambertMaterial color="#3a2e1e" flatShading />
      </mesh>

      {/* Left wing */}
      <mesh position={[-2.9, H * 0.35, 0]} castShadow>
        <boxGeometry args={[1.6, H * 0.7, 2.6]} />
        <meshLambertMaterial color="#2e2418" flatShading />
      </mesh>

      {/* Right wing */}
      <mesh position={[2.9, H * 0.35, 0]} castShadow>
        <boxGeometry args={[1.6, H * 0.7, 2.6]} />
        <meshLambertMaterial color="#2e2418" flatShading />
      </mesh>

      {/* Window strips front — warm amber */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`f${i}`} position={[0, 2 + i * 1.4, 1.82]}>
          <boxGeometry args={[2.8, 0.45, 0.05]} />
          <meshStandardMaterial color="#e8a030" emissive="#c8760a" emissiveIntensity={1.2} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Window strips back — dimmer warm */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`b${i}`} position={[0, 2 + i * 1.4, -1.82]}>
          <boxGeometry args={[2.8, 0.45, 0.05]} />
          <meshStandardMaterial color="#c87820" emissive="#a05010" emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Roof platform — dark concrete, no glow */}
      <mesh position={[0, H + 0.65, 0]}>
        <boxGeometry args={[4.1, 0.5, 4.1]} />
        <meshLambertMaterial color="#2a2520" flatShading />
      </mesh>

      {/* Roof surface — flat dark gravel */}
      <mesh position={[0, H + 0.92, 0]}>
        <boxGeometry args={[4.0, 0.06, 4.0]} />
        <meshLambertMaterial color="#1e1c18" flatShading />
      </mesh>

      {/* Helipad corner lights — staggered flash */}
      {[[-1.7, 1.7], [1.7, 1.7], [-1.7, -1.7], [1.7, -1.7]].map(([x, z], i) => (
        <HelipadLight key={i} position={[x, H + 1.05, z]} offset={i * 0.375} />
      ))}

      {/* Antenna */}
      <mesh position={[0, H + 2.4, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 2.5, 5]} />
        <meshLambertMaterial color="#888070" flatShading />
      </mesh>
      <BlinkLight position={[0, H + 3.7, 0]} />

      {/* JAYESH sign */}
      <group position={[0, H + 1.0, 0]}>
        <Suspense fallback={<FallbackLetters />}>
          <GlowingLetters />
        </Suspense>
      </group>
    </group>
  )
}
