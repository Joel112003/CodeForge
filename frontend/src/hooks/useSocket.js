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
  const sessionIdRef = useRef(null) // tracks the active run's session ID
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

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect',       () => setConnected(true))
    socket.on('disconnect',    () => setConnected(false))
    socket.on('connect_error', (err) => console.error('[socket] error:', err.message))

    // Output: only forward events that belong to this session
    socket.on('output', (data) => {
      // If the event carries a sessionId, it must match our active run
      if (data?.sessionId && data.sessionId !== sessionIdRef.current) return
      onOutputRef.current?.(data)
    })

    // Status: normalise the payload — server sends { status, sessionId } or a plain string
    socket.on('status', (payload) => {
      if (typeof payload === 'object' && payload !== null) {
        // Drop events that belong to a different run
        if (payload.sessionId && payload.sessionId !== sessionIdRef.current) return
        onStatusRef.current?.(payload.status)
      } else {
        // Legacy plain-string status (room sync, etc.) — always forward
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
    // Generate a fresh sessionId for every run so outputs are strictly scoped
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionIdRef.current = sessionId
    socketRef.current?.emit('run_code', { language, code, roomId, sessionId })
  }, [])

  const joinRoom = useCallback((roomId, userId, displayName) => {
    socketRef.current?.emit('join_room', { roomId, userId, displayName })
  }, [])

  const sendCodeChange = useCallback((roomId, code, language) => {
    socketRef.current?.emit('code_change', { roomId, code, language })
  }, [])

  return { runCode, joinRoom, sendCodeChange, connected }
}