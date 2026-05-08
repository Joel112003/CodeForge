import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createRoom } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import { showToast, showErrorToast } from '../utils/toastMessages'
import NoiseBackground from '../components/ui/NoiseBackground'
import JoinRoomModal from '../components/room/JoinRoomModal'

const T = {
  parchment: '#F8F4ED',
  panel:     '#FAF7F0',
  ink:       '#1A1208',
  ink2:      '#4A3E30',
  muted:     '#7A6E5A',
  faint:     '#A0917E',
  rule:      '#E0D8CA',
  accent:    '#C04A1A',
  accent2:   '#8C3310',
}

const fadeUp = {
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
}
const stagger = { animate: { transition: { staggerChildren: 0.07 } } }

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const QUICK_ACTIONS = [
  {
    id: 'new-session',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 9h8M9 5v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'New Session',
    desc: 'Open a fresh collaborative editor room',
    action: 'new',
  },
  {
    id: 'join-session',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11 3h4v4M15 3l-6 6M7 5H3v10h10v-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Join Session',
    desc: 'Enter a room code to join a live session',
    action: 'join',
  },
  {
    id: 'playground',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 5l4 4-4 4M9 13h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Open Playground',
    desc: 'Run code as a guest — no account needed',
    action: 'playground',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create a Session', desc: 'Click "New Session" to spin up an isolated execution room with a unique URL.' },
  { step: '02', title: 'Write & Run', desc: 'Write JavaScript or Python in the Monaco editor and hit Run — output streams live.' },
  { step: '03', title: 'Collaborate', desc: 'Share the room link. Every keystroke is broadcast in real time to all members.' },
]

export default function Dashboard() {
  const [creating,   setCreating]   = useState(false)
  const [joinOpen,   setJoinOpen]   = useState(false)
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  async function handleNewSession() {
    setCreating(true)
    try {
      const res = await createRoom()
      showToast('Session created', 'success')
      navigate(`/editor/${res.data.roomId}`)
    } catch (err) {
      showErrorToast(err?.response?.data?.message || 'Failed to create session. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function handleAction(action) {
    if (action === 'new')        handleNewSession()
    else if (action === 'join')  setJoinOpen(true)
    else if (action === 'playground') navigate('/playground')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.parchment, fontFamily: "'DM Mono', monospace" }}>
      <NoiseBackground />
      <Navbar />

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-6 lg:px-8 py-10">

        {/* HEADER */}
        <motion.div {...fadeUp} className="mb-8" style={{ background: T.panel, border: `1px solid ${T.rule}` }}>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.accent}66, transparent)` }} />
          <div className="px-6 lg:px-8 py-7 flex items-start lg:items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>CodeForge</span>
                <span style={{ color: T.rule }}>/</span>
                <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>Dashboard</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div style={{
                  width: 30, height: 30, background: T.accent,
                  boxShadow: `2px 2px 0 ${T.accent2}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'Spectral', serif", fontWeight: 700, color: '#FAF7F0', fontSize: '0.9rem', fontStyle: 'italic' }}>C</span>
                </div>
                <h1 style={{ fontFamily: "'Spectral', serif", fontSize: '2rem', fontWeight: 300, lineHeight: 1.05, color: T.ink, margin: 0 }}>
                  Command <em style={{ fontStyle: 'italic', fontWeight: 700, color: T.accent }}>Center</em>
                </h1>
              </div>
              {user?.email && (
                <p style={{ fontSize: 10, color: T.faint, letterSpacing: '0.02em' }}>
                  <span style={{ color: T.rule }}>◆ </span>{user.email}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setJoinOpen(true)}
                style={{
                  height: 42, padding: '0 20px', background: T.panel,
                  border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.accent}`,
                  color: T.ink, fontFamily: "'DM Mono', monospace",
                  fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: `3px 3px 0 ${T.rule}`, transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.rule}` }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `3px 3px 0 ${T.rule}` }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Join Session
              </button>
              <button
                onClick={handleNewSession}
                disabled={creating}
                style={{
                  height: 42, padding: '0 24px',
                  background: creating ? T.faint : `linear-gradient(135deg, #E8501E, ${T.accent} 60%, #A53D12)`,
                  border: `1px solid ${T.accent}`, color: '#fff',
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: `3px 3px 0 ${T.accent2}`,
                  position: 'relative', overflow: 'hidden', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { if (!creating) { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.accent2}` } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `3px 3px 0 ${T.accent2}` }}
              >
                <ShineLayer />
                {!creating && <PlusIcon />}
                {creating ? 'Creating…' : 'New Session'}
                <span>→</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="mb-8">
          <SectionHeader label="Quick Actions" />
          <motion.div
            variants={stagger} initial="initial" animate="animate"
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            {QUICK_ACTIONS.map((qa) => (
              <motion.div key={qa.id} variants={fadeUp}>
                <QuickActionCard {...qa} disabled={qa.action === 'new' && creating} onAction={handleAction} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* HOW IT WORKS */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} style={{ border: `1px solid ${T.rule}`, background: T.panel }}>
          <div className="px-6 lg:px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.rule}` }}>
            <div className="flex items-center gap-3">
              <span style={{ display: 'block', width: 16, height: 1, background: T.accent }} />
              <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>How It Works</span>
            </div>
          </div>
          <motion.div
            variants={stagger} initial="initial" animate="animate"
            className="grid grid-cols-1 md:grid-cols-3"
          >
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step} variants={fadeUp}
                style={{
                  padding: '28px 32px',
                  borderRight: i < 2 ? `1px solid ${T.rule}` : 'none',
                  borderBottom: 'none',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.accent, letterSpacing: '0.06em' }}>{item.step}</span>
                  <span style={{ flex: 1, height: 1, background: T.rule }} />
                </div>
                <h3 style={{ fontFamily: "'Spectral', serif", fontSize: '1.15rem', fontWeight: 600, color: T.ink, margin: '0 0 10px' }}>{item.title}</h3>
                <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.85, margin: 0 }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

      </main>

      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes cf-shine { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  )
}

function ShineLayer() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
      backgroundSize: '200% 100%',
      animation: 'cf-shine 3.5s linear infinite',
    }} />
  )
}

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ display: 'block', width: 16, height: 1, background: T.accent }} />
      <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>{label}</span>
    </div>
  )
}

function QuickActionCard({ id, icon, label, desc, action, disabled, onAction }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => !disabled && onAction(action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        width: '100%', textAlign: 'left',
        padding: '20px 24px',
        background: hovered ? '#F5F0E8' : T.panel,
        border: `1px solid ${hovered ? T.accent : T.rule}`,
        borderTop: `3px solid ${hovered ? T.accent : T.rule}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: disabled ? 0.5 : 1,
        boxShadow: hovered ? `3px 3px 0 ${T.rule}` : 'none',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <span style={{ color: hovered ? T.accent : T.muted, transition: 'color 0.15s' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.ink, marginBottom: 6, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10, color: T.faint, lineHeight: 1.7 }}>{desc}</div>
      </div>
      <span style={{ fontSize: 10, color: T.accent, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>→ Open</span>
    </button>
  )
}