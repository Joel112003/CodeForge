import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Info } from 'lucide-react'

const ACCENT      = '#C04A1A'
const ACCENT_RING = 'rgba(192,74,26,0.15)'
const ERROR       = '#B91C1C'
const ERROR_RING  = 'rgba(185,28,28,0.1)'

export default function Input({
  label,
  error,
  hint,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)

  const isError = !!error

  return (
    <div className="flex flex-col gap-1">

      {label && (
        <label
          htmlFor={id}
          style={{
            fontFamily: "'Spectral', serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isError ? ERROR : focused ? ACCENT : '#8C7E6A',
            transition: 'color 0.18s',
          }}
        >
          {label}
        </label>
      )}

      {/* Wrapper with left accent bar */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: focused ? '#FDFAF4' : '#FAF7F0',
          border: `1px solid ${isError ? ERROR : focused ? ACCENT : '#D4C9B0'}`,
          borderLeft: `3px solid ${isError ? ERROR : focused ? ACCENT : '#D4C9B0'}`,
          height: '48px',
          transition: 'all 0.18s ease',
          boxShadow: isError
            ? `0 0 0 3px ${ERROR_RING}`
            : focused
            ? `0 0 0 3px ${ACCENT_RING}`
            : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {leftIcon && (
          <span
            style={{
              paddingLeft: '14px',
              flexShrink: 0,
              color: isError ? ERROR : focused ? ACCENT : '#B0A090',
              transition: 'color 0.18s',
              display: 'flex',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
          onChange={e => props.onChange?.(e)}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            outline: 'none',
            fontFamily: "'DM Mono', monospace",
            fontSize: '13px',
            letterSpacing: '0.02em',
            color: '#1A1208',
            caretColor: ACCENT,
            paddingLeft: leftIcon ? '10px' : '14px',
            paddingRight: rightIcon ? '4px' : '14px',
          }}
          className={['placeholder:text-stone-300', className].join(' ')}
        />

        {rightIcon && (
          <span style={{ paddingRight: '12px', flexShrink: 0, color: '#B0A090', display: 'flex' }}>
            {rightIcon}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -3, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: ERROR, marginTop: '2px' }}
          >
            <AlertCircle size={11} style={{ flexShrink: 0 }} />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#A0917E', marginTop: '2px' }}
          >
            <Info size={11} style={{ flexShrink: 0 }} />
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}