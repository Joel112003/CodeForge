import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { loginUser } from '../services/api'
import useAuthStore from '../store/authStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit() {
    if (!form.email || !form.password) return setError('All fields required')
    setLoading(true)
    setError('')
    try {
      const res = await loginUser(form)
      setAuth(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-950 flex">

      {/* ── LEFT: Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-96 shrink-0 border-r border-warm-700/20 px-12 py-16 bg-warm-900/20"
      >
        <div className="relative space-y-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-accent-700 flex items-center justify-center font-display font-bold text-lg text-base-cream"
              whileHover={{ scale: 1.05 }}
            >
              C
            </motion.div>
            <span className="font-display font-semibold text-xl tracking-tight text-warm-100">
              CodeForge
            </span>
          </div>

          {/* Large Display Text */}
          <div>
            <h2 className="font-display text-5xl font-bold leading-none tracking-tight text-warm-200 mb-6">
              Welcome Back.
            </h2>
            <p className="font-body text-warm-400 leading-relaxed max-w-xs">
              Sign in to your account and get back to executing code with precision.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-3 border-t border-warm-700/30 pt-8">
          {[
            { label: 'Runtime', val: 'v2.4.0' },
            { label: 'Encryption', val: 'AES-256' },
            { label: 'Protocol', val: 'JWT/RS256' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="font-mono text-xs text-warm-600">{row.label}</span>
              <span className="font-mono text-xs text-warm-500">{row.val}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm space-y-8"
        >
          {/* Heading */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="font-display text-3xl font-semibold text-warm-100">Sign In</h1>
            <p className="font-body text-warm-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent-700 hover:text-accent-600 transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={containerVariants}
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                error={error && !form.email ? 'Email required' : ''}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                error={error && !form.password ? 'Password required' : ''}
              />
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 border border-warm-700/50 bg-warm-900/20 rounded-sm"
                >
                  <p className="font-mono text-sm text-warm-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </motion.div>
          </motion.form>

          {/* Help text */}
          <motion.p variants={itemVariants} className="text-center font-mono text-xs text-warm-600">
            By signing in, you agree to our Terms of Service
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
