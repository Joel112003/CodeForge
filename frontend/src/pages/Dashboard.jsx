import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getHistory, createRoom } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { SkeletonHistoryRows, SkeletonStatCards } from '../components/ui/Skeleton'

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
}

// Plus icon
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

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
    { label: 'Total Runs',  value: history.length,                                             accent: false },
    { label: 'Completed',   value: history.filter((h) => h.status === 'COMPLETED').length,     accent: true  },
    { label: 'Errors',      value: history.filter((h) => h.status === 'ERROR').length,         accent: false },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0B09' }}>
      <Navbar />

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-6 lg:px-8 py-10">

        {/* Subtle grid texture */}
        <div
          className="fixed inset-0 pointer-events-none -z-10 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(#E07B39 1px, transparent 1px),
              linear-gradient(90deg, #E07B39 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* ── HEADER ── */}
        <motion.div {...fadeUp} className="border border-[#2A2620] bg-[#0F0D0B] mb-8">
          {/* Top accent line */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(224,123,57,0.4), transparent)' }} />
          
          <div className="px-6 lg:px-8 py-7 flex items-start lg:items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#4A4540]">CodeForge</span>
                <span className="text-[#2A2620]">/</span>
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#4A4540]">Dashboard</span>
              </div>
              <h1 className="font-mono text-2xl lg:text-3xl font-bold tracking-tight text-[#E8DDD0] mb-2">
                Command Center
              </h1>
              {user?.email && (
                <p className="font-mono text-xs text-[#5A5550]">
                  <span className="text-[#3A3530]">◆ </span>
                  {user.email}
                </p>
              )}
            </div>

            <Button
              onClick={handleNewSession}
              loading={creating}
              variant="primary"
              size="lg"
              icon={!creating && <PlusIcon />}
            >
              {creating ? 'Creating…' : 'New Session'}
            </Button>
          </div>
        </motion.div>

        {/* ── STATS ── */}
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

        {/* ── HISTORY PANEL ── */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="border border-[#2A2620] bg-[#0F0D0B]"
        >
          {/* Panel header */}
          <div className="border-b border-[#1E1C18] px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#E07B39]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#5A5550]">
                Execution History
              </span>
            </div>
            <AnimatePresence>
              {!loading && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-[10px] text-[#3A3530]"
                >
                  {history.length} run{history.length !== 1 ? 's' : ''}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Panel content */}
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
                className="divide-y divide-[#1A1816]"
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
      className="group relative px-6 lg:px-8 py-3.5 flex items-center gap-4 cursor-pointer"
      whileHover={{ backgroundColor: 'rgba(224,123,57,0.025)' }}
      transition={{ duration: 0.12 }}
    >
      {/* Left accent */}
      <motion.span
        className="absolute left-0 top-2 bottom-2 w-0.5"
        style={{ background: 'linear-gradient(180deg, #E07B39, #F09A5A)' }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      />

      {/* Index */}
      <span className="font-mono text-[10px] text-[#3A3530] w-5 shrink-0 tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Language */}
      <span className="font-mono text-[10px] px-2 py-1 shrink-0 border border-[#2A2620] text-[#6A6460] tracking-wide uppercase">
        {item.language}
      </span>

      {/* Code preview */}
      <span className="font-mono text-xs text-[#4A4540] group-hover:text-[#6A6460] transition-colors duration-200 truncate flex-1 min-w-0">
        {item.code?.split('\n')[0] || '— empty —'}
      </span>

      {/* Meta */}
      <div className="flex items-center gap-4 shrink-0">
        {item.duration_ms && (
          <span className="font-mono text-[10px] text-[#3A3530] hidden sm:block tabular-nums">
            {item.duration_ms}ms
          </span>
        )}
        <Badge status={item.status} />
      </div>
    </motion.div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className="border border-[#2A2620] bg-[#0F0D0B] px-5 py-5 relative overflow-hidden group">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(225deg, rgba(224,123,57,0.08), transparent)' }}
      />
      <motion.div
        className="font-mono font-black text-3xl mb-2 tabular-nums"
        style={{ color: accent ? '#E07B39' : '#C4B896' }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {value}
      </motion.div>
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#4A4540]">
        {label}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 gap-8"
    >
      <div className="relative w-14 h-14 border border-[#2A2620] flex items-center justify-center"
        style={{ background: '#0F0D0B' }}
      >
        <span className="font-mono text-xl text-[#3A3530]">{'>'}</span>
        <motion.span
          className="absolute bottom-2 right-2.5 w-1.5 h-2.5"
          style={{ background: '#2A2620' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      </div>

      <div className="text-center">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#4A4540] mb-2">
          No Executions Yet
        </p>
        <p className="font-mono text-xs text-[#3A3530] max-w-xs">
          Create a session to run code in isolated containers.
        </p>
      </div>

      <Button variant="outline" size="md" onClick={onNew} icon={<PlusIcon />}>
        First Session
      </Button>
    </motion.div>
  )
}