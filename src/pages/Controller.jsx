import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAblyPublish } from '../hooks/useAbly'

const PUBLISH_INTERVAL_MS = 50 // ~20fps, enough for smooth control

export default function Controller() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room')

  const [permission, setPermission] = useState('idle') // idle | granted | denied
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const publish = useAblyPublish(roomId)
  const lastPublish = useRef(0)

  const startGyro = async () => {
    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission()
        if (response === 'granted') {
          setPermission('granted')
        } else {
          setPermission('denied')
        }
      } catch {
        setPermission('denied')
      }
    } else {
      // Android / non-iOS — permission not needed
      setPermission('granted')
    }
  }

  useEffect(() => {
    if (permission !== 'granted') return

    const handleOrientation = (e) => {
      const data = {
        alpha: e.alpha ?? 0,
        beta: e.beta ?? 0,
        gamma: e.gamma ?? 0,
      }
      setOrientation(data)

      // Throttle publishing to avoid flooding Ably
      const now = Date.now()
      if (now - lastPublish.current >= PUBLISH_INTERVAL_MS) {
        publish(data)
        lastPublish.current = now
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [permission, publish])

  if (!roomId) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-red-400 font-mono text-sm">No room ID. Scan the QR code from the desktop.</p>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-8 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-white text-2xl font-bold tracking-tight">Drone Controller</h1>
        <p className="text-white/40 text-sm font-mono mt-1">ROOM: {roomId}</p>
      </div>

      {permission === 'idle' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl">🎮</div>
          <p className="text-white/60 text-sm text-center max-w-xs">
            Tilt your phone to control the drone. Tap below to enable the gyroscope.
          </p>
          <button
            onClick={startGyro}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all"
          >
            Enable Gyroscope
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">⚠️</div>
          <p className="text-red-400 text-sm text-center max-w-xs">
            Gyroscope permission denied. Please allow motion access in your browser settings and reload.
          </p>
        </div>
      )}

      {permission === 'granted' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          {/* Live status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse" />
            <span className="text-green-400 text-sm font-mono">Streaming</span>
          </div>

          {/* Visual tilt indicator */}
          <div className="relative w-48 h-48 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-purple-500 shadow-[0_0_16px_#7c3aed] transition-transform"
              style={{
                transform: `translate(${(orientation.gamma ?? 0) * 1.2}px, ${(orientation.beta ?? 0) * 1.2}px)`,
              }}
            />
            {/* Crosshair */}
            <div className="absolute w-full h-px bg-white/10 top-1/2" />
            <div className="absolute h-full w-px bg-white/10 left-1/2" />
          </div>

          {/* Gyro values */}
          <div className="w-full grid grid-cols-3 gap-2">
            {[
              { label: 'YAW', value: orientation.alpha, color: 'text-blue-400' },
              { label: 'PITCH', value: orientation.beta, color: 'text-green-400' },
              { label: 'ROLL', value: orientation.gamma, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-[10px] font-mono">{label}</p>
                <p className={`${color} text-lg font-mono font-bold`}>
                  {value?.toFixed(1) ?? '0.0'}°
                </p>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-xs text-center">
            Tilt phone forward/back to pitch · left/right to roll · rotate to yaw
          </p>
        </div>
      )}
    </div>
  )
}
