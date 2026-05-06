import { motion } from 'framer-motion'

const PULSE_MAP = {
  RUNNING: true,
  QUEUED: true,
}

const DOT_COLOR = {
  IDLE:      'bg-warm-600',
  QUEUED:    'bg-warm-400',
  RUNNING:   'bg-accent-700',
  COMPLETED: 'bg-warm-500',
  TIMEOUT:   'bg-warm-500',
  ERROR:     'bg-warm-700',
}

const STATUS_CONFIG = {
  IDLE:      { bg: 'bg-warm-900/30', border: 'border-warm-700/40', text: 'text-warm-400' },
  QUEUED:    { bg: 'bg-warm-800/20', border: 'border-warm-500/30', text: 'text-warm-300' },
  RUNNING:   { bg: 'bg-accent-800/20', border: 'border-accent-700/30', text: 'text-accent-600' },
  COMPLETED: { bg: 'bg-warm-700/15', border: 'border-warm-500/25', text: 'text-warm-400' },
  TIMEOUT:   { bg: 'bg-warm-800/15', border: 'border-warm-600/25', text: 'text-warm-400' },
  ERROR:     { bg: 'bg-warm-900/20', border: 'border-warm-700/40', text: 'text-warm-600' },
}

export default function Badge({ status = 'IDLE' }) {
  const key = status?.toUpperCase() || 'IDLE'
  const isPulsing = PULSE_MAP[key]
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.IDLE

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={[
        'inline-flex items-center gap-2',
        'font-mono text-xs font-semibold',
        'px-3 py-1.5',
        'border rounded-sm',
        cfg.bg, cfg.border, cfg.text,
      ].join(' ')}
    >
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        {isPulsing && (
          <motion.span
            className={['absolute inset-0 rounded-full', DOT_COLOR[key] || DOT_COLOR.IDLE].join(' ')}
            animate={{ scale: [1, 2, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <span className={['relative inline-flex rounded-full h-1.5 w-1.5', DOT_COLOR[key] || DOT_COLOR.IDLE].join(' ')} />
      </span>
      {status}
    </motion.span>
  )
}