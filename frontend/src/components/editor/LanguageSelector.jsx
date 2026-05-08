// src/components/editor/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react'
import { LANGUAGES } from '../../config/constants'

const T = {
  bg:       '#FAF7F0',
  border:   '#E0D8CA',
  accent:   '#C04A1A',
  ink:      '#1A1208',
  muted:    '#7A6E5A',
  faint:    '#A0917E',
  hover:    '#F5F0E8',
  menuBg:   '#FAF7F0',
  menuShadow: '0 8px 32px rgba(26,18,8,0.18), 0 2px 8px rgba(26,18,8,0.08)',
}

/* Small language icon — monochrome SVG per language */
function LangIcon({ lang }) {
  if (lang === 'javascript') return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="0.5" y="0.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1"/>
      <path d="M4 8.5C4.3 9.2 5 9.5 5.8 9.5C6.8 9.5 7.5 9 7.5 8.1C7.5 7.3 7 7 6.2 6.7L5.8 6.55C5.1 6.3 4.8 6.1 4.8 5.6C4.8 5.1 5.2 4.8 5.7 4.8C6.2 4.8 6.5 5 6.7 5.4L7.4 5C7.1 4.3 6.5 3.9 5.7 3.9C4.7 3.9 3.9 4.5 3.9 5.6C3.9 6.4 4.4 6.8 5.1 7.1L5.6 7.3C6.3 7.55 6.6 7.8 6.6 8.2C6.6 8.7 6.2 9 5.6 9C4.9 9 4.5 8.6 4.3 8.2L3.5 8.7L4 8.5Z" fill="currentColor"/>
    </svg>
  )
  if (lang === 'python') return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1C4.1 1 3 1.8 3 3V4.5H6.5V5H2.5C1.7 5 1 5.7 1 6.5V8.5C1 9.9 2 11 3.5 11H4V9.5C4 8.7 4.7 8 5.5 8H6.5C7.3 8 8 7.3 8 6.5V3C8 1.9 7.1 1 6 1ZM5 3.5C4.7 3.5 4.5 3.3 4.5 3C4.5 2.7 4.7 2.5 5 2.5C5.3 2.5 5.5 2.7 5.5 3C5.5 3.3 5.3 3.5 5 3.5Z" fill="currentColor"/>
      <path d="M9.5 5H8V6.5C8 7.9 7 9 5.5 9H5V10.5C5 11.3 5.7 12 6.5 12H8.5C9.9 12 11 11 11 9.5V7.5C11 6.1 10.3 5 9.5 5ZM7 9.5C6.7 9.5 6.5 9.3 6.5 9C6.5 8.7 6.7 8.5 7 8.5C7.3 8.5 7.5 8.7 7.5 9C7.5 9.3 7.3 9.5 7 9.5Z" fill="currentColor"/>
    </svg>
  )
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2L1 6L4 10M8 2L11 6L8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function LanguageSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = LANGUAGES.find((l) => l.value === value) || LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 10px',
          background: T.bg,
          border: `1px solid ${open ? T.accent : T.border}`,
          borderLeft: `3px solid ${T.accent}`,
          color: T.ink,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? `0 0 0 3px rgba(192,74,26,0.10)` : 'none',
          minWidth: 130,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.borderColor = '#C4B8A4'
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.borderColor = T.border
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Icon */}
        <span style={{ color: T.accent, display: 'flex', alignItems: 'center' }}>
          <LangIcon lang={selected.value} />
        </span>

        {/* Label */}
        <span style={{ flex: 1, textAlign: 'left' }}>{selected.label}</span>

        {/* Chevron */}
        <svg
          width="8" height="5" viewBox="0 0 8 5" fill="none"
          style={{
            color: T.faint,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}
        >
          <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            background: T.menuBg,
            border: `1px solid ${T.border}`,
            borderTop: `2px solid ${T.accent}`,
            boxShadow: T.menuShadow,
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'cf-dropdown-in 0.15s ease',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.value === value
            return (
              <button
                key={lang.value}
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(lang.value); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  background: isActive ? '#F5F0E8' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                  color: isActive ? T.accent : T.ink,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#F5F0E8'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ color: isActive ? T.accent : T.muted, display: 'flex' }}>
                  <LangIcon lang={lang.value} />
                </span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {isActive && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Keyframe injected once */}
      <style>{`
        @keyframes cf-dropdown-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}