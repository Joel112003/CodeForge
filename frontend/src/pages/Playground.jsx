// src/pages/Playground.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket from '../hooks/useSocket'
import { DEFAULT_CODE } from '../config/constants'
import CodeEditor from '../components/editor/CodeEditor'
import LanguageSelector from '../components/editor/LanguageSelector'
import Terminal from '../components/terminal/Terminal'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'

export default function Playground() {
  const [language, setLanguage]       = useState('javascript')
  const [code, setCode]               = useState(DEFAULT_CODE.javascript)
  const [outputLines, setOutputLines] = useState([])
  const [status, setStatus]           = useState('IDLE')
  const navigate                      = useNavigate()

  const { runCode, connected } = useSocket({
    onOutput: (data) => setOutputLines((prev) => [...prev, data]),
    onStatus: (s) => {
      setStatus(s)
      if (s === 'RUNNING') setOutputLines([])
    },
  })

  function handleLanguageChange(lang) {
    setLanguage(lang)
    setCode(DEFAULT_CODE[lang])
  }

  function handleRun() {
    if (status === 'RUNNING') return
    runCode(language, code, null)  // null roomId — no room
  }

  return (
    <div className="h-screen bg-[#050505] flex flex-col overflow-hidden">

      {/* Topbar */}
      <div className="h-11 flex items-center justify-between px-4 border-b border-[#111] bg-[#080808] shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-1">
            <div className="w-5 h-5 rounded bg-[#2563eb] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L5 7L2 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10H10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-[12px] text-white">
              Code<span className="text-[#2563eb]">Engine</span>
            </span>
          </div>

          <div className="w-px h-4 bg-[#1a1a1a]" />

          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <StatusBadge status={status} />

          {/* Guest badge */}
          <span className="text-[10px] font-mono text-yellow-600 border border-yellow-600/20 bg-yellow-500/5 px-2 py-0.5 rounded-md">
            guest mode
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Connection */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0b0b0b] border border-[#1a1a1a]">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400 status-pulse'}`} />
            <span className={`text-[10px] font-mono ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? 'connected' : 'connecting'}
            </span>
          </div>

          {/* Login CTA */}
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Sign in to save
          </Button>

          <Button variant="subtle" size="sm" onClick={() => { setOutputLines([]); setStatus('IDLE') }}>
            Clear
          </Button>

          <Button
            variant={status === 'RUNNING' ? 'subtle' : 'success'}
            size="sm"
            onClick={handleRun}
            disabled={status === 'RUNNING'}
            className="min-w-[80px]"
          >
            {status === 'RUNNING' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 status-pulse" />
                Running
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                  <path d="M0 0L8 5L0 10V0Z"/>
                </svg>
                Run
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Login banner */}
      <div className="bg-[#0b0b0b] border-b border-[#111] px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-mono text-gray-600">
          Running in guest mode — executions are not saved and rooms are unavailable
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/register')}
            className="text-[11px] font-mono text-blue-500 hover:text-blue-400 transition-colors"
          >
            Create free account →
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex gap-2 p-2 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            code={code}
            language={language}
            onChange={(val) => setCode(val)}
          />
        </div>
        <div className="w-[38%] overflow-hidden">
          <Terminal lines={outputLines} status={status} />
        </div>
      </div>
    </div>
  )
}