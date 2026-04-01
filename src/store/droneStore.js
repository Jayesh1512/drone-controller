import { create } from 'zustand'

export const useDroneStore = create((set) => ({
  // Gyroscope orientation from mobile
  orientation: { alpha: 0, beta: 0, gamma: 0 },
  setOrientation: (orientation) => set({ orientation }),

  // Room ID for Ably channel pairing
  roomId: null,
  setRoomId: (roomId) => set({ roomId }),

  // Connection status
  connected: false,
  setConnected: (connected) => set({ connected }),
}))
