import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Stars, ContactShadows } from '@react-three/drei'
import { QRCodeSVG } from 'qrcode.react'
import { useDroneStore } from '../store/droneStore'
import { useAblySubscribe } from '../hooks/useAbly'
import Drone from '../components/Drone'

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0d0d1a']} />
      <fog attach="fog" args={['#0d0d1a', 10, 40]} />

      {/* Key light — warm white from above-front */}
      <directionalLight position={[3, 6, 4]} intensity={3} color="#ffffff" castShadow />
      {/* Fill light — cool blue from side */}
      <directionalLight position={[-4, 2, -2]} intensity={1.5} color="#88aaff" />
      {/* Rim light — orange from behind */}
      <directionalLight position={[0, -1, -5]} intensity={1.2} color="#ff6b00" />
      {/* Ambient — enough to see dark areas */}
      <ambientLight intensity={0.8} color="#334466" />
      {/* Under-glow orange point */}
      <pointLight position={[0, -0.5, 0]} color="#ff6b00" intensity={3} distance={4} />

      <Stars radius={100} depth={60} count={4000} factor={3} fade speed={0.5} />

      <Grid
        position={[0, -2, 0]}
        args={[30, 30]}
        cellColor="#ff6b00"
        sectionColor="#662200"
        fadeDistance={20}
        cellSize={0.6}
        sectionSize={3}
        cellThickness={0.5}
        sectionThickness={1.2}
      />

      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.6}
        scale={6}
        blur={2}
        far={3}
        color="#ff6b00"
      />

      <Drone />

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={10}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  )
}

export default function Desktop() {
  const { roomId, setRoomId, setOrientation, connected, setConnected } = useDroneStore()

  useEffect(() => {
    setRoomId(generateRoomId())
  }, [])

  const controlUrl = useMemo(() => {
    if (!roomId) return null
    return `${window.location.origin}/control?room=${roomId}`
  }, [roomId])

  useAblySubscribe(roomId, (data) => {
    setOrientation(data)
    setConnected(true)
  })

  return (
    <div className="w-screen h-screen bg-[#0d0d1a] relative">
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 55 }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Top center status */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-orange-500'} animate-pulse`} />
          <span className="text-white/80 text-xs font-mono tracking-widest uppercase">
            {connected ? 'Controller Connected' : 'Waiting for Controller'}
          </span>
        </div>

        {/* Top left — room */}
        <div className="absolute top-5 left-5 font-mono text-[11px] text-orange-400/60 tracking-widest">
          ROOM · {roomId}
        </div>

        {/* Top right — title */}
        <div className="absolute top-5 right-5 text-right">
          <p className="text-white font-bold text-lg tracking-tight leading-none">DRONE</p>
          <p className="text-orange-400 text-[10px] font-mono tracking-widest">CONTROLLER</p>
        </div>

        {/* QR panel — bottom right */}
        <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-center gap-2 bg-black/50 backdrop-blur-md border border-orange-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(255,107,0,0.15)]">
          <p className="text-orange-400/70 text-[10px] font-mono uppercase tracking-widest">Scan to Control</p>
          {controlUrl && (
            <div className="bg-white p-2 rounded-xl">
              <QRCodeSVG value={controlUrl} size={130} />
            </div>
          )}
          <p className="text-white/20 text-[9px] font-mono">{roomId}</p>
        </div>

        {/* Corner brackets */}
        {[
          'top-3 left-3 border-t-2 border-l-2 rounded-tl',
          'top-3 right-3 border-t-2 border-r-2 rounded-tr',
          'bottom-3 left-3 border-b-2 border-l-2 rounded-bl',
          'bottom-3 right-3 border-b-2 border-r-2 rounded-br',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 border-orange-500/40 ${cls}`} />
        ))}

        {/* Gyro readout — bottom left (shows when connected) */}
        {connected && <GyroHUD />}
      </div>
    </div>
  )
}

function GyroHUD() {
  const orientation = useDroneStore((s) => s.orientation)
  return (
    <div className="absolute bottom-6 left-6 font-mono text-[11px] flex flex-col gap-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-3">
      {[
        { label: 'YAW', value: orientation.alpha, color: 'text-sky-400' },
        { label: 'PITCH', value: orientation.beta, color: 'text-emerald-400' },
        { label: 'ROLL', value: orientation.gamma, color: 'text-orange-400' },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-white/30 w-10">{label}</span>
          <span className={`${color} w-16 text-right`}>{(value ?? 0).toFixed(1)}°</span>
        </div>
      ))}
    </div>
  )
}
