import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { QRCodeSVG } from 'qrcode.react'
import { useDroneStore } from '../store/droneStore'
import { useAblySubscribe } from '../hooks/useAbly'
import City from '../components/City'
import HeroBuilding from '../components/HeroBuilding'
import Player from '../components/Player'

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0e0b08']} />
      <fog attach="fog" args={['#0e0b08', 18, 55]} />

      {/* Moonlight — cool white from high above */}
      <directionalLight position={[-8, 20, -10]} intensity={1.2} color="#d0c8b8" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={80} shadow-camera-left={-30} shadow-camera-right={30}
        shadow-camera-top={30} shadow-camera-bottom={-30}
      />
      {/* Warm fill from low angle */}
      <directionalLight position={[6, 2, 8]} intensity={0.5} color="#c8a060" />
      {/* Low ambient — dark, moody */}
      <ambientLight intensity={0.25} color="#3a3020" />

      {/* Stars — sparse, like a hazy night */}
      <Stars radius={100} depth={50} count={1500} factor={2} fade speed={0.2} />

      <City />
      <HeroBuilding />
      <Player />
    </>
  )
}

export default function Desktop() {
  const { roomId, setRoomId, setOrientation, connected, setConnected } = useDroneStore()

  useEffect(() => { setRoomId(generateRoomId()) }, [])

  const controlUrl = useMemo(() => {
    if (!roomId) return null
    return `${window.location.origin}/control?room=${roomId}`
  }, [roomId])

  useAblySubscribe(roomId, (data) => {
    setOrientation(data)
    setConnected(true)
  })

  return (
    <div className="w-screen h-screen bg-[#0e0b08] relative overflow-hidden">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 12, 22], fov: 60 }}
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }}
      />

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Top center — connection status */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 border border-[#c8860a]/20 rounded px-4 py-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#c8860a]' : 'bg-[#664400]'}`} />
          <span className="text-[#c8860a]/70 text-[10px] font-mono tracking-[0.2em] uppercase">
            {connected ? 'Gyro Connected' : 'No Controller'}
          </span>
        </div>

        {/* Top left */}
        <div className="absolute top-5 left-5">
          <p className="text-[#c8860a]/40 text-[9px] font-mono tracking-[0.25em] uppercase">Room · {roomId}</p>
        </div>

        {/* Bottom left — controls hint */}
        <div className="absolute bottom-6 left-6 text-[#c8860a]/40 text-[10px] font-mono space-y-1">
          <p>↑ ↓ ← →  fly</p>
          <p>gyro · axes</p>
        </div>

        {/* QR panel — bottom right */}
        <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-center gap-2 bg-black/60 border border-[#c8860a]/20 rounded p-3">
          <p className="text-[#c8860a]/50 text-[9px] font-mono uppercase tracking-[0.2em]">Scan · Control</p>
          {controlUrl && (
            <div className="bg-[#f5e6c8] p-1.5 rounded">
              <QRCodeSVG value={controlUrl} size={110} bgColor="#f5e6c8" fgColor="#1a1208" />
            </div>
          )}
          <p className="text-[#c8860a]/30 text-[8px] font-mono">{roomId}</p>
        </div>

        {/* Corner marks */}
        {[
          'top-3 left-3 border-t border-l',
          'top-3 right-3 border-t border-r',
          'bottom-3 left-3 border-b border-l',
          'bottom-3 right-3 border-b border-r',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-4 h-4 border-[#c8860a]/30 ${cls}`} />
        ))}

        {/* Gyro readout */}
        {connected && <GyroHUD />}
      </div>
    </div>
  )
}

function GyroHUD() {
  const o = useDroneStore((s) => s.orientation)
  return (
    <div className="absolute bottom-6 left-24 font-mono text-[9px] flex flex-col gap-0.5 text-[#c8860a]/50">
      {[['Y', o.alpha], ['P', o.beta], ['R', o.gamma]].map(([l, v]) => (
        <div key={l} className="flex gap-2">
          <span>{l}</span>
          <span className="w-12 text-right text-[#c8860a]/70">{(v ?? 0).toFixed(1)}°</span>
        </div>
      ))}
    </div>
  )
}
