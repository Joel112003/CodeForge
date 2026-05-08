// src/pages/Playground.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket from '../hooks/useSocket'
import { DEFAULT_CODE } from '../config/constants'
import CodeEditor from '../components/editor/CodeEditor'
import LanguageSelector from '../components/editor/LanguageSelector'
import Terminal from '../components/terminal/Terminal'
import Badge from '../components/ui/Badge'
import NoiseBackground from '../components/ui/NoiseBackground'
import EditorTopbar, { RunButton, TopbarOutlineBtn, ConnectionBadge } from '../components/layout/EditorTopbar'

const T = {
  parchment: '#F8F4ED',
  panelDeep: '#F5F0E8',
  rule:      '#E0D8CA',
  accent:    '#C04A1A',
  faint:     '#A0917E',
}

export default function Playground() {
  const [language,    setLanguage]    = useState('javascript')
  const [code,        setCode]        = useState(DEFAULT_CODE.javascript)
  const [outputLines, setOutputLines] = useState([])
  const [status,      setStatus]      = useState('IDLE')
  const navigate = useNavigate()

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
    if (status === 'RUNNING' || status === 'QUEUED') return
    runCode(language, code, null)
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
            {/* guest badge */}
            <span style={{
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#92400E', border: '1px solid #F5D87A', background: '#FFFBEB',
              padding: '3px 8px',
            }}>
              guest mode
            </span>
          </>
        }
        right={
          <>
            <ConnectionBadge connected={connected} />
            <TopbarOutlineBtn onClick={() => navigate('/login')}>Sign in to save</TopbarOutlineBtn>
            <TopbarOutlineBtn onClick={() => { setOutputLines([]); setStatus('IDLE') }}>Clear</TopbarOutlineBtn>
            <RunButton status={status} onClick={handleRun} />
          </>
        }
      />

      {/* ── GUEST BANNER ───────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4"
        style={{
          minHeight: 36, flexShrink: 0, zIndex: 2,
          padding: '8px 16px',
          background: T.panelDeep,
          borderBottom: `1px solid ${T.rule}`,
          borderLeft: `3px solid ${T.accent}`,
        }}
      >
        <span style={{ fontSize: 10, color: T.faint, letterSpacing: '0.02em' }}>
          Guest mode — executions not saved, rooms unavailable
        </span>
        <button
          onClick={() => navigate('/register')}
          style={{
            fontSize: 10, fontFamily: "'DM Mono', monospace",
            color: T.accent, background: 'none', border: 'none',
            cursor: 'pointer', letterSpacing: '0.06em',
            textDecoration: 'underline', textUnderlineOffset: 2, padding: 0, whiteSpace: 'nowrap',
          }}
        >
          Create free account →
        </button>
      </div>

      {/* ── WORKSPACE ──────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden"
        style={{ padding: 8, zIndex: 1, position: 'relative' }}
      >
        {/* Editor pane — full on mobile, ~60% on desktop */}
        <div className="flex-1 min-h-[220px] overflow-hidden" style={{ border: `1px solid ${T.rule}` }}>
          <CodeEditor
            code={code}
            language={language}
            onChange={(val) => setCode(val)}
          />
        </div>

        {/* Terminal pane — fixed height on mobile, 38% on desktop */}
        <div
          className="overflow-hidden"
          style={{ border: `1px solid ${T.rule}`, height: 260, flexShrink: 0 }}
        >
          <div className="lg:hidden h-full">
            <Terminal lines={outputLines} status={status} />
          </div>
        </div>

        {/* Terminal pane — desktop only */}
        <div className="hidden lg:block overflow-hidden" style={{ width: '38%', border: `1px solid ${T.rule}` }}>
          <Terminal lines={outputLines} status={status} />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
      `}</style>
    </div>
  )
}