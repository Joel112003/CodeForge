import { motion, AnimatePresence } from 'framer-motion'

const SIZES = {
  sm:  'text-[12px] tracking-[0.06em] px-4 h-8',
  md:  'text-[13px] tracking-[0.06em] px-5 h-9',
  lg:  'text-[13px] tracking-[0.08em] px-6 h-11',
  xl:  'text-[14px] tracking-[0.08em] px-8 h-13',
}

const VARIANTS = {
  primary: {
    base: 'relative font-semibold uppercase rounded-none overflow-hidden text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C04A1A]/50 focus-visible:ring-offset-2',
    style: {
      background: 'linear-gradient(135deg, #E8501E 0%, #C04A1A 60%, #A53D12 100%)',
      boxShadow: '4px 4px 0px #8C3310',
      border: '1px solid #C04A1A',
    },
    hoverShift: { x: 2, y: 2, shadow: '2px 2px 0px #8C3310' },
    activeShift: { x: 4, y: 4, shadow: '0px 0px 0px #8C3310' },
  },
  secondary: {
    base: 'font-semibold uppercase rounded-none text-[#1A1208] bg-[#FAF7F0] border border-[#D4C9B0] hover:bg-[#F5F0E4] hover:border-[#C4B89A] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4B89A] focus-visible:ring-offset-2',
    style: { boxShadow: '3px 3px 0px #D4C9B0' },
  },
  ghost: {
    base: 'font-semibold uppercase rounded-none text-[#7A6E5A] hover:text-[#1A1208] hover:bg-[#F5F0E8] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2',
    style: {},
  },
  danger: {
    base: 'font-semibold uppercase rounded-none text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2',
    style: {},
  },
  outline: {
    base: 'font-semibold uppercase rounded-none text-[#C04A1A] border-2 border-[#C04A1A] hover:bg-[#FEF2E8] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C04A1A]/30 focus-visible:ring-offset-2',
    style: {},
  },
}

export default function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = 'primary',
  className = '',
  size = 'md',
  type = 'button',
  icon,
  iconRight,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary
  const isPrimary = variant === 'primary'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={!(disabled || loading) && isPrimary
        ? { x: 4, y: 4, boxShadow: v.activeShift?.shadow || v.style?.boxShadow }
        : !(disabled || loading) ? { scale: 0.97 } : {}
      }
      whileHover={!(disabled || loading) && isPrimary
        ? { x: 2, y: 2, boxShadow: v.hoverShift?.shadow || v.style?.boxShadow }
        : {}
      }
      transition={{ duration: 0.1 }}
      className={[
        'inline-flex items-center justify-center gap-2.5 select-none',
        v.base,
        SIZES[size] || SIZES.md,
        className,
      ].join(' ')}
      style={v.style}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-current"
                animate={{ scaleY: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.13 }}
              />
            ))}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5"
          >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Shine sweep on primary */}
      {isPrimary && !disabled && !loading && (
        <motion.span
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.button>
  )
}