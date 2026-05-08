import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import { logoutUser } from '../../services/api'
import { showAuthSuccessToast } from '../../utils/toastMessages'
import Button from '../ui/Button'

/* ─── design tokens ─────────────────────────────────────────────────────────── */
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

/* ─── Logo square ───────────────────────────────────────────────────────────── */
function LogoSquare() {
  return (
    <div style={{
      width: 38, height: 38,
      background: T.accent,
      boxShadow: `2px 2px 0 ${T.accent2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Spectral', serif",
        fontWeight: 700, fontStyle: 'italic',
        color: '#FAF7F0', fontSize: '1.1rem',
      }}>C</span>
    </div>
  )
}

/* ─── Inline button helpers (public nav only) ───────────────────────────────── */
function GhostBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 38, padding: '0 18px',
        background: 'none', border: 'none',
        color: T.muted, fontFamily: "'DM Mono', monospace",
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer', transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = T.ink }}
      onMouseLeave={(e) => { e.currentTarget.style.color = T.muted }}
    >
      {children}
    </button>
  )
}

function OutlineBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 38, padding: '0 18px',
        background: T.panel, border: `1px solid ${T.rule}`,
        color: T.ink, fontFamily: "'DM Mono', monospace",
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: `2px 2px 0 ${T.rule}`, transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.rule}` }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.rule}` }}
    >
      {children}
    </button>
  )
}

function PrimaryBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 38, padding: '0 20px',
        background: `linear-gradient(135deg, #E8501E, ${T.accent} 60%, #A53D12)`,
        border: `1px solid ${T.accent}`,
        color: '#fff', fontFamily: "'DM Mono', monospace",
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: `2px 2px 0 ${T.accent2}`,
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.accent2}` }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.accent2}` }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
        backgroundSize: '200% 100%', animation: 'cf-shine 3.5s linear infinite',
      }} />
      {children}
    </button>
  )
}

/* ─── Hamburger Icon ─────────────────────────────────────────────────────────── */
function HamburgerIcon({ open }) {
  return (
    <div style={{ width: 20, height: 14, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <span style={{
        display: 'block', height: 1.5, background: T.ink,
        transformOrigin: 'left center',
        transform: open ? 'rotate(45deg) translate(2px, -1px)' : 'none',
        transition: 'transform 0.2s',
      }} />
      <span style={{
        display: 'block', height: 1.5, background: T.ink,
        opacity: open ? 0 : 1,
        transition: 'opacity 0.2s',
      }} />
      <span style={{
        display: 'block', height: 1.5, background: T.ink,
        transformOrigin: 'left center',
        transform: open ? 'rotate(-45deg) translate(2px, 1px)' : 'none',
        transition: 'transform 0.2s',
      }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Navbar
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Navbar({ variant = 'app' }) {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try { await logoutUser() } finally {
      logout()
      showAuthSuccessToast('logout')
      setLoggingOut(false)
      navigate('/login')
    }
  }

  /* ── PUBLIC navbar (login / register / landing) ── */
  if (variant === 'public') {
    const isLogin    = location.pathname === '/login'
    const isRegister = location.pathname === '/register'
    const showTerminal = !isLogin && !isRegister

    return (
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          borderBottom: `1px solid ${T.rule}`,
          background: 'rgba(248,244,237,0.94)',
          backdropFilter: 'blur(16px)',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {/* top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${T.accent}66, transparent)`,
        }} />

        {/* Main row */}
        <div style={{
          height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <LogoSquare />
            <span style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, fontWeight: 500 }}>
              CodeForge
            </span>
          </Link>

          {/* Desktop buttons */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
            {!isLogin    && <GhostBtn onClick={() => navigate('/login')}>Login</GhostBtn>}
            {showTerminal && <OutlineBtn onClick={() => navigate('/playground')}>Access Terminal</OutlineBtn>}
            {!isRegister  && <PrimaryBtn onClick={() => navigate('/register')}>Get Started →</PrimaryBtn>}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex sm:hidden"
            onClick={() => setMobileOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', borderTop: `1px solid ${T.rule}`, background: T.panel }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 8 }}>
                {!isLogin && (
                  <button onClick={() => { navigate('/login'); setMobileOpen(false) }}
                    style={{ textAlign: 'left', padding: '10px 14px', background: 'none', border: `1px solid ${T.rule}`, color: T.muted, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Login
                  </button>
                )}
                {showTerminal && (
                  <button onClick={() => { navigate('/playground'); setMobileOpen(false) }}
                    style={{ textAlign: 'left', padding: '10px 14px', background: T.deep, border: `1px solid ${T.rule}`, color: T.ink, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Access Terminal
                  </button>
                )}
                {!isRegister && (
                  <button onClick={() => { navigate('/register'); setMobileOpen(false) }}
                    style={{ textAlign: 'left', padding: '10px 14px', background: T.accent, border: 'none', color: '#fff', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Get Started →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    )
  }

  /* ── APP navbar (dashboard / history / editor) ── */
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${T.rule}`,
        background: 'rgba(250,247,240,0.94)',
        backdropFilter: 'blur(16px)',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.accent}66, transparent)`,
      }} />

      {/* Main row */}
      <div style={{
        height: 68,
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}>
        <Link
          to="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 12, flexShrink: 0 }}
        >
          <LogoSquare />
          <span className="hidden sm:inline" style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, fontWeight: 500 }}>
            CodeForge
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <AppNavLink to="/dashboard" active={location.pathname === '/dashboard'}>Dashboard</AppNavLink>
          <AppNavLink to="/history"   active={location.pathname === '/history'}>History</AppNavLink>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {/* live dot */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: '#EDFAF3', border: '1px solid #6EE7B7',
          }}>
            <motion.span
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'block' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="hidden sm:inline" style={{ fontSize: 11, letterSpacing: '0.06em', color: '#064E3B' }}>Live</span>
          </div>

          {/* email — hidden on mobile */}
          {user?.email && (
            <span className="hidden md:inline" style={{
              fontSize: 12, color: T.faint, maxWidth: 180,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.email}
            </span>
          )}

          {/* sign out */}
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            loading={loggingOut}
            disabled={loggingOut}
            icon={
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <span className="hidden sm:inline">{loggingOut ? 'Signing out' : 'Sign out'}</span>
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes cf-shine { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </motion.nav>
  )
}

/* ─── App nav link ──────────────────────────────────────────────────────────── */
function AppNavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      style={{
        position: 'relative',
        padding: '8px 10px',
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: active ? T.accent : T.faint,
        textDecoration: 'none',
        borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
        transition: 'all 0.15s',
        fontFamily: "'DM Mono', monospace",
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = T.ink }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = T.faint }}
    >
      {children}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="nav-underline"
            style={{
              position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
              background: T.accent,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </Link>
  )
}