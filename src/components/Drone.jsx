import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useDroneStore } from '../store/droneStore'
import * as THREE from 'three'

const DEG2RAD = Math.PI / 180

const ARM_POSITIONS = [
  [-0.7, 0, -0.7],
  [0.7, 0, -0.7],
  [-0.7, 0, 0.7],
  [0.7, 0, 0.7],
]

const SPIN_DIRS = [1, -1, -1, 1]

function Propeller({ position, spinDir }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += spinDir * delta * 35
  })

  return (
    <group position={position}>
      {/* Motor housing */}
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 0.07, 12]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Propeller blades */}
      <group ref={ref} position={[0, 0.06, 0]}>
        <mesh>
          <boxGeometry args={[0.55, 0.012, 0.1]} />
          <meshStandardMaterial color="#ff6b00" metalness={0.2} roughness={0.4} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.55, 0.012, 0.1]} />
          <meshStandardMaterial color="#ff6b00" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

export default function Drone() {
  const droneRef = useRef()
  const targetRotation = useRef(new THREE.Euler())
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0))
  const orientation = useDroneStore((s) => s.orientation)

  useFrame(() => {
    if (!droneRef.current) return

    const pitch = (orientation.beta ?? 0) * DEG2RAD * 0.5
    const roll = (orientation.gamma ?? 0) * DEG2RAD * 0.5
    const yaw = (orientation.alpha ?? 0) * DEG2RAD

    targetRotation.current.set(pitch, yaw, -roll)
    targetPosition.current.x = (orientation.gamma ?? 0) * 0.03
    targetPosition.current.z = (orientation.beta ?? 0) * 0.03

    droneRef.current.rotation.x = THREE.MathUtils.lerp(droneRef.current.rotation.x, targetRotation.current.x, 0.08)
    droneRef.current.rotation.y = THREE.MathUtils.lerp(droneRef.current.rotation.y, targetRotation.current.y, 0.04)
    droneRef.current.rotation.z = THREE.MathUtils.lerp(droneRef.current.rotation.z, targetRotation.current.z, 0.08)
    droneRef.current.position.x = THREE.MathUtils.lerp(droneRef.current.position.x, targetPosition.current.x, 0.05)
    droneRef.current.position.z = THREE.MathUtils.lerp(droneRef.current.position.z, targetPosition.current.z, 0.05)
    droneRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1
  })

  return (
    <group ref={droneRef}>
      {/* Main body — bright silver */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Top shell — orange accent */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.45, 0.06, 0.45]} />
        <meshStandardMaterial color="#ff6b00" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Top dome — dark tinted */}
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.1} transparent opacity={0.9} />
      </mesh>

      {/* Center stripe */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.52]} />
        <meshStandardMaterial color="#ff6b00" emissive="#ff6b00" emissiveIntensity={1.5} />
      </mesh>

      {/* Camera gimbal */}
      <mesh position={[0, -0.1, -0.18]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#222" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[0, -0.1, -0.25]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0a0a0f" metalness={1} roughness={0} />
      </mesh>

      {/* Bottom plate */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.48, 0.02, 0.48]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Arms — 4 diagonal */}
      {ARM_POSITIONS.map((pos, i) => (
        <group key={i}>
          <mesh
            position={[pos[0] * 0.5, 0, pos[2] * 0.5]}
            rotation={[0, Math.atan2(pos[0], pos[2]), 0]}
            castShadow
          >
            <boxGeometry args={[0.09, 0.045, 0.8]} />
            <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Orange accent band on arm */}
          <mesh
            position={[pos[0] * 0.5, 0.025, pos[2] * 0.5]}
            rotation={[0, Math.atan2(pos[0], pos[2]), 0]}
          >
            <boxGeometry args={[0.091, 0.01, 0.25]} />
            <meshStandardMaterial color="#ff6b00" emissive="#ff6b00" emissiveIntensity={0.8} />
          </mesh>
          <Propeller position={pos} spinDir={SPIN_DIRS[i]} />
        </group>
      ))}

      {/* Landing gear — 4 legs */}
      {[[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.2, z]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Front LEDs — green */}
      <mesh position={[0.06, 0, -0.26]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={4} />
      </mesh>
      <mesh position={[-0.06, 0, -0.26]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={4} />
      </mesh>

      {/* Rear LEDs — red */}
      <mesh position={[0.06, 0, 0.26]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={4} />
      </mesh>
      <mesh position={[-0.06, 0, 0.26]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={4} />
      </mesh>
    </group>
  )
}
