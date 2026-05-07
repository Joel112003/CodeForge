import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import { logoutUser } from '../../services/api'
import { showAuthSuccessToast } from '../../utils/toastMessages'
import Button from '../ui/Button'

export default function Navbar({ variant = 'app' }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    try {
      await logoutUser()
    } finally {
      logout()
      showAuthSuccessToast('logout')
      navigate('/login')
    }
  }

  if (variant === 'public') {
    const isLogin = location.pathname === '/login'
    const isRegister = location.pathname === '/register'
    const showTerminal = !isLogin && !isRegister

    return (
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#E0D8CA] bg-[#F8F4ED]/90 px-8 backdrop-blur-md lg:px-16"
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-8.5 w-8.5 items-center justify-center bg-[#C04A1A] shadow-[2px_2px_0_#8C3310]">
            <span className="font-['Spectral'] text-[1rem] font-bold italic text-[#FAF7F0]">C</span>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.13em] text-[#7A6E5A]">
            CodeForge
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!isLogin && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
          {showTerminal && (
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Access Terminal
            </Button>
          )}
          {!isRegister && (
            <Button size="sm" onClick={() => navigate('/register')}>
              Get Started
            </Button>
          )}
        </div>
      </motion.nav>
    )
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 flex h-14 items-center border-b border-white/6 bg-[rgba(12,14,20,0.85)] px-4 backdrop-blur-[20px]"
    >
      {/* Brand */}
      <Link to="/dashboard" className="mr-8 flex items-center gap-2.5 group">
        <motion.div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}
          whileHover={{ scale: 1.05, rotate: -3 }}
          transition={{ duration: 0.2 }}
        >
          C
        </motion.div>
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-white transition-colors group-hover:text-slate-200">
          CodeForge
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden flex-1 items-center gap-1 md:flex">
        <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
          Dashboard
        </NavLink>
        <NavLink to="/history" active={location.pathname === '/history'}>
          History
        </NavLink>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        {/* Status dot */}
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 sm:flex">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[11px] font-medium tracking-wide text-emerald-400">Live</span>
        </div>

        {user?.email && (
          <span className="hidden max-w-40 truncate text-[13px] text-slate-500 sm:block">
            {user.email}
          </span>
        )}

        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </motion.nav>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={[
        'relative px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all duration-200',
        active
          ? 'text-white bg-white/8'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
      ].join(' ')}
    >
      {children}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-lg bg-white/8 -z-10"
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