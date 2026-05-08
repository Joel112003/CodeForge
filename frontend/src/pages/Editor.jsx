// src/pages/Editor.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useSocket from '../hooks/useSocket'
import { DEFAULT_CODE } from '../config/constants'
import CodeEditor from '../components/editor/CodeEditor'
import LanguageSelector from '../components/editor/LanguageSelector'
import Terminal from '../components/terminal/Terminal'
import MemberList from '../components/room/MemberList'
import Badge from '../components/ui/Badge'
import NoiseBackground from '../components/ui/NoiseBackground'
import EditorTopbar, { RunButton, TopbarOutlineBtn, ConnectionBadge } from '../components/layout/EditorTopbar'

const T = {
  parchment: '#F8F4ED',
  deep:      '#F5F0E8',
  muted:     '#7A6E5A',
  rule:      '#E0D8CA',
  accent:    '#C04A1A',
}

function normalizeOutput(payload) {
  if (typeof payload === 'string') return { type: 'stdout', data: payload }
  if (payload?.data)    return payload
  if (payload?.output)  return { type: payload.type || 'stdout', data: payload.output }
  if (payload?.message) return { type: payload.type || 'stdout', data: payload.message }
  return { type: 'stdout', data: String(payload ?? '') }
}

export default function Editor() {
  const { roomId }                    = useParams()
  const { user }                      = useAuthStore()
  const [language,    setLanguage]    = useState('javascript')
  const [code,        setCode]        = useState(DEFAULT_CODE.javascript)
  const [outputLines, setOutputLines] = useState([])
  const [status,      setStatus]      = useState('IDLE')
  const [members,     setMembers]     = useState([])
  const [connected,   setConnected]   = useState(false)
  const isRemoteUpdate = useRef(false)

  const { runCode, joinRoom, sendCodeChange } = useSocket({
    onOutput: (data) => {
      const normalized = normalizeOutput(data)
      if (normalized.data) setOutputLines((prev) => [...prev, normalized])
    },
    onStatus:      (s) => setStatus(s),
    onRoomJoined:  ({ room, members: m }) => {
      setMembers(m || [])
      setCode(room.code || DEFAULT_CODE[room.language] || DEFAULT_CODE.javascript)
      setLanguage(room.language || 'javascript')
      setConnected(true)
    },
    onMemberJoined: ({ members: m }) => setMembers(m || []),
    onMemberLeft:   ({ members: m }) => setMembers(m || []),
    onCodeUpdated:  ({ code: c, language: l }) => {
      isRemoteUpdate.current = true
      setCode(c)
      setLanguage(l)
      setTimeout(() => { isRemoteUpdate.current = false }, 0)
    },
  })

  useEffect(() => {
    if (!roomId || !user) return
    // userId = UUID (for DB); displayName = email (shown in member list)
    // No setTimeout needed — useSocket buffers the join until the socket is connected
    joinRoom(roomId, user.id, user.email)
  }, [roomId, user, joinRoom])

  function handleCodeChange(val) {
    setCode(val)
    if (!isRemoteUpdate.current && roomId) sendCodeChange(roomId, val, language)
  }

  function handleLanguageChange(lang) {
    setLanguage(lang)
    setCode(DEFAULT_CODE[lang])
    if (roomId) sendCodeChange(roomId, DEFAULT_CODE[lang], lang)
  }

  function handleRun() {
    setOutputLines([])
    runCode(language, code, roomId)
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: T.parchment, fontFamily: "'DM Mono', monospace" }}
    >
      <NoiseBackground />

      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <EditorTopbar
        left={
          <>
            <LanguageSelector value={language} onChange={handleLanguageChange} />
            <Badge status={status} />
            {/* room id pill */}
            {roomId && (
              <span style={{
                fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: T.muted, border: `1px solid ${T.rule}`,
                background: T.deep, padding: '3px 8px',
              }}>
                {roomId.slice(0, 8)}…
              </span>
            )}
          </>
        }
        right={
          <>
            <ConnectionBadge connected={connected} />
            <TopbarOutlineBtn onClick={() => setOutputLines([])}>Clear</TopbarOutlineBtn>
            <RunButton status={status} onClick={handleRun} />
          </>
        }
      />

      {/* ── WORKSPACE ──────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden"
        style={{ padding: 8, zIndex: 1, position: 'relative' }}
      >
        {/* Editor — full on mobile, 60% on desktop */}
        <div className="flex-1 min-h-[220px] overflow-hidden">
          <CodeEditor code={code} language={language} onChange={handleCodeChange} />
        </div>

        {/* Right panel — fixed height on mobile, 40% on desktop */}
        <div
          className="flex flex-col gap-2 overflow-hidden"
          style={{ height: 280, flexShrink: 0 }}
        >
          <div className="lg:hidden flex flex-col gap-2 h-full">
            {/* Terminal (mobile) */}
            <div className="flex-1 overflow-hidden">
              <Terminal lines={outputLines} status={status} />
            </div>
            {roomId && (
              <div style={{ height: 140, flexShrink: 0 }}>
                <MemberList members={members} roomId={roomId} />
              </div>
            )}
          </div>
        </div>

        {/* Right panel — desktop only (side by side) */}
        <div className="hidden lg:flex flex-col gap-2 overflow-hidden" style={{ width: '40%' }}>
          <div className="flex-1 overflow-hidden">
            <Terminal lines={outputLines} status={status} />
          </div>
          {roomId && (
            <div style={{ height: 192, flexShrink: 0 }}>
              <MemberList members={members} roomId={roomId} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
      `}</style>
    </div>
  )
}