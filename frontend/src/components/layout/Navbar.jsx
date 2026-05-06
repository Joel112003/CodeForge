import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative border-b border-warm-700/30 bg-base-950 flex items-stretch h-14 z-50 shrink-0"
    >
      {/* brand left */}
      <div className="flex items-center px-8 border-r border-warm-700/20 shrink-0">
        <Link
          to="/dashboard"
          className="group flex items-center gap-3"
        >
          <motion.span
            className="w-6 h-6 bg-accent-700 flex items-center justify-center font-display font-bold text-xs text-base-cream shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            C
          </motion.span>
          <span className="font-display font-semibold text-lg tracking-tight text-warm-100 group-hover:text-warm-50 transition-colors duration-200">
            CodeForge
          </span>
        </Link>
      </div>

      {/* nav links center */}
      <div className="hidden md:flex items-center gap-8 px-8 flex-1">
        <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
          Dashboard
        </NavLink>
        <NavLink to="/history" active={location.pathname === '/history'}>
          History
        </NavLink>
      </div>

      {/* right section */}
      <div className="flex items-center gap-4 px-8 ml-auto border-l border-warm-700/20">
        {/* status */}
        <div className="hidden sm:flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-accent-600"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-mono text-xs text-warm-500">
            Online
          </span>
        </div>

        <div className="h-5 w-px bg-warm-700/20" />

        {user?.email && (
          <span className="font-mono text-xs text-warm-600 hidden sm:block truncate max-w-[180px]">
            {user.email}
          </span>
        )}

        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
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
        'relative px-0 py-2 font-mono text-sm font-semibold transition-colors duration-200',
        active ? 'text-accent-700' : 'text-warm-500 hover:text-warm-300',
      ].join(' ')}
    >
      {children}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="nav-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-700"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.3 }}
            style={{ originX: 0 }}
          />
        )}
      </AnimatePresence>
    </Link>
  )
}