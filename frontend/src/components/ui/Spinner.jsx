import { motion } from 'framer-motion'

// ─── Base shimmer skeleton ───────────────────────────────────────────────────
function SkeletonBase({ className = '', style }) {
  return (
    <motion.span
      className={['block relative overflow-hidden', className].join(' ')}
      style={style}
    >
      <motion.span
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(196,98,45,0.08) 40%, rgba(196,98,45,0.12) 50%, rgba(196,98,45,0.08) 60%, transparent 100%)',
          backgroundSize: '300% 100%',
        }}
        animate={{ backgroundPosition: ['300% 0', '-100% 0'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      />
    </motion.span>
  )
}

// ─── Dashboard skeleton rows ─────────────────────────────────────────────────
export function SkeletonHistoryRows({ count = 6 }) {
  return (
    <div className="divide-y divide-warm-800/20">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="px-8 py-4 flex items-center gap-4"
        >
          {/* index */}
          <SkeletonBase className="w-5 h-2 bg-warm-800/30" />
          {/* lang badge */}
          <SkeletonBase className="w-16 h-5 bg-warm-800/30" />
          {/* code line */}
          <SkeletonBase className="flex-1 h-2.5 bg-warm-800/30" style={{ maxWidth: `${55 + (i % 3) * 15}%` }} />
          {/* duration */}
          <SkeletonBase className="w-10 h-2 bg-warm-800/30 hidden sm:block" />
          {/* badge */}
          <SkeletonBase className="w-20 h-5 bg-warm-800/30" />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Stat cards skeleton ──────────────────────────────────────────────────────
export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className="border border-warm-700/40 bg-warm-900/10 px-6 py-5"
        >
          <SkeletonBase className="w-10 h-8 bg-warm-800/30 mb-3" />
          <SkeletonBase className="w-16 h-2 bg-warm-800/20" />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Inline button loader (replaces Spinner in button) ───────────────────────
export function ButtonLoader({ color = 'dark' }) {
  const dotCls = color === 'dark' ? 'bg-warm-100' : 'bg-accent-700'
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`w-1 h-1 rounded-full ${dotCls}`}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

// ─── Spinner (legacy API compat — replaced by ButtonLoader internally) ────────
// Kept for backward compat with any existing imports; renders as elegant skeleton bar
export default function Spinner({ size = 'sm' }) {
  const heights = { sm: 'h-1 w-12', md: 'h-1 w-20', lg: 'h-1 w-32' }
  return (
    <span className={`relative inline-flex overflow-hidden ${heights[size]}`}>
      <SkeletonBase className="absolute inset-0 bg-warm-800/40" />
    </span>
  )
}