import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useToastStore from '../../store/toastStore'

const ICONS = {
  success: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 7L5 10L11 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M3 3L10 10M10 3L3 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 5.5V9.5M6.5 4V3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 4.5V7.5M6.5 9V8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
}

const STYLES = {
  success: { accent: '#2D7A4F', bar: '#3D9B63', label: 'Success' },
  error:   { accent: '#C04A1A', bar: '#D4551E', label: 'Error'   },
  info:    { accent: '#2A5F9E', bar: '#3570B8', label: 'Info'    },
  warning: { accent: '#9A6800', bar: '#B87C00', label: 'Warning' },
}

const DURATION = 3500

function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const progressRef = useRef(null)
  const s = STYLES[toast.variant] || STYLES.info
  const label = (toast.title || s.label).toUpperCase()

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
      initial={{ opacity: 0, x: 16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 16, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => removeToast(toast.id)}
      style={{
        position: 'relative',
        width: 300,
        background: '#FAF7F0',
        border: '1px solid #E0D8CA',
        borderLeft: `3px solid ${s.accent}`,
        boxShadow: '3px 3px 0 #E0D8CA',
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 14px 16px' }}>
        <span style={{
          flexShrink: 0,
          marginTop: 1,
          color: s.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22, height: 22,
          border: `1px solid ${s.accent}22`,
          background: `${s.accent}0D`,
        }}>
          {ICONS[toast.variant] || ICONS.info}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{
              fontSize: 8,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: s.accent,
              fontWeight: 600,
            }}>{label}</span>
            <span style={{ flex: 1, height: '1px', background: '#E0D8CA' }} />
          </div>
          <p style={{
            fontSize: 11,
            color: '#4A3E30',
            lineHeight: 1.65,
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            {toast.message}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); removeToast(toast.id) }}
          style={{
            background: 'none', border: 'none',
            padding: '0 2px', cursor: 'pointer',
            color: '#A0917E', fontSize: 15, lineHeight: 1,
            flexShrink: 0, marginTop: -1,
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1A1208' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#A0917E' }}
        >
          ×
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 2, background: '#EDE8DF' }}>
        <div
          ref={progressRef}
          style={{
            width: '100%', height: '100%',
            background: s.bar,
            transformOrigin: 'left center',
            transform: 'scaleX(1)',
          }}
        />
      </div>
    </motion.div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div style={{
      position: 'fixed',
      bottom: 24, right: 24,
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