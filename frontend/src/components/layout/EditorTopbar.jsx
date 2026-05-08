import {useNavigate } from "react-router-dom"


const T = {
  panel: '#FAF7F0',
  panelDeep: '#F5F0E8',
  ink: '#1A1208',
  muted: '#7A6E5A',
  faint: '#A0917E',
  rule: '#E0D8CA',
  accent: '#C04A1A',
  accent2: '#8C3310',
}

/* ── Logo mark ──────────────────────────────────────────────────────────────── */
function Logo() {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/dashboard')}
      style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 4, cursor: 'pointer' }}
    >
      <div style={{
        width: 36, height: 36,
        background: T.accent,
        boxShadow: `2px 2px 0 ${T.accent2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: "'Spectral', serif", fontWeight: 700, color: '#FAF7F0', fontSize: '1rem', fontStyle: 'italic' }}>C</span>
      </div>
      <span style={{ fontSize: 14, letterSpacing: '0.04em', color: T.ink, fontWeight: 500 }}>
        Code<span style={{ color: T.accent }}>Forge</span>
      </span>
    </div>
  )
}

/* ── Connection indicator dot ───────────────────────────────────────────────── */
export function ConnectionBadge({ connected }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '6px 14px',
      background: T.panelDeep,
      border: `1px solid ${T.rule}`,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: connected ? '#059669' : '#DC2626',
        ...(connected ? {} : { animation: 'cf-pulse 1.4s ease-in-out infinite' }),
      }} />
      <span style={{ fontSize: 11, color: connected ? '#065F46' : '#991B1B', letterSpacing: '0.06em' }}>
        {connected ? 'connected' : 'connecting'}
      </span>
    </div>
  )
}

/* ── Shine overlay for run button ───────────────────────────────────────────── */
function Shine() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
      backgroundSize: '200% 100%',
      animation: 'cf-shine 3.5s linear infinite',
    }} />
  )
}

/* ── Run button ─────────────────────────────────────────────────────────────── */
export function RunButton({ status, onClick }) {
  const running = status === 'RUNNING' || status === 'QUEUED'
  return (
    <button
      onClick={onClick}
      disabled={running}
      style={{
        height: 44, padding: '0 26px', minWidth: 100,
        background: running
          ? T.panelDeep
          : `linear-gradient(135deg, #E8501E, ${T.accent} 60%, #A53D12)`,
        border: `1px solid ${running ? T.rule : T.accent}`,
        color: running ? T.faint : '#fff',
        fontFamily: "'DM Mono', monospace",
        fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: running ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        boxShadow: running ? 'none' : `2px 2px 0 ${T.accent2}`,
        position: 'relative', overflow: 'hidden', transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => { if (!running) { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.accent2}` } }}
      onMouseLeave={(e) => { if (!running) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.accent2}` } }}
    >
      {!running && <Shine />}
      {running ? (
        <>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, animation: 'cf-pulse 1.2s ease-in-out infinite' }} />
          {status === 'QUEUED' ? 'Queued' : 'Running'}
        </>
      ) : (
        <>
          <svg width="9" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M0 0L8 5L0 10V0Z" /></svg>
          Run
        </>
      )}
    </button>
  )
}

/* ── Clear / outline button ─────────────────────────────────────────────────── */
export function TopbarOutlineBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 44, padding: '0 18px',
        background: T.panel, border: `1px solid ${T.rule}`,
        color: T.ink, fontFamily: "'DM Mono', monospace",
        fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer', boxShadow: `2px 2px 0 ${T.rule}`, transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.rule}` }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.rule}` }}
    >
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EditorTopbar — shared between Editor and Playground
   ══════════════════════════════════════════════════════════════════════════════ */
export default function EditorTopbar({ left, right }) {
  return (
    <div
      style={{
        height: 64, zIndex: 50, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: T.panel,
        borderBottom: `1px solid ${T.rule}`,
        padding: '0 20px',
        fontFamily: "'DM Mono', monospace",
        flexShrink: 0,
        overflow: 'visible',
      }}
    >
      {/* top accent gradient line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.accent}66, transparent)`,
      }} />

      {/* Left slot: Logo + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo />
        <div style={{ width: 1, height: 18, background: T.rule }} />
        {left}
      </div>

      {/* Right slot: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {right}
      </div>

      {/* Keyframes needed by RunButton + ConnectionBadge */}
      <style>{`
        @keyframes cf-shine { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes cf-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
      `}</style>
    </div>
  )
}
