import { useMemo } from 'react'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function Building({ position, width, depth, height, color, windowColor }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>
      {/* Roof */}
      <mesh position={[0, height + 0.06, 0]}>
        <boxGeometry args={[width + 0.06, 0.12, depth + 0.06]} />
        <meshLambertMaterial color="#1a1510" flatShading />
      </mesh>
      {/* Window rows — warm amber */}
      {Array.from({ length: Math.max(1, Math.floor(height / 1.4)) }).map((_, i) => (
        <mesh key={i} position={[0, 0.7 + i * 1.4, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.65, 0.3, 0.02]} />
          <meshStandardMaterial
            color={windowColor}
            emissive={windowColor}
            emissiveIntensity={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

function StreetLight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 3, 5]} />
        <meshLambertMaterial color="#4a4035" flatShading />
      </mesh>
      <mesh position={[0.3, 3, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 4]} />
        <meshLambertMaterial color="#4a4035" flatShading />
      </mesh>
      <mesh position={[0.55, 2.85, 0]}>
        <sphereGeometry args={[0.08, 6, 4]} />
        <meshStandardMaterial color="#f5e6c8" emissive="#f5e6c8" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0.55, 2.85, 0]} color="#e8c880" intensity={1.2} distance={7} />
    </group>
  )
}

function Road({ from, to, width = 1.2 }) {
  const mid = [(from[0] + to[0]) / 2, 0.01, (from[2] + to[2]) / 2]
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]
  const len = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dx, dz)
  return (
    <mesh position={mid} rotation={[0, angle, 0]} receiveShadow>
      <boxGeometry args={[width, 0.02, len]} />
      <meshLambertMaterial color="#1e1a14" />
    </mesh>
  )
}

export default function City() {
  const rand = useMemo(() => seededRandom(42), [])

  const buildings = useMemo(() => {
    const result = []
    const occupied = new Set()
    const gridSize = 28
    const spacing = 4

    // Retro building colors — dusty brick, warm concrete, aged stone
    const colorPalette = ['#3d3020', '#4a3828', '#352820', '#2e2418', '#3a2e1e', '#443320', '#2a2218']
    // Window colors — warm incandescent, no neon
    const windowPalette = ['#c8860a', '#d4920c', '#b87808', '#e0a030', '#c07020']

    for (let gx = -gridSize; gx <= gridSize; gx += spacing) {
      for (let gz = -gridSize; gz <= gridSize; gz += spacing) {
        if (Math.abs(gx) < 7 && Math.abs(gz) < 7) continue
        const jx = gx + (rand() - 0.5) * 1.5
        const jz = gz + (rand() - 0.5) * 1.5
        const w = 0.8 + rand() * 1.5
        const d = 0.8 + rand() * 1.5
        const h = 1.5 + rand() * 7
        const key = `${Math.round(jx)},${Math.round(jz)}`
        if (occupied.has(key)) continue
        occupied.add(key)
        result.push({
          id: key,
          position: [jx, 0, jz],
          width: w, depth: d, height: h,
          color: colorPalette[Math.floor(rand() * colorPalette.length)],
          windowColor: windowPalette[Math.floor(rand() * windowPalette.length)],
        })
      }
    }
    return result
  }, [])

  return (
    <group>
      {/* Ground — dark warm asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshLambertMaterial color="#12100c" />
      </mesh>

      {/* Cobblestone grid hint */}
      <gridHelper args={[120, 60, '#1e1a12', '#181410']} position={[0, 0.01, 0]} />

      {/* Roads */}
      <Road from={[-30, 0, 0]} to={[30, 0, 0]} width={2.5} />
      <Road from={[0, 0, -30]} to={[0, 0, 30]} width={2.5} />
      <Road from={[-30, 0, -10]} to={[30, 0, -10]} width={1.4} />
      <Road from={[-30, 0, 10]} to={[30, 0, 10]} width={1.4} />
      <Road from={[-10, 0, -30]} to={[-10, 0, 30]} width={1.4} />
      <Road from={[10, 0, -30]} to={[10, 0, 30]} width={1.4} />

      {/* Buildings */}
      {buildings.map((b) => <Building key={b.id} {...b} />)}

      {/* Street lights */}
      {[[-4,0,-12],[4,0,-12],[-12,0,-4],[-12,0,4],[12,0,-4],[12,0,4],[-4,0,12],[4,0,12],[-8,0,-8],[8,0,-8],[-8,0,8],[8,0,8]].map((p, i) => (
        <StreetLight key={i} position={p} />
      ))}

      {/* Ambient warm ground glow */}
      <pointLight position={[0, 0.5, 0]} color="#c8860a" intensity={3} distance={14} />
      <pointLight position={[-16, 2, -16]} color="#8b6040" intensity={1.5} distance={18} />
      <pointLight position={[16, 2, 16]} color="#8b6040" intensity={1.5} distance={18} />
    </group>
  )
}
