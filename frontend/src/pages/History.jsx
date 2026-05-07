// src/pages/History.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getHistory, getExecutionById } from '../services/api'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'
import NoiseBackground from '../components/ui/NoiseBackground'
import { SkeletonHistoryRows } from '../components/ui/Skeleton'

/* ─── design tokens ─────────────────────────────────────────────────────────── */
const T = {
  parchment: '#F8F4ED',
  panel:     '#FAF7F0',
  panelDeep: '#F5F0E8',
  ink:       '#1A1208',
  ink2:      '#4A3E30',
  muted:     '#7A6E5A',
  faint:     '#A0917E',
  rule:      '#E0D8CA',
  accent:    '#C04A1A',
  accent2:   '#8C3310',
}


/* ═══════════════════════════════════════════════════════════════════════════════
   History
   ══════════════════════════════════════════════════════════════════════════════ */
export default function History() {
  const [history,       setHistory]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [detail,        setDetail]        = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getHistory()
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(item) {
    if (selected?.id === item.id) { setSelected(null); setDetail(null); return }
    setSelected(item)
    setDetailLoading(true)
    try {
      const res = await getExecutionById(item.id)
      setDetail(res.data)
    } catch {
      setDetail(item)
    } finally {
      setDetailLoading(false)
    }
  }

  function handleRerun(item) {
    navigate(`/editor?lang=${item.language}&code=${encodeURIComponent(item.code)}`)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: T.parchment, fontFamily: "'DM Mono', monospace" }}
    >
      <NoiseBackground />

      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-6 py-10" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── page header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ display: 'block', width: 16, height: 1, background: T.accent }} />
            <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent }}>
              CodeForge / History
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Spectral', serif", fontSize: '2.6rem',
              fontWeight: 300, lineHeight: 0.92, color: T.ink, margin: 0,
            }}
          >
            Execution <em style={{ fontStyle: 'italic', fontWeight: 700, color: T.accent }}>History</em>
          </h1>
        </motion.div>

        {/* ── list ───────────────────────────────────────────────────────────── */}
        {loading && <SkeletonHistoryRows count={6} loading />}

        {!loading && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: T.faint, fontSize: 13 }}>
            No executions found.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              isSelected={selected?.id === item.id}
              detail={detail}
              detailLoading={detailLoading}
              onSelect={() => handleSelect(item)}
              onRerun={() => handleRerun(item)}
            />
          ))}
        </div>
      </main>

      {/* inject keyframes */}
      <style>{`
        @keyframes cf-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </div>
  )
}

/* ─── History Item (row + expandable drawer) ────────────────────────────────── */
function HistoryItem({ item, isSelected, detail, detailLoading, onSelect, onRerun }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div>
      {/* row */}
      <div
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: isSelected ? T.panel : hovered ? '#F5F0E8' : T.panel,
          border: `1px solid ${isSelected ? T.accent : T.rule}`,
          borderLeft: `3px solid ${isSelected ? T.accent : hovered ? T.accent : T.rule}`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.15s',
          borderBottom: isSelected ? 'none' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* language badge */}
          <span style={{
            fontSize: 9, fontFamily: "'DM Mono', monospace",
            padding: '3px 8px',
            border: `1px solid ${T.rule}`,
            background: '#F5F0E8',
            color: T.accent,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {item.language}
          </span>

          {/* code preview */}
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 12,
            color: T.muted,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 360,
          }}>
            {item.code?.split('\n')[0]}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: T.faint }}>
            {new Date(item.created_at).toLocaleDateString()}
          </span>
          {item.duration_ms && (
            <span style={{ fontSize: 10, color: T.faint }}>{item.duration_ms}ms</span>
          )}
          <Badge status={item.status} />
          <button
            onClick={(e) => { e.stopPropagation(); onRerun() }}
            style={{
              fontSize: 10, fontFamily: "'DM Mono', monospace",
              color: T.accent, background: 'none', border: 'none',
              cursor: 'pointer', letterSpacing: '0.06em',
              textDecoration: 'underline', textUnderlineOffset: 2,
              padding: 0,
            }}
          >
            Re-run
          </button>
        </div>
      </div>

      {/* detail drawer */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              border: `1px solid ${T.accent}`,
              borderTop: 'none',
              background: T.panelDeep,
              padding: '16px 20px',
            }}>
              {detailLoading ? (
                <SkeletonHistoryRows count={2} loading />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Code */}
                  <div>
                    <div style={{
                      fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: T.faint, marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ display: 'block', width: 12, height: 1, background: T.accent }} />
                      Code
                    </div>
                    <pre style={{
                      background: '#1A1208',
                      padding: 12, borderRadius: 0,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, color: '#C4B896',
                      overflow: 'auto', maxHeight: 192,
                      margin: 0, lineHeight: 1.6,
                      border: `1px solid ${T.rule}`,
                    }}>
                      {detail?.code}
                    </pre>
                  </div>
                  {/* Output */}
                  <div>
                    <div style={{
                      fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: T.faint, marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ display: 'block', width: 12, height: 1, background: T.accent }} />
                      Output
                    </div>
                    <pre style={{
                      background: '#1A1208',
                      padding: 12, borderRadius: 0,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, color: '#A8C4A0',
                      overflow: 'auto', maxHeight: 192,
                      margin: 0, lineHeight: 1.6,
                      border: `1px solid ${T.rule}`,
                    }}>
                      {detail?.output || 'No output recorded'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}