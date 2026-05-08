import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  muted:     '#7A6E5A',
  faint:     '#A0917E',
  rule:      '#E0D8CA',
  accent:    '#C04A1A',
  accent2:   '#8C3310',
}

export default function Dashboard() {
  const [creating, setCreating] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.parchment, fontFamily: "'DM Mono', monospace" }}>
      <NoiseBackground />
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 640 }}
        >
          <div style={{ background: T.panel, border: `1px solid ${T.rule}` }}>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.accent}55, transparent)` }} />

            <div style={{ padding: '32px 36px', borderBottom: `1px solid ${T.rule}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, background: T.accent, boxShadow: `2px 2px 0 ${T.accent2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Spectral', serif", fontWeight: 700, fontStyle: 'italic', color: '#FAF7F0', fontSize: '0.85rem' }}>C</span>
                </div>
                <h1 style={{ fontFamily: "'Spectral', serif", fontSize: '1.8rem', fontWeight: 300, lineHeight: 1, color: T.ink, margin: 0 }}>
                  Command <em style={{ fontWeight: 700, fontStyle: 'italic', color: T.accent }}>Center</em>
                </h1>
              </div>
              {user?.email && (
                <p style={{ fontSize: 10, color: T.faint, margin: 0, letterSpacing: '0.02em' }}>
                  <span style={{ color: T.rule }}>◆ </span>{user.email}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <ActionCard
                label="New Session"
                desc="Spin up a fresh isolated room"
                icon={<PlusIcon />}
                accent
                disabled={creating}
                onClick={handleNewSession}
              />
              <ActionCard
                label="Join Session"
                desc="Enter a room code to join a live session"
                icon={<JoinIcon />}
                onClick={() => setJoinOpen(true)}
                divider
              />
            </div>
          </div>
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

function ActionCard({ label, desc, icon, accent, disabled, onClick, divider }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: 'clamp(20px, 4vw, 28px) clamp(18px, 4vw, 32px)',
        background: hovered
          ? accent ? `linear-gradient(135deg, #E8501E, ${T.accent} 60%, #A53D12)` : '#F5F0E8'
          : accent ? `linear-gradient(135deg, #D94718, ${T.accent} 60%, #8C3310)` : T.panel,
        border: 'none',
        borderLeft: divider ? `1px solid ${T.rule}` : 'none',
        borderTop: `3px solid ${hovered ? (accent ? '#E8501E' : T.accent) : (accent ? T.accent : T.rule)}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        textAlign: 'left',
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'cf-shine 3.5s linear infinite',
        }} />
      )}
      <span style={{ color: accent ? 'rgba(255,255,255,0.85)' : hovered ? T.accent : T.muted, transition: 'color 0.15s' }}>
        {icon}
      </span>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: accent ? '#fff' : T.ink, marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: accent ? 'rgba(255,255,255,0.65)' : T.faint, lineHeight: 1.7 }}>
          {desc}
        </div>
      </div>
      <span style={{ fontSize: 10, color: accent ? 'rgba(255,255,255,0.7)' : T.accent, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        → {label === 'New Session' ? 'Create' : 'Enter room'}
      </span>
    </button>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function JoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 2h4v4M14 2l-6 6M6 4H2v10h10v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const T2 = T