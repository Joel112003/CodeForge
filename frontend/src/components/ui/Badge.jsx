import { motion } from 'framer-motion'

const STATUS_CONFIG = {
  IDLE: {
    bg: '#F5F2EB',
    border: '#E0D8CA',
    text: '#7A6E5A',
    dot: '#B0A38C',
    pulse: false,
    label: 'Idle',
  },
  QUEUED: {
    bg: '#FFFBEB',
    border: '#F5D87A',
    text: '#92400E',
    dot: '#D97706',
    pulse: true,
    label: 'Queued',
  },
  RUNNING: {
    bg: '#EBF5FF',
    border: '#93C5FD',
    text: '#1E3A5F',
    dot: '#2563EB',
    pulse: true,
    label: 'Running',
  },
  COMPLETED: {
    bg: '#EDFAF3',
    border: '#6EE7B7',
    text: '#064E3B',
    dot: '#10B981',
    pulse: false,
    label: 'Completed',
  },
  TIMEOUT: {
    bg: '#FFF7ED',
    border: '#FDBA74',
    text: '#7C2D12',
    dot: '#F97316',
    pulse: false,
    label: 'Timeout',
  },
  ERROR: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#7F1D1D',
    dot: '#DC2626',
    pulse: false,
    label: 'Error',
  },
}

export default function Badge({ status = 'IDLE' }) {
  const key = (status || 'IDLE').toUpperCase()
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.IDLE

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        fontFamily: "'DM Mono', monospace",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        borderRadius: 0,
      }}
    >
      <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px', flexShrink: 0 }}>
        {cfg.pulse && (
          <motion.span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: cfg.dot,
            }}
            animate={{ scale: [1, 2.8, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span
          style={{
            position: 'relative',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: cfg.dot,
          }}
        />
      </span>
      {cfg.label}
    </motion.span>
  )
}