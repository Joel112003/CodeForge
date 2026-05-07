// src/components/terminal/Terminal.jsx
import { useEffect, useRef } from 'react'

const T = {
  rule:        '#E0D8CA',
  faint:       '#A0917E',
  borderTop:   '#3A3530',   // dark neutral — no orange
  headerLine:  '#4A4540',
  runningText: '#8A8078',
  cursor:      '#9A9088',
}

export default function Terminal({ lines, status }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div
      style={{
        height: '100%',
        background: '#F0EBE3',
        border: `1px solid ${T.rule}`,
        borderTop: `2px solid ${T.borderTop}`,
        padding: '14px 16px',
        overflowY: 'auto',
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* terminal header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: `1px solid ${T.rule}`,
      }}>
        <span style={{ display: 'block', width: 12, height: 1, background: T.headerLine }} />
        <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A7A68' }}>
          Output
        </span>
        {status === 'RUNNING' && (
          <span style={{
            marginLeft: 'auto', fontSize: 9, letterSpacing: '0.06em',
            color: T.runningText,
            animation: 'cf-fade 1.4s ease-in-out infinite',
          }}>
            running…
          </span>
        )}
      </div>

      {/* empty state */}
      {lines.length === 0 && (
        <span style={{ color: '#B0A090', fontStyle: 'italic', fontSize: 11 }}>
          Run your code to see output…
        </span>
      )}

      {/* output lines */}
      {lines.map((line, i) => {
        const isString = typeof line === 'string'
        const text = isString ? line : line?.data || line?.output || line?.message || ''
        const type = isString ? 'stdout' : line?.type
        return (
          <span
            key={i}
            style={{
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              color: type === 'stderr' ? '#B94040' : '#2A1F14',
            }}
          >
            {text}
          </span>
        )
      })}

      {/* running cursor */}
      {status === 'RUNNING' && (
        <span style={{
          color: T.cursor,
          marginTop: 4,
          animation: 'cf-blink 1.1s step-end infinite',
          fontSize: 14,
        }}>
          ▋
        </span>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes cf-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cf-fade   { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  )
}