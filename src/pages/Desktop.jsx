import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Stars } from '@react-three/drei'
import { QRCodeSVG } from 'qrcode.react'
import { useDroneStore } from '../store/droneStore'
import { useAblySubscribe } from '../hooks/useAbly'
import Drone from '../components/Drone'

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function Desktop() {
  const { roomId, setRoomId, setOrientation, connected, setConnected } = useDroneStore()

  // Generate a room ID once on mount
  useEffect(() => {
    setRoomId(generateRoomId())
  }, [])

  // Build the mobile controller URL with room ID
  const controlUrl = useMemo(() => {
    if (!roomId) return null
    const base = window.location.origin
    return `${base}/control?room=${roomId}`
  }, [roomId])

  // Subscribe to gyro data from mobile via Ably
  useAblySubscribe(roomId, (data) => {
    setOrientation(data)
    setConnected(true)
  })

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] relative">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        shadows
        className="w-full h-full"
      >
        <color attach="background" args={['#0a0a0f']} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[0, 2, 0]} color="#7c3aed" intensity={2} />

        {/* Environment */}
        <Stars radius={80} depth={50} count={3000} factor={4} fade />
        <Grid
          position={[0, -2, 0]}
          args={[20, 20]}
          cellColor="#7c3aed"
          sectionColor="#4c1d95"
          fadeDistance={15}
          cellSize={0.5}
          sectionSize={2}
        />

        {/* Drone */}
        <Drone />

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
          <span className="text-white/70 text-sm font-mono tracking-widest uppercase">
            {connected ? 'Controller Connected' : 'Waiting for Controller'}
          </span>
        </div>

        {/* Room ID */}
        <div className="absolute top-4 left-4 font-mono text-xs text-white/40">
          ROOM: {roomId}
        </div>

        {/* QR Panel */}
        <div className="absolute bottom-6 right-6 pointer-events-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
          <p className="text-white/50 text-xs font-mono uppercase tracking-widest">
            Scan to Control
          </p>
          {controlUrl && (
            <div className="bg-white p-2 rounded-xl">
              <QRCodeSVG value={controlUrl} size={140} />
            </div>
          )}
          <p className="text-white/30 text-[10px] font-mono">{roomId}</p>
        </div>

        {/* Corner brackets (decorative) */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-purple-500/50 rounded-tl" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-purple-500/50 rounded-tr" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-500/50 rounded-bl" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-500/50 rounded-br" />
      </div>
    </div>
  )
}
