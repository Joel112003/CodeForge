// src/components/room/JoinRoomModal.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRoomById } from '../../services/api'
import { showToast } from '../../utils/toastMessages'

const T = {
  panel:   '#FAF7F0',
  deep:    '#F5F0E8',
  ink:     '#1A1208',
  muted:   '#7A6E5A',
  faint:   '#A0917E',
  rule:    '#E0D8CA',
  accent:  '#C04A1A',
  accent2: '#8C3310',
}

/* ── close icon ────────────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ── link icon ─────────────────────────────────────────────────────────────── */
function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   JoinRoomModal
   Props:
     open    — boolean to show/hide
     onClose — callback to close the modal
   ══════════════════════════════════════════════════════════════════════════════ */
export default function JoinRoomModal({ open, onClose }) {
  const [input,     setInput]     = useState('')
  const [error,     setError]     = useState('')
  const [checking,  setChecking]  = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      setInput('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /** Extract an 8-char room ID from either a raw code or a full URL */
  function parseRoomId(raw) {
    const trimmed = raw.trim()
    // If it looks like a URL, grab the last path segment
    try {
      const url = new URL(trimmed)
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[parts.length - 1] || ''
    } catch {
      // Not a URL — return as-is
      return trimmed
    }
  }

  async function handleJoin() {
    const roomId = parseRoomId(input)
    if (!roomId) {
      setError('Enter a room code or paste a session link.')
      return
    }
    if (roomId.length < 6) {
      setError('Room codes are at least 6 characters. Check your link.')
      return
    }

    setChecking(true)
    setError('')
    try {
      await getRoomById(roomId)   // 404 → throws, 200 → room exists
      showToast('Joining session…', 'info')
      onClose()
      navigate(`/editor/${roomId}`)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        setError('Room not found. It may have expired (rooms last 24 h).')
      } else {
        setError('Could not connect. Please try again.')
      }
    } finally {
      setChecking(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleJoin()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(26,18,8,0.55)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* ── Panel ── */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.94, y: 8  }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 201,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 460,
                background: T.panel,
                border: `1px solid ${T.rule}`,
                borderTop: `3px solid ${T.accent}`,
                boxShadow: `6px 6px 0 ${T.accent2}22, 0 24px 48px rgba(26,18,8,0.18)`,
                pointerEvents: 'auto',
                fontFamily: "'DM Mono', monospace",
                margin: '0 16px',
              }}
            >
              {/* ── header ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 22px',
                borderBottom: `1px solid ${T.rule}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, background: T.deep,
                    border: `1px solid ${T.rule}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.accent,
                  }}>
                    <LinkIcon />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>
                      Collaboration
                    </div>
                    <div style={{ fontSize: 14, color: T.ink, fontWeight: 600, lineHeight: 1.2 }}>
                      Join a Session
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.faint, padding: 6, display: 'flex',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.ink }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.faint }}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* ── body ── */}
              <div style={{ padding: '24px 22px' }}>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, marginBottom: 20 }}>
                  Paste a <strong style={{ color: T.ink }}>session link</strong> or enter a <strong style={{ color: T.ink }}>room code</strong> to join a collaborative coding session.
                </p>

                {/* Input */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{
                    display: 'block', fontSize: 9, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: T.faint, marginBottom: 8,
                  }}>
                    Room Code or Link
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: `1px solid ${error ? '#FCA5A5' : checking ? T.accent : T.rule}`,
                    borderLeft: `3px solid ${error ? '#DC2626' : T.accent}`,
                    background: '#FDFAF4',
                    transition: 'border-color 0.15s',
                  }}>
                    <span style={{ padding: '0 12px', color: T.faint, display: 'flex', flexShrink: 0 }}>
                      <LinkIcon />
                    </span>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setError('') }}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. a3f9b12c or https://…/editor/a3f9b12c"
                      style={{
                        flex: 1, height: 48, background: 'transparent',
                        border: 'none', outline: 'none',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12, color: T.ink,
                        letterSpacing: '0.04em',
                      }}
                    />
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', marginBottom: 4,
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderLeft: '3px solid #DC2626',
                        fontSize: 11, color: '#B91C1C',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5" opacity="0.4"/>
                        <path d="M8 5v4M8 11v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p style={{ fontSize: 10, color: T.faint, marginBottom: 24, lineHeight: 1.6 }}>
                  Rooms expire after 24 hours. The host must share their link.
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1, height: 44,
                      background: T.deep, border: `1px solid ${T.rule}`,
                      color: T.muted, fontFamily: "'DM Mono', monospace",
                      fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: 'pointer', boxShadow: `2px 2px 0 ${T.rule}`,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.rule}` }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.rule}` }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleJoin}
                    disabled={checking || !input.trim()}
                    style={{
                      flex: 2, height: 44,
                      background: (checking || !input.trim())
                        ? T.deep
                        : `linear-gradient(135deg, #E8501E, ${T.accent} 60%, #A53D12)`,
                      border: `1px solid ${(checking || !input.trim()) ? T.rule : T.accent}`,
                      color: (checking || !input.trim()) ? T.faint : '#fff',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: (checking || !input.trim()) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: (checking || !input.trim()) ? 'none' : `2px 2px 0 ${T.accent2}`,
                      position: 'relative', overflow: 'hidden',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!checking && input.trim()) { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.accent2}` } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = (checking || !input.trim()) ? 'none' : `2px 2px 0 ${T.accent2}` }}
                  >
                    {checking ? (
                      <>
                        {[0,1,2].map(i => (
                          <motion.span
                            key={i}
                            style={{ width: 4, height: 4, borderRadius: '50%', background: T.faint, display: 'block' }}
                            animate={{ scaleY: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.13 }}
                          />
                        ))}
                        Checking
                      </>
                    ) : (
                      <>
                        Join Session →
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── footer tip ── */}
              <div style={{
                padding: '12px 22px',
                borderTop: `1px solid ${T.rule}`,
                background: T.deep,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke={T.faint} strokeWidth="1.5"/>
                  <path d="M8 7v5M8 5v.5" stroke={T.faint} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 10, color: T.faint, lineHeight: 1.5 }}>
                  Anyone with the link can join. Code runs are shared in real time.
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
