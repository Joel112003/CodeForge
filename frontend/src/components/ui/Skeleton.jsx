

const SHIMMER_STYLE = `
  @keyframes cf-shimmer {
    0%   { background-position: 200% 0 }
    100% { background-position: -200% 0 }
  }
  @keyframes cf-pulse {
    0%, 100% { opacity: 0.6 }
    50%       { opacity: 1 }
  }
`

function Shimmer({ className = '', style, rounded = false }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#EDE8DF',
        borderRadius: rounded ? '999px' : '0px',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 60%, transparent 100%)',
          backgroundSize: '300% 100%',
          animation: 'cf-shimmer 2s ease-in-out infinite',
        }}
      />
    </div>
  )
}

export function SkeletonHistoryRows({ count = 6, loading = true, children }) {
  if (!loading) return children ?? null

  return (
    <div>
      <style>{SHIMMER_STYLE}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 24px',
            borderBottom: '1px solid #EDE8DF',
            opacity: Math.max(0.3, 1 - i * 0.13),
          }}
        >
          <Shimmer style={{ width: '16px', height: '12px' }} />
          <Shimmer style={{ width: '64px', height: '22px' }} rounded />
          <Shimmer style={{ flex: 1, height: '12px', maxWidth: `${42 + (i % 5) * 12}%` }} />
          <Shimmer style={{ width: '56px', height: '12px' }} />
          <Shimmer style={{ width: '80px', height: '22px' }} rounded />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatCards({ count = 3, loading = true, children }) {
  if (!loading) return children ?? null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${count}, 1fr)`,
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <style>{SHIMMER_STYLE}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: '#FDFAF4',
            border: '1px solid #E8E0D0',
            borderLeft: '3px solid #D4C9B0',
            padding: '20px',
            opacity: Math.max(0.5, 1 - i * 0.15),
          }}
        >
          <Shimmer style={{ width: '64px', height: '32px', marginBottom: '12px' }} />
          <Shimmer style={{ width: '96px', height: '11px', marginBottom: '6px' }} />
          <Shimmer style={{ width: '56px', height: '10px' }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonFormRows({ count = 4, loading = true, children }) {
  if (!loading) return children ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{SHIMMER_STYLE}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ opacity: Math.max(0.4, 1 - i * 0.14) }}>
          <Shimmer style={{ width: '96px', height: '11px', marginBottom: '8px' }} />
          <Shimmer style={{ width: '100%', height: '48px', border: '1px solid #E8E0D0' }} />
        </div>
      ))}
    </div>
  )
}

export { Shimmer }
export default Shimmer