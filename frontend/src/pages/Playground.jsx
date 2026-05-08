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
            {/* Badge & guest pill — hidden on mobile to prevent cramming */}
            <span className="hidden sm:block"><Badge status={status} /></span>
            <span className="hidden md:inline" style={{
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#92400E', border: '1px solid #F5D87A', background: '#FFFBEB',
              padding: '3px 8px', whiteSpace: 'nowrap',
            }}>
              guest
            </span>
          </>
        }
        right={
          <>
            <ConnectionBadge connected={connected} />
            {/* "Sign in to save" — text hidden on mobile, show short label */}
            <TopbarOutlineBtn hideOnMobile onClick={() => navigate('/login')}>
              Save
            </TopbarOutlineBtn>
            <TopbarOutlineBtn onClick={() => { setOutputLines([]); setStatus('IDLE') }}>
              Clear
            </TopbarOutlineBtn>
            <RunButton status={status} onClick={handleRun} />
          </>
        }
      />

      {/* ── GUEST BANNER ───────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0, zIndex: 2,
          padding: '6px 16px',
          background: T.panelDeep,
          borderBottom: `1px solid ${T.rule}`,
          borderLeft: `3px solid ${T.accent}`,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6,
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
      {/*
        Mobile: column layout — editor takes flex-1 (fills available space),
                terminal takes a fixed 220px slice at the bottom.
        Desktop (lg): row layout — editor 62%, terminal 38%.
      */}
      <div
        className="flex-1 flex flex-col lg:flex-row overflow-hidden"
        style={{ padding: 8, gap: 8, zIndex: 1, position: 'relative' }}
      >
        {/* ── Editor pane ── */}
        <div
          className="lg:flex-1"
          style={{
            flex: '1 1 0',          /* grow and shrink freely on mobile */
            minHeight: 0,           /* critical: lets flex children shrink below content size */
            overflow: 'hidden',
            border: `1px solid ${T.rule}`,
          }}
        >
          <CodeEditor
            code={code}
            language={language}
            onChange={(val) => setCode(val)}
          />
        </div>

        {/* ── Terminal pane ── */}
        <div
          className="terminal-pane"
          style={{
            /* Mobile: fixed 200px height; Desktop: 38% width */
            height: 200,
            flexShrink: 0,
            overflow: 'hidden',
            border: `1px solid ${T.rule}`,
          }}
        >
          {/* Desktop override via inline style — lg breakpoint sets width, clears height */}
          <style>{`
            @media (min-width: 1024px) {
              .terminal-pane { width: 38% !important; height: 100% !important; flex-shrink: 0; }
            }
          `}</style>
          <div style={{ height: '100%' }}>
            <Terminal lines={outputLines} status={status} />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
      `}</style>
    </div>
  )
}