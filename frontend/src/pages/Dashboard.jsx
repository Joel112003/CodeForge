import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, createRoom } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function Dashboard() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const { user }                = useAuthStore()
  const navigate                = useNavigate()

  useEffect(() => {
    getHistory()
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleNewSession() {
    setCreating(true)
    try {
      const res = await createRoom()
      navigate(`/editor/${res.data.roomId}`)
    } catch {
      alert('Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back{user?.email ? `, ${user.email}` : ''}
            </p>
          </div>
          <Button onClick={handleNewSession} disabled={creating} className="flex items-center gap-2">
            {creating ? <Spinner /> : '+'} New Session
          </Button>
        </div>

        {/* Recent executions */}
        <div>
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">
            Recent Executions
          </h2>

          {loading && (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="border border-dashed border-gray-800 rounded-xl py-16 text-center">
              <p className="text-4xl mb-3">🚀</p>
              <p className="text-gray-500 text-sm">No executions yet.</p>
              <p className="text-gray-600 text-xs mt-1">Start a new session to run your first code.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/editor?execution=${item.id}`)}
                className="bg-[#111] border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-mono px-2.5 py-1 rounded font-medium ${
                    item.language === 'javascript'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.language}
                  </span>
                  <span className="text-gray-400 text-sm font-mono truncate max-w-xs group-hover:text-white transition-colors">
                    {item.code?.split('\n')[0] || 'No code'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {item.duration_ms && (
                    <span className="text-gray-600 text-xs">{item.duration_ms}ms</span>
                  )}
                  <Badge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}