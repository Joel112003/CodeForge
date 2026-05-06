import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getHistory, createRoom } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { SkeletonHistoryRows, SkeletonStatCards } from '../components/ui/Spinner'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

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
      navigate(`/editor/${res.data.roomId}`)
    } catch {
      // error handling
    } finally {
      setCreating(false)
    }
  }

  const stats = [
    { label: 'Total Runs', value: history.length },
    { label: 'Completed', value: history.filter((h) => h.status === 'COMPLETED').length },
    { label: 'Errors', value: history.filter((h) => h.status === 'ERROR').length },
  ]

  return (
    <div className="min-h-screen bg-base-950 flex flex-col">
      <Navbar />

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-6 lg:px-8 py-12">

        {/* ── HEADER CARD ── */}
        <motion.div
          {...fadeUp}
          className="border border-warm-700/30 bg-warm-900/10 mb-8 lg:mb-12"
        >
          <div className="h-px bg-warm-700/20" />
          <div className="px-6 lg:px-8 py-8 flex items-start lg:items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-xs text-warm-600 tracking-wide">CODEFORGE</span>
                <span className="text-warm-700/40">/</span>
                <span className="font-mono text-xs text-warm-600 tracking-wide">DASHBOARD</span>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-warm-100 mb-3">
                Command Center
              </h1>
              {user?.email && (
                <p className="font-mono text-sm text-warm-600">
                  Signed in as <span className="text-warm-500">{user.email}</span>
                </p>
              )}
            </div>

            <Button
              onClick={handleNewSession}
              loading={creating}
              variant="primary"
              size="lg"
            >
              {creating ? 'Creating…' : '+ New Session'}
            </Button>
          </div>
        </motion.div>

        {/* ── STATS GRID ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="stats-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SkeletonStatCards />
            </motion.div>
          ) : history.length > 0 ? (
            <motion.div
              key="stats"
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-3 gap-4 mb-8 lg:mb-12"
            >
              {stats.map((s) => (
                <motion.div key={s.label} variants={fadeUp}>
                  <StatCard {...s} />
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── HISTORY PANEL ── */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="border border-warm-700/30 bg-warm-900/10"
        >
          {/* Header */}
          <div className="border-b border-warm-700/20 px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-accent-700"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <span className="font-mono text-sm text-warm-600 tracking-wide">
                EXECUTION HISTORY
              </span>
            </div>
            <AnimatePresence>
              {!loading && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-xs text-warm-600"
                >
                  {history.length} run{history.length !== 1 ? 's' : ''}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SkeletonHistoryRows count={6} />
              </motion.div>
            ) : history.length === 0 ? (
              <EmptyState key="empty" onNew={handleNewSession} />
            ) : (
              <motion.div
                key="list"
                variants={stagger}
                initial="initial"
                animate="animate"
                className="divide-y divide-warm-700/20"
              >
                {history.map((item, idx) => (
                  <motion.div key={item.id} variants={fadeUp}>
                    <HistoryRow
                      item={item}
                      index={idx}
                      onClick={() => navigate(`/editor?execution=${item.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  )
}

// ─── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ item, index, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      className="group relative px-6 lg:px-8 py-4 flex items-center justify-between gap-4 cursor-pointer border-b border-warm-700/10 last:border-b-0"
      whileHover={{ backgroundColor: 'rgba(140, 132, 120, 0.03)' }}
      transition={{ duration: 0.15 }}
    >
      {/* Left accent bar on hover */}
      <motion.span
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent-700"
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      />

      {/* Index */}
      <span className="font-mono text-xs text-warm-700 w-6 shrink-0 tracking-wider">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Language badge */}
      <span className={[
        'font-mono text-xs px-2 py-1 shrink-0 border rounded-sm font-semibold',
        item.language === 'javascript'
          ? 'bg-warm-800/30 text-warm-400 border-warm-700/40'
          : 'bg-warm-700/30 text-warm-500 border-warm-700/40',
      ].join(' ')}>
        {item.language}
      </span>

      {/* Code preview */}
      <span className="font-mono text-xs text-warm-600 group-hover:text-warm-500 transition-colors duration-200 truncate flex-1 min-w-0">
        {item.code?.split('\n')[0] || '— no source —'}
      </span>

      {/* Right meta */}
      <div className="flex items-center gap-4 shrink-0">
        {item.duration_ms && (
          <span className="font-mono text-xs text-warm-700 hidden sm:block tabular-nums">
            {item.duration_ms}ms
          </span>
        )}
        <Badge status={item.status} />
      </div>
    </motion.div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }) {
  return (
    <div className="border border-warm-700/30 bg-warm-900/10 px-6 py-5">
      <motion.div
        className="font-display font-semibold text-3xl text-accent-700 mb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {value}
      </motion.div>
      <div className="font-mono text-xs text-warm-600 uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 gap-8"
    >
      {/* Terminal icon */}
      <div className="relative w-12 h-12 border border-warm-700/40 flex items-center justify-center">
        <span className="font-mono text-lg text-warm-600">{'>'}</span>
        <motion.span
          className="absolute bottom-1.5 right-1.5 w-1.5 h-2 bg-warm-600/40"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>

      <div className="text-center">
        <p className="font-mono text-sm tracking-wide text-warm-600 mb-2 uppercase">
          No Executions Yet
        </p>
        <p className="font-body text-warm-500 max-w-xs">
          Create a new session to start running code in isolated containers.
        </p>
      </div>

      <Button variant="ghost" size="md" onClick={onNew}>
        Create First Session
      </Button>
    </motion.div>
  )
}