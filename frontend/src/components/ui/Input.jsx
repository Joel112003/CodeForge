import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Input({ label, error, hint, className = '', ...props }) {
  const [focused, setFocused] = useState(false)
  const [filled, setFilled] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <motion.label
          animate={{ 
            y: focused || filled ? -20 : 0,
            scale: focused || filled ? 0.85 : 1,
            color: error ? '#C4622D' : focused ? '#D4A843' : '#8C8478',
          }}
          transition={{ duration: 0.2 }}
          className="font-display text-sm font-semibold origin-left cursor-text"
        >
          {label}
        </motion.label>
      )}

      <div className="relative">
        <input
          {...props}
          onFocus={(e) => { 
            setFocused(true)
            props.onFocus?.(e) 
          }}
          onBlur={(e) => { 
            setFocused(false)
            setFilled(!!e.target.value)
            props.onBlur?.(e) 
          }}
          onChange={(e) => {
            setFilled(!!e.target.value)
            props.onChange?.(e)
          }}
          className={[
            'w-full bg-transparent',
            'pb-2 px-0',
            'font-body text-body-md text-warm-100 placeholder-warm-500',
            'outline-none transition-smooth',
            'border-b border-warm-500',
            error
              ? 'border-b-accent-700 focus:border-b-accent-700'
              : 'focus:border-b-accent-700 focus:border-b-2',
            className,
          ].join(' ')}
        />

        {/* Bottom border animation */}
        <motion.span
          className="absolute bottom-0 left-0 h-0.5 bg-accent-700 pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ originX: 0 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-xs text-accent-700"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-xs text-warm-600"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}