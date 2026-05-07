import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getHistory, createRoom } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'
import { showToast, showErrorToast } from '../utils/toastMessages'
import { SkeletonHistoryRows, SkeletonStatCards } from '../components/ui/Skeleton'
import NoiseBackground from '../components/ui/NoiseBackground'
import JoinRoomModal from '../components/room/JoinRoomModal'

/* ─── design tokens (mirrors HTML preview) ─────────────────────────────────── */
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

/* ─── motion presets ────────────────────────────────────────────────────────── */
const fadeUp = {
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
}
const stagger = { animate: { transition: { staggerChildren: 0.07 } } }

/* ─── Plus icon ─────────────────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

/* ═══════════════════════════════════════════════════════════════════════════════
   Dashboard
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [creating,   setCreating]   = useState(false)
  const [joinOpen,   setJoinOpen]   = useState(false)
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  useEffect(() => {
    getHistory()
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleNewSession() {
    setCreating(true)
    try {
      const res = await createRoom()
      showToast('Session created successfully', 'success')
      navigate(`/editor/${res.data.roomId}`)
    } catch (err) {
      showErrorToast(err?.response?.data?.message || 'Failed to create session. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const stats = [
    { label: 'Total Runs', value: history.length,                                           accent: false },
    { label: 'Completed',  value: history.filter((h) => h.status === 'COMPLETED').length,  accent: true  },
    { label: 'Errors',     value: history.filter((h) => h.status === 'ERROR').length,      accent: false },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.parchment, fontFamily: "'DM Mono', monospace" }}>
      <NoiseBackground />

      <Navbar />

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-6 lg:px-8 py-10">

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <motion.div
          {...fadeUp}
          className="mb-8"
          style={{ background: T.panel, border: `1px solid ${T.rule}` }}
        >
          {/* top accent line */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.accent}66, transparent)` }} />

          <div className="px-6 lg:px-8 py-7 flex items-start lg:items-center justify-between gap-6 flex-wrap">
            <div>
              {/* breadcrumb */}
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>
                  CodeForge
                </span>
                <span style={{ color: T.rule }}>/</span>
                <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>
                  Dashboard
                </span>
              </div>

              {/* logo row */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  style={{
                    width: 30, height: 30,
                    background: T.accent,
                    boxShadow: `2px 2px 0 ${T.accent2}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <span style={{ fontFamily: "'Spectral', serif", fontWeight: 700, color: '#FAF7F0', fontSize: '0.9rem', fontStyle: 'italic' }}>C</span>
                </div>
                <h1
                  style={{
                    fontFamily: "'Spectral', serif",
                    fontSize: '2rem',
                    fontWeight: 300,
                    lineHeight: 1.05,
                    color: T.ink,
                    margin: 0,
                  }}
                >
                  Command <em style={{ fontStyle: 'italic', fontWeight: 700, color: T.accent }}>Center</em>
                </h1>
              </div>

              {user?.email && (
                <p style={{ fontSize: 10, color: T.faint, letterSpacing: '0.02em' }}>
                  <span style={{ color: T.rule }}>◆ </span>{user.email}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Join Session */}
              <button
                onClick={() => setJoinOpen(true)}
                style={{
                  height: 42, padding: '0 20px',
                  background: T.panel,
                  border: `1px solid ${T.rule}`,
                  borderLeft: `3px solid ${T.accent}`,
                  color: T.ink,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: `3px 3px 0 ${T.rule}`,
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.rule}` }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `3px 3px 0 ${T.rule}` }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Join Session
              </button>

              {/* New Session */}
              <button
                onClick={handleNewSession}
                disabled={creating}
                style={{
                  height: 42,
                  padding: '0 24px',
                  background: creating
                    ? T.faint
                    : `linear-gradient(135deg, #E8501E, ${T.accent} 60%, #A53D12)`,
                  border: `1px solid ${T.accent}`,
                  color: '#fff',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: `3px 3px 0 ${T.accent2}`,
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.1s',
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

        {/* ── STATS ──────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="s-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SkeletonStatCards loading />
            </motion.div>
          ) : history.length > 0 ? (
            <motion.div
              key="stats"
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-3 gap-3 mb-8"
            >
              {stats.map((s) => (
                <motion.div key={s.label} variants={fadeUp}>
                  <StatCard {...s} />
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── HISTORY PANEL ──────────────────────────────────────────────────── */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          style={{ border: `1px solid ${T.rule}`, background: T.panel }}
        >
          {/* panel header */}
          <div
            className="px-6 lg:px-8 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${T.rule}` }}
          >
            <div className="flex items-center gap-3">
              {/* eyebrow line decoration */}
              <span style={{ display: 'block', width: 16, height: 1, background: T.accent }} />
              <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>
                Execution History
              </span>
            </div>
            <AnimatePresence>
              {!loading && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: 9, color: T.faint }}
                >
                  {history.length} run{history.length !== 1 ? 's' : ''}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* panel content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SkeletonHistoryRows count={6} loading />
              </motion.div>
            ) : history.length === 0 ? (
              <EmptyState key="empty" onNew={handleNewSession} />
            ) : (
              <motion.div
                key="list"
                variants={stagger}
                initial="initial"
                animate="animate"
                style={{ borderTop: 'none' }}
              >
                {history.map((item, idx) => (
                  <motion.div key={item.id} variants={fadeUp} style={{ borderBottom: `1px solid ${T.rule}` }}>
                    <HistoryRow item={item} index={idx} onClick={() => navigate(`/editor?execution=${item.id}`)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Join Room Modal — rendered at page level to overlay everything */}
      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}

/* ─── ShineLayer (matches .shine in HTML) ───────────────────────────────────── */
function ShineLayer() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
        backgroundSize: '200% 100%',
        animation: 'cf-shine 3.5s linear infinite',
      }}
    />
  )
}

/* ─── History Row ───────────────────────────────────────────────────────────── */
function HistoryRow({ item, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer',
        background: hovered ? `rgba(192,74,26,0.025)` : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* left accent bar */}
      <motion.span
        style={{
          position: 'absolute', left: 0, top: 8, bottom: 8, width: 3,
          background: `linear-gradient(180deg, ${T.accent}, #F09A5A)`,
          transformOrigin: 'center',
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.18 }}
      />

      {/* index */}
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, width: 20, flexShrink: 0, tabularNums: true }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* language tag */}
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        padding: '3px 8px', flexShrink: 0,
        border: `1px solid ${T.rule}`,
        background: '#F5F0E8',
        color: T.accent,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {item.language}
      </span>

      {/* code preview */}
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 12,
        color: hovered ? T.muted : T.faint,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        flex: 1, minWidth: 0,
        transition: 'color 0.2s',
      }}>
        {item.code?.split('\n')[0] || '— empty —'}
      </span>

      {/* meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {item.duration_ms && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint }}>
            {item.duration_ms}ms
          </span>
        )}
        <Badge status={item.status} />
      </div>
    </div>
  )
}

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        background: T.panel,
        padding: '20px 20px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* top rule */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent ? T.accent : T.rule }} />
      <motion.div
        style={{
          fontFamily: "'Spectral', serif",
          fontWeight: 700, fontSize: '2rem',
          marginBottom: 6,
          color: accent ? T.accent : T.ink,
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {value}
      </motion.div>
      <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.faint }}>
        {label}
      </div>
    </div>
  )
}

/* ─── Empty State ───────────────────────────────────────────────────────────── */
function EmptyState({ onNew }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 32 }}
    >
      {/* terminal icon */}
      <div style={{
        width: 56, height: 56,
        border: `1px solid ${T.rule}`,
        background: T.panel,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{ fontFamily: "'Spectral', serif", fontSize: '1.2rem', color: T.faint, fontStyle: 'italic' }}>{'>'}</span>
        <motion.span
          style={{ position: 'absolute', bottom: 8, right: 10, width: 6, height: 10, background: T.rule }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        {/* eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ display: 'block', width: 16, height: 1, background: T.accent }} />
          <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent }}>
            No Executions Yet
          </span>
        </div>
        <p style={{ fontFamily: "'Spectral', serif", fontSize: '0.85rem', color: T.muted, fontStyle: 'italic', maxWidth: 240 }}>
          Create a session to run code in isolated containers.
        </p>
      </div>

      <button
        onClick={onNew}
        style={{
          height: 38, padding: '0 20px',
          background: T.panel,
          border: `1px solid ${T.rule}`,
          borderLeft: `3px solid ${T.accent}`,
          color: T.ink,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: `2px 2px 0 ${T.rule}`,
          transition: 'all 0.1s',
        }}
      >
        <PlusIcon /> First Session
      </button>
    </motion.div>
  )
}

/* ─── inject shine keyframe ─────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('cf-shine-style')) {
  const s = document.createElement('style')
  s.id = 'cf-shine-style'
  s.textContent = `@keyframes cf-shine { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`
  document.head.appendChild(s)
}