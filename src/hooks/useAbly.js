import { useEffect, useRef } from 'react'
import * as Ably from 'ably'

const ABLY_KEY = import.meta.env.VITE_ABLY_API_KEY

/**
 * useAblySubscribe — Desktop: subscribes to gyro data on a room channel
 */
export function useAblySubscribe(roomId, onMessage) {
  const clientRef = useRef(null)

  useEffect(() => {
    if (!roomId || !ABLY_KEY) return

    const client = new Ably.Realtime({ key: ABLY_KEY })
    clientRef.current = client

    const channel = client.channels.get(`drone:${roomId}`)
    channel.subscribe('gyro', (msg) => {
      onMessage(msg.data)
    })

    return () => {
      channel.unsubscribe()
      client.close()
    }
  }, [roomId])
}

/**
 * useAblyPublish — Mobile: returns a publish function for gyro data
 */
export function useAblyPublish(roomId) {
  const channelRef = useRef(null)
  const clientRef = useRef(null)

  useEffect(() => {
    if (!roomId || !ABLY_KEY) return

    const client = new Ably.Realtime({ key: ABLY_KEY })
    clientRef.current = client

    clientRef.current.connection.on('connected', () => {
      channelRef.current = client.channels.get(`drone:${roomId}`)
    })

    return () => {
      client.close()
    }
  }, [roomId])

  const publish = (data) => {
    if (channelRef.current) {
      channelRef.current.publish('gyro', data)
    }
  }

  return publish
}
