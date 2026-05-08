import Shimmer from './Skeleton'

export default function PageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8F4ED', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 52, borderBottom: '1px solid #E0D8CA', background: '#FAF7F0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Shimmer style={{ width: 28, height: 28 }} />
        <Shimmer style={{ width: 80, height: 10 }} />
        <div style={{ flex: 1 }} />
        <Shimmer style={{ width: 64, height: 10 }} />
        <Shimmer style={{ width: 64, height: 10 }} />
        <Shimmer style={{ width: 80, height: 30 }} />
      </div>
      <div style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Shimmer style={{ width: '30%', height: 14 }} />
        <Shimmer style={{ width: '60%', height: 40 }} />
        <Shimmer style={{ width: '45%', height: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
          {[1, 2, 3].map(i => <Shimmer key={i} style={{ height: 120 }} />)}
        </div>
        <Shimmer style={{ width: '100%', height: 180, marginTop: 8 }} />
      </div>
    </div>
  )
}
