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
  const socketRef  = useRef(null)
  const [connected, setConnected] = useState(false)

  // Keep refs to the latest callbacks so socket listeners never go stale
  const onOutputRef      = useRef(onOutput)
  const onStatusRef      = useRef(onStatus)
  const onRoomJoinedRef  = useRef(onRoomJoined)
  const onMemberJoinedRef = useRef(onMemberJoined)
  const onMemberLeftRef  = useRef(onMemberLeft)
  const onCodeUpdatedRef = useRef(onCodeUpdated)

  // Sync refs on every render so handlers always call the latest version
  useEffect(() => { onOutputRef.current      = onOutput      })
  useEffect(() => { onStatusRef.current      = onStatus      })
  useEffect(() => { onRoomJoinedRef.current  = onRoomJoined  })
  useEffect(() => { onMemberJoinedRef.current = onMemberJoined })
  useEffect(() => { onMemberLeftRef.current  = onMemberLeft  })
  useEffect(() => { onCodeUpdatedRef.current = onCodeUpdated })

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

    // Each listener delegates to the latest ref — no stale closures
    socket.on('output',        (data) => onOutputRef.current?.(data))
    socket.on('status',        (s)    => onStatusRef.current?.(s))
    socket.on('room_joined',   (data) => onRoomJoinedRef.current?.(data))
    socket.on('member_joined', (data) => onMemberJoinedRef.current?.(data))
    socket.on('member_left',   (data) => onMemberLeftRef.current?.(data))
    socket.on('code_updated',  (data) => onCodeUpdatedRef.current?.(data))

    socketRef.current = socket
    return () => socket.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runCode = useCallback((language, code, roomId) => {
    socketRef.current?.emit('run_code', { language, code, roomId })
  }, [])

  const joinRoom = useCallback((roomId, userId, displayName) => {
    socketRef.current?.emit('join_room', { roomId, userId, displayName })
  }, [])

  const sendCodeChange = useCallback((roomId, code, language) => {
    socketRef.current?.emit('code_change', { roomId, code, language })
  }, [])

  return { runCode, joinRoom, sendCodeChange, connected }
}