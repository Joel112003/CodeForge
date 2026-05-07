import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useToastStore from '../../store/toastStore'

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M5 8.5L7 10.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M6 6L10 10M10 6L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M8 7V11M8 5.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13H1.5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3" />
      <path d="M8 6V9M8 11V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

const STYLES = {
  success: {
    bg: 'rgba(237,250,243,0.85)',
    border: '#6EE7B7',
    accent: '#10B981',
    text: '#064E3B',
    glow: 'rgba(16,185,129,0.15)',
  },
  error: {
    bg: 'rgba(254,242,242,0.85)',
    border: '#FCA5A5',
    accent: '#DC2626',
    text: '#7F1D1D',
    glow: 'rgba(220,38,38,0.12)',
  },
  info: {
    bg: 'rgba(235,245,255,0.85)',
    border: '#93C5FD',
    accent: '#2563EB',
    text: '#1E3A5F',
    glow: 'rgba(37,99,235,0.12)',
  },
  warning: {
    bg: 'rgba(255,251,235,0.85)',
    border: '#F5D87A',
    accent: '#D97706',
    text: '#92400E',
    glow: 'rgba(217,119,6,0.12)',
  },
}

const DURATION = 3500

function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const progressRef = useRef(null)
  const s = STYLES[toast.variant] || STYLES.info

  useEffect(() => {
    const start = Date.now()
    let raf
    function tick() {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      if (progressRef.current) progressRef.current.style.width = pct + '%'
      if (pct > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 24, scale: 0.92, filter: 'blur(4px)' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => removeToast(toast.id)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        width: 340,
        cursor: 'pointer',
        overflow: 'hidden',
        background: s.bg,
        backdropFilter: 'blur(16px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.accent}`,
        boxShadow: `0 8px 32px ${s.glow}, 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      {/* Icon */}
      <span style={{ color: s.accent, flexShrink: 0, marginTop: 1 }}>
        {ICONS[toast.variant] || ICONS.info}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: s.text,
          margin: '0 0 3px 0',
          lineHeight: 1.2,
        }}>
          {toast.title || toast.variant}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: '#4A3E30',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {toast.message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); removeToast(toast.id) }}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#A0917E',
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: -2,
          transition: 'color 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'scale(1.2)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#A0917E'; e.currentTarget.style.transform = 'none' }}
      >
        ×
      </button>

      {/* Progress bar */}
      <div
        ref={progressRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          width: '100%',
          background: `linear-gradient(90deg, ${s.accent}, ${s.border})`,
          transition: 'width 0.08s linear',
          borderRadius: '0 1px 0 0',
        }}
      />

      {/* Subtle glow accent at top-left */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${s.glow}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}