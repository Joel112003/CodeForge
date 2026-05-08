import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useToastStore from '../../store/toastStore'

/* ── Icons ──────────────────────────────────────────────────────────────────── */
const ICONS = {
  success: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 6.5V10M7 4.5V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 5V8M7 10V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
}

/* ── Design tokens — dark ink palette matching CodeForge ─────────────────────
   Toast lives over the editor so it must be dark + high-contrast.           */
const STYLES = {
  success: {
    bg:     '#1A2B1F',
    border: '#2D5A3D',
    accent: '#4ADE80',
    label:  '#86EFAC',
    text:   '#D1FAE5',
    bar:    '#22C55E',
    iconBg: 'rgba(74,222,128,0.12)',
  },
  error: {
    bg:     '#2B1A1A',
    border: '#5A2D2D',
    accent: '#F87171',
    label:  '#FCA5A5',
    text:   '#FEE2E2',
    bar:    '#EF4444',
    iconBg: 'rgba(248,113,113,0.12)',
  },
  info: {
    bg:     '#1A1F2B',
    border: '#2D3D5A',
    accent: '#60A5FA',
    label:  '#93C5FD',
    text:   '#DBEAFE',
    bar:    '#3B82F6',
    iconBg: 'rgba(96,165,250,0.12)',
  },
  warning: {
    bg:     '#2B251A',
    border: '#5A4A2D',
    accent: '#FBBF24',
    label:  '#FCD34D',
    text:   '#FEF3C7',
    bar:    '#F59E0B',
    iconBg: 'rgba(251,191,36,0.12)',
  },
}

const DURATION = 3500

/* ── Single toast ───────────────────────────────────────────────────────────── */
function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const progressRef = useRef(null)
  const s = STYLES[toast.variant] || STYLES.info
  const LABEL = (toast.title || toast.variant).toUpperCase()

  useEffect(() => {
    const start = Date.now()
    let raf
    function tick() {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${pct / 100})`
      if (pct > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '13px 14px 16px',
        width: 320,
        cursor: 'pointer',
        overflow: 'hidden',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.accent}`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)`,
        fontFamily: "'DM Mono', monospace",
      }}
      onClick={() => removeToast(toast.id)}
    >
      {/* Icon badge */}
      <div style={{
        flexShrink: 0,
        width: 26, height: 26,
        background: s.iconBg,
        border: `1px solid ${s.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
        color: s.accent,
      }}>
        {ICONS[toast.variant] || ICONS.info}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: s.accent,
            fontWeight: 600,
          }}>{LABEL}</span>
          {/* Tick mark line */}
          <span style={{ flex: 1, height: 1, background: s.border }} />
        </div>

        {/* Message */}
        <p style={{
          fontSize: 11,
          color: s.text,
          lineHeight: 1.6,
          margin: 0,
          letterSpacing: '0.01em',
        }}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeToast(toast.id) }}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 4px',
          cursor: 'pointer',
          color: s.label,
          fontSize: 14,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: -1,
          opacity: 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5' }}
      >
        ×
      </button>

      {/* Progress bar — shrinks left-to-right */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0,
        width: '100%',
        height: 2,
        background: s.border,
      }}>
        <div
          ref={progressRef}
          style={{
            width: '100%',
            height: '100%',
            background: s.bar,
            transformOrigin: 'left center',
            transform: 'scaleX(1)',
          }}
        />
      </div>
    </motion.div>
  )
}

/* ── Container ──────────────────────────────────────────────────────────────── */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
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