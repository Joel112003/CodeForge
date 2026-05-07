// src/components/room/MemberList.jsx
import { showToast } from '../../utils/toastMessages'

const T = {
  panel:   '#FAF7F0',
  deep:    '#F5F0E8',
  ink:     '#1A1208',
  ink2:    '#4A3E30',
  muted:   '#7A6E5A',
  faint:   '#A0917E',
  rule:    '#E0D8CA',
  accent:  '#C04A1A',
  accent2: '#8C3310',
}

export default function MemberList({ members, roomId }) {
  function copyLink() {
    navigator.clipboard
      .writeText(`${window.location.origin}/editor/${roomId}`)
      .then(() => showToast('Room link copied to clipboard', 'success'))
      .catch(() => showToast('Failed to copy link', 'error'))
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: 14,
        background: T.panel,
        border: `1px solid ${T.rule}`,
        borderTop: `2px solid ${T.accent}`,
        height: '100%',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'block', width: 12, height: 1, background: T.accent }} />
          <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>
            Members
          </span>
        </div>
        <span style={{ fontSize: 9, color: T.faint }}>
          {members.length} online
        </span>
      </div>

      {/* member rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {members.map((member, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* avatar square — matches HTML logo-sq style */}
            <div style={{
              width: 24, height: 24,
              background: T.accent,
              boxShadow: `1px 1px 0 ${T.accent2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: "'Spectral', serif",
                fontWeight: 700, fontStyle: 'italic',
                color: '#FAF7F0', fontSize: '0.7rem',
              }}>
                {member[0]?.toUpperCase()}
              </span>
            </div>

            <span style={{ fontSize: 11, color: T.ink2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {member}
            </span>

            {/* online dot */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#059669', flexShrink: 0,
            }} />
          </div>
        ))}
      </div>

      {/* copy link button */}
      <button
        onClick={copyLink}
        style={{
          width: '100%', height: 34,
          background: T.deep,
          border: `1px solid ${T.rule}`,
          color: T.ink,
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: `2px 2px 0 ${T.rule}`,
          transition: 'all 0.1s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${T.rule}` }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${T.rule}` }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <rect x="1" y="4" width="7" height="7" rx="0" stroke="#C04A1A" strokeWidth="1.5"/>
          <path d="M4 4V3a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-1" stroke="#C04A1A" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Copy Room Link
      </button>
    </div>
  )
}