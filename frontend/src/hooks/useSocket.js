// src/hooks/useSocket.js
import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from '../config/constants'

export default function useSocket({
  onOutput,
  onStatus,
  onRoomJoined,
  onMemberJoined,
  onMemberLeft,
  onCodeUpdated,
} = {}) {
  const socketRef    = useRef(null)
  const sessionIdRef = useRef(null)
  const [connected, setConnected] = useState(false)

  // Keep refs to the latest callbacks so socket listeners never go stale
  const onOutputRef       = useRef(onOutput)
  const onStatusRef       = useRef(onStatus)
  const onRoomJoinedRef   = useRef(onRoomJoined)
  const onMemberJoinedRef = useRef(onMemberJoined)
  const onMemberLeftRef   = useRef(onMemberLeft)
  const onCodeUpdatedRef  = useRef(onCodeUpdated)

  // Sync refs on every render so handlers always call the latest version
  useEffect(() => { onOutputRef.current       = onOutput      })
  useEffect(() => { onStatusRef.current       = onStatus      })
  useEffect(() => { onRoomJoinedRef.current   = onRoomJoined  })
  useEffect(() => { onMemberJoinedRef.current = onMemberJoined })
  useEffect(() => { onMemberLeftRef.current   = onMemberLeft  })
  useEffect(() => { onCodeUpdatedRef.current  = onCodeUpdated })

  // Buffer a pending join so we can fire it the moment the socket connects
  const pendingJoinRef = useRef(null)

  useEffect(() => {
    const socket = io(API_URL, {
      // websocket first — polling-first breaks on Render/Railway/Vercel proxies
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      setConnected(true)
      // Flush any join_room that was called before the socket was ready
      if (pendingJoinRef.current) {
        socket.emit('join_room', pendingJoinRef.current)
        pendingJoinRef.current = null
      }
    })

    socket.on('disconnect',    () => setConnected(false))
    socket.on('connect_error', (err) => console.error('[socket] error:', err.message))

    // Output: only forward events that belong to this session
    socket.on('output', (data) => {
      if (data?.sessionId && data.sessionId !== sessionIdRef.current) return
      onOutputRef.current?.(data)
    })

    // Status: normalise the payload — server sends { status, sessionId } or a plain string
    socket.on('status', (payload) => {
      if (typeof payload === 'object' && payload !== null) {
        if (payload.sessionId && payload.sessionId !== sessionIdRef.current) return
        onStatusRef.current?.(payload.status)
      } else {
        onStatusRef.current?.(payload)
      }
    })

    socket.on('room_joined',   (data) => onRoomJoinedRef.current?.(data))
    socket.on('member_joined', (data) => onMemberJoinedRef.current?.(data))
    socket.on('member_left',   (data) => onMemberLeftRef.current?.(data))
    socket.on('code_updated',  (data) => onCodeUpdatedRef.current?.(data))

    socketRef.current = socket
    return () => socket.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runCode = useCallback((language, code, roomId) => {
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionIdRef.current = sessionId
    socketRef.current?.emit('run_code', { language, code, roomId, sessionId })
  }, [])

  const joinRoom = useCallback((roomId, userId, displayName) => {
    const payload = { roomId, userId, displayName }
    const socket  = socketRef.current
    if (socket?.connected) {
      // Socket already up — emit right away
      socket.emit('join_room', payload)
    } else {
      // Socket not ready yet — buffer it; the connect handler will flush it
      pendingJoinRef.current = payload
    }
  }, [])

  const sendCodeChange = useCallback((roomId, code, language) => {
    socketRef.current?.emit('code_change', { roomId, code, language })
  }, [])

  return { runCode, joinRoom, sendCodeChange, connected }
}