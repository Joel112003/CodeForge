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
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect',       () => setConnected(true))
    socket.on('disconnect',    () => setConnected(false))
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))
    socket.on('output',        (data) => onOutput?.(data))
    socket.on('status',        (s)    => onStatus?.(s))
    socket.on('room_joined',   (data) => onRoomJoined?.(data))
    socket.on('member_joined', (data) => onMemberJoined?.(data))
    socket.on('member_left',   (data) => onMemberLeft?.(data))
    socket.on('code_updated',  (data) => onCodeUpdated?.(data))

    socketRef.current = socket
    return () => socket.disconnect()
  }, [])

  const runCode = useCallback((language, code, roomId) => {
    socketRef.current?.emit('run_code', { language, code, roomId })
  }, [])

  const joinRoom = useCallback((roomId, userId) => {
    socketRef.current?.emit('join_room', { roomId, userId })
  }, [])

  const sendCodeChange = useCallback((roomId, code, language) => {
    socketRef.current?.emit('code_change', { roomId, code, language })
  }, [])

  return { runCode, joinRoom, sendCodeChange, connected }
}