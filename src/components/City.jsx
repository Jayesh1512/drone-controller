export default function City() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshLambertMaterial color="#12100c" />
      </mesh>

      {/* Subtle grid */}
      <gridHelper args={[120, 60, '#1e1a12', '#181410']} position={[0, 0.01, 0]} />

      {/* Ambient ground glow */}
      <pointLight position={[0, 0.5, 0]} color="#c8860a" intensity={3} distance={14} />
    </group>
  )
}
