import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useDroneStore } from '../store/droneStore'
import * as THREE from 'three'

const DEG2RAD = Math.PI / 180

// Arm positions (front-left, front-right, back-left, back-right)
const ARM_POSITIONS = [
  [-0.6, 0, -0.6],
  [0.6, 0, -0.6],
  [-0.6, 0, 0.6],
  [0.6, 0, 0.6],
]

// Propeller spin direction (alternating for counter-torque)
const SPIN_DIRS = [1, -1, -1, 1]

function Propeller({ position, spinDir }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += spinDir * delta * 30
    }
  })

  return (
    <group position={position}>
      {/* Motor housing */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Propeller blades */}
      <group ref={ref} position={[0, 0.05, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.015, 0.08]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.5, 0.015, 0.08]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.5} />
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

    // Map gyro to drone orientation
    // beta  (-90 to 90)  → pitch (tilt fwd/back) → X rotation + Z position
    // gamma (-90 to 90)  → roll  (tilt left/right) → Z rotation + X position
    // alpha (0 to 360)   → yaw   (compass heading) → Y rotation
    const pitch = (orientation.beta ?? 0) * DEG2RAD * 0.5
    const roll = (orientation.gamma ?? 0) * DEG2RAD * 0.5
    const yaw = (orientation.alpha ?? 0) * DEG2RAD

    targetRotation.current.set(pitch, yaw, -roll)

    // Translate drone based on tilt (tilt forward = fly forward)
    targetPosition.current.x = (orientation.gamma ?? 0) * 0.03
    targetPosition.current.z = (orientation.beta ?? 0) * 0.03

    // Smooth interpolation (lerp)
    droneRef.current.rotation.x = THREE.MathUtils.lerp(
      droneRef.current.rotation.x,
      targetRotation.current.x,
      0.08
    )
    droneRef.current.rotation.y = THREE.MathUtils.lerp(
      droneRef.current.rotation.y,
      targetRotation.current.y,
      0.04
    )
    droneRef.current.rotation.z = THREE.MathUtils.lerp(
      droneRef.current.rotation.z,
      targetRotation.current.z,
      0.08
    )
    droneRef.current.position.x = THREE.MathUtils.lerp(
      droneRef.current.position.x,
      targetPosition.current.x,
      0.05
    )
    droneRef.current.position.z = THREE.MathUtils.lerp(
      droneRef.current.position.z,
      targetPosition.current.z,
      0.05
    )

    // Hover bob animation
    droneRef.current.position.y =
      Math.sin(Date.now() * 0.001) * 0.08
  })

  return (
    <group ref={droneRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.4, 0.12, 0.4]} />
        <meshStandardMaterial color="#1e1e2e" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Top dome */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.4} roughness={0.3} transparent opacity={0.85} />
      </mesh>

      {/* Camera pod */}
      <mesh position={[0, -0.1, -0.15]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* LED strip glow */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.42]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={2} />
      </mesh>

      {/* Arms */}
      {ARM_POSITIONS.map((pos, i) => (
        <group key={i}>
          {/* Diagonal arm */}
          <mesh
            position={[pos[0] * 0.5, 0, pos[2] * 0.5]}
            rotation={[0, Math.atan2(pos[0], pos[2]), 0]}
          >
            <boxGeometry args={[0.08, 0.04, 0.7]} />
            <meshStandardMaterial color="#2a2a3e" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Propeller at arm end */}
          <Propeller position={pos} spinDir={SPIN_DIRS[i]} />
        </group>
      ))}

      {/* Front indicator lights */}
      <mesh position={[0.05, 0, -0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-0.05, 0, -0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={3} />
      </mesh>

      {/* Rear indicator lights */}
      <mesh position={[0.05, 0, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-0.05, 0, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}
