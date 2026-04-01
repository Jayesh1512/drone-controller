import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useDroneStore } from '../store/droneStore'
import * as THREE from 'three'

const MOVE_SPEED = 6
const BOUNDS = 28 // keep player inside city
const DEG2RAD = Math.PI / 180

// Camera offset behind and above the drone
const CAM_OFFSET = new THREE.Vector3(0, 2.5, 6)

export default function Player() {
  const { camera } = useThree()
  const orientation = useDroneStore((s) => s.orientation)

  const posRef = useRef(new THREE.Vector3(0, 12, 20))
  const yawRef = useRef(0)        // horizontal facing angle
  const keys = useRef({})
  const droneRef = useRef()
  const propRefs = useRef([null, null, null, null])

  // Keyboard listeners
  useEffect(() => {
    const down = (e) => { keys.current[e.key] = true }
    const up = (e) => { keys.current[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, delta) => {
    const k = keys.current

    // --- Yaw from gyroscope alpha (if connected), else arrow left/right ---
    const gyroYaw = (orientation.alpha ?? 0) * DEG2RAD
    if (k['ArrowLeft'] || k['a'] || k['A']) yawRef.current += delta * 1.8
    if (k['ArrowRight'] || k['d'] || k['D']) yawRef.current -= delta * 1.8

    // If gyroscope is streaming, blend yaw toward gyro
    const hasGyro = orientation.alpha !== 0 || orientation.beta !== 0
    if (hasGyro) {
      yawRef.current = THREE.MathUtils.lerp(yawRef.current, -gyroYaw, 0.03)
    }

    // --- Forward / back movement ---
    const forward = new THREE.Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current)
    )
    const right = new THREE.Vector3(
      Math.cos(yawRef.current),
      0,
      -Math.sin(yawRef.current)
    )

    const vel = new THREE.Vector3()
    if (k['ArrowUp'] || k['w'] || k['W']) vel.addScaledVector(forward, MOVE_SPEED * delta)
    if (k['ArrowDown'] || k['s'] || k['S']) vel.addScaledVector(forward, -MOVE_SPEED * delta)

    posRef.current.add(vel)

    // Clamp inside city bounds
    posRef.current.x = THREE.MathUtils.clamp(posRef.current.x, -BOUNDS, BOUNDS)
    posRef.current.z = THREE.MathUtils.clamp(posRef.current.z, -BOUNDS, BOUNDS)

    // Hover bob
    posRef.current.y = 12 + Math.sin(Date.now() * 0.001) * 0.08

    // --- Drone mesh ---
    if (droneRef.current) {
      droneRef.current.position.lerp(posRef.current, 0.15)
      droneRef.current.rotation.y = THREE.MathUtils.lerp(
        droneRef.current.rotation.y,
        yawRef.current,
        0.1
      )

      // Tilt based on gyro pitch/roll
      const gyroPitch = (orientation.beta ?? 0) * DEG2RAD * 0.4
      const gyroRoll = (orientation.gamma ?? 0) * DEG2RAD * 0.4
      droneRef.current.rotation.x = THREE.MathUtils.lerp(droneRef.current.rotation.x, gyroPitch, 0.08)
      droneRef.current.rotation.z = THREE.MathUtils.lerp(droneRef.current.rotation.z, -gyroRoll, 0.08)

      // Tilt forward when moving
      const moving = k['ArrowUp'] || k['w'] || k['W']
      const movingBack = k['ArrowDown'] || k['s'] || k['S']
      const tilt = moving ? -0.18 : movingBack ? 0.12 : 0
      droneRef.current.rotation.x = THREE.MathUtils.lerp(droneRef.current.rotation.x, gyroPitch + tilt, 0.1)
    }

    // --- Spin propellers ---
    propRefs.current.forEach((ref, i) => {
      if (ref) ref.rotation.y += delta * 30 * (i % 2 === 0 ? 1 : -1)
    })

    // --- Third-person camera ---
    const camOffset = CAM_OFFSET.clone()
    camOffset.applyEuler(new THREE.Euler(0, yawRef.current, 0))
    const targetCamPos = posRef.current.clone().add(camOffset)
    camera.position.lerp(targetCamPos, 0.08)
    camera.lookAt(posRef.current.clone().add(new THREE.Vector3(0, 0.5, 0)))
  })

  const ARM_POSITIONS = [
    [-0.7, 0, -0.7], [0.7, 0, -0.7],
    [-0.7, 0, 0.7],  [0.7, 0, 0.7],
  ]
  const SPIN_DIRS = [1, -1, -1, 1]

  return (
    <group ref={droneRef} position={[0, 10, 16]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
        <meshLambertMaterial color="#c8b89a" flatShading />
      </mesh>
      {/* Top shell */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.44, 0.07, 0.44]} />
        <meshLambertMaterial color="#a07850" flatShading />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.17, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#2a1f14" flatShading />
      </mesh>
      {/* Center stripe */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.52]} />
        <meshStandardMaterial color="#c8860a" emissive="#c8860a" emissiveIntensity={1.2} />
      </mesh>
      {/* Arms */}
      {ARM_POSITIONS.map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0] * 0.5, 0, pos[2] * 0.5]} rotation={[0, Math.atan2(pos[0], pos[2]), 0]}>
            <boxGeometry args={[0.09, 0.04, 0.8]} />
            <meshLambertMaterial color="#b8a888" flatShading />
          </mesh>
          {/* Motor */}
          <mesh position={pos}>
            <cylinderGeometry args={[0.07, 0.07, 0.07, 6]} />
            <meshLambertMaterial color="#888880" flatShading />
          </mesh>
          {/* Wing tip light — off white glow */}
          <mesh position={[pos[0], pos[1] - 0.05, pos[2]]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color="#f0ede8" emissive="#f0ede8" emissiveIntensity={2.5} />
          </mesh>
          <pointLight position={[pos[0], pos[1] - 0.05, pos[2]]} color="#f0ede8" intensity={0.4} distance={1.2} />
          {/* Prop */}
          <group ref={(el) => (propRefs.current[i] = el)} position={[pos[0], pos[1] + 0.06, pos[2]]}>
            <mesh>
              <boxGeometry args={[0.55, 0.012, 0.09]} />
              <meshLambertMaterial color="#4a3820" flatShading />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.55, 0.012, 0.09]} />
              <meshLambertMaterial color="#4a3820" flatShading />
            </mesh>
          </group>
        </group>
      ))}
      {/* Landing gear */}
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.18, z]}>
          <cylinderGeometry args={[0.015, 0.015, 0.18, 5]} />
          <meshLambertMaterial color="#666660" flatShading />
        </mesh>
      ))}
      {/* Front light — warm amber */}
      <mesh position={[0, 0, -0.27]}>
        <sphereGeometry args={[0.028, 6, 4]} />
        <meshStandardMaterial color="#ffe08a" emissive="#ffe08a" emissiveIntensity={3} />
      </mesh>
      {/* Rear light — dim red */}
      <mesh position={[0, 0, 0.27]}>
        <sphereGeometry args={[0.028, 6, 4]} />
        <meshStandardMaterial color="#cc4422" emissive="#cc4422" emissiveIntensity={3} />
      </mesh>
      {/* Small under-light for ground effect */}
      <pointLight position={[0, -0.3, 0]} color="#c8860a" intensity={1.5} distance={2.5} />
    </group>
  )
}
