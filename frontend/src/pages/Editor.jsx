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
import Button from '../components/ui/Button'

export default function Editor() {
  const { roomId }                      = useParams()
  const { user }                        = useAuthStore()
  const [language, setLanguage]         = useState('javascript')
  const [code, setCode]                 = useState(DEFAULT_CODE.javascript)
  const [outputLines, setOutputLines]   = useState([])
  const [status, setStatus]             = useState('IDLE')
  const [members, setMembers]           = useState([])
  const [connected, setConnected]       = useState(false)
  const isRemoteUpdate                  = useRef(false)

  function normalizeOutput(payload) {
    if (typeof payload === 'string') return { type: 'stdout', data: payload }
    if (payload?.data) return payload
    if (payload?.output) return { type: payload.type || 'stdout', data: payload.output }
    if (payload?.message) return { type: payload.type || 'stdout', data: payload.message }
    return { type: 'stdout', data: String(payload ?? '') }
  }

  // Socket setup — all events handled here, nothing duplicated
  const { runCode, joinRoom, sendCodeChange } = useSocket({
    onOutput: (data) => {
      const normalized = normalizeOutput(data)
      if (normalized.data) setOutputLines((prev) => [...prev, normalized])
    },

    onStatus: (s) => setStatus(s),

    onRoomJoined: ({ room, members }) => {
      setMembers(members)
      setCode(room.code || DEFAULT_CODE[room.language] || DEFAULT_CODE.javascript)
      setLanguage(room.language || 'javascript')
      setConnected(true)
    },

    onMemberJoined: ({ members }) => setMembers(members),

    onMemberLeft: ({ members }) => setMembers(members),

    onCodeUpdated: ({ code, language }) => {
      isRemoteUpdate.current = true
      setCode(code)
      setLanguage(language)
      setTimeout(() => { isRemoteUpdate.current = false }, 0)
    },
  })

  // Join room on mount
  useEffect(() => {
    if (!roomId || !user) return
    setTimeout(() => {
      joinRoom(roomId, user.email || user.id)
    }, 500) // small delay to ensure socket is connected
  }, [roomId, user, joinRoom])

  function handleCodeChange(val) {
    setCode(val)
    if (!isRemoteUpdate.current && roomId) {
      sendCodeChange(roomId, val, language)
    }
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
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-sm">
            Code<span className="text-blue-500">Engine</span>
          </span>
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <Badge status={status} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-500 text-xs">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => setOutputLines([])}
          >
            Clear
          </Button>

          <Button
            variant="success"
            onClick={handleRun}
            disabled={status === 'RUNNING'}
            className="flex items-center gap-2"
          >
            {status === 'RUNNING' ? '⟳ Running...' : '▶ Run'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Editor — 60% */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
          />
        </div>

        {/* Right panel — 40% */}
        <div className="w-[40%] flex flex-col gap-3 overflow-hidden">
          {/* Terminal — takes most space */}
          <div className="flex-1 overflow-hidden">
            <Terminal lines={outputLines} status={status} />
          </div>

          {/* Members panel — fixed height */}
          {roomId && (
            <div className="h-48 shrink-0">
              <MemberList members={members} roomId={roomId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}