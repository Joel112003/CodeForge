import { motion, AnimatePresence } from 'framer-motion'

export default function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = 'primary',
  className = '',
  size = 'md',
  type = 'button',
}) {
  const base = [
    'relative inline-flex items-center justify-center',
    'font-mono font-semibold tracking-wider',
    'transition-smooth',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-base-950',
  ].join(' ')

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  }

  const variants = {
    primary: {
      cls: [
        'bg-accent-700 text-base-cream',
        'border border-accent-800',
        'hover:bg-accent-800 hover:border-accent-800',
        'active:bg-accent-700',
        'focus-visible:ring-accent-700',
      ].join(' '),
    },
    success: {
      cls: [
        'bg-warm-500 text-base-cream',
        'border border-warm-600',
        'hover:bg-warm-600 hover:border-warm-700',
        'active:bg-warm-500',
        'focus-visible:ring-warm-500',
      ].join(' '),
    },
    ghost: {
      cls: [
        'border border-warm-400 text-warm-300 bg-transparent',
        'hover:border-warm-300 hover:text-warm-200 hover:bg-warm-700/10',
        'active:bg-warm-700/15',
        'focus-visible:ring-warm-400',
      ].join(' '),
    },
    danger: {
      cls: [
        'bg-warm-700 text-warm-50',
        'border border-warm-800',
        'hover:bg-warm-800 hover:border-warm-800',
        'active:bg-warm-700',
        'focus-visible:ring-warm-700',
      ].join(' '),
    },
    secondary: {
      cls: [
        'bg-warm-600 text-warm-50 border border-warm-700',
        'hover:bg-warm-700 hover:text-warm-50 hover:border-warm-800',
        'active:bg-warm-600',
        'focus-visible:ring-warm-600',
      ].join(' '),
    },
  }

  const v = variants[variant] || variants.primary

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ y: disabled || loading ? 0 : -2 }}
      whileTap={{ y: disabled || loading ? 0 : 0 }}
      transition={{ duration: 0.2 }}
      className={`${base} ${sizes[size]} ${v.cls} ${className}`}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-current"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </span>
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}