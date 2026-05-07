// src/pages/History.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getExecutionById } from '../services/api'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'
import { Skeleton } from 'boneyard-js/react'

function HistoryListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[64px] rounded-xl border border-gray-800 bg-[#111] animate-pulse"
        />
      ))}
    </div>
  )
}

function HistoryDetailSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <div className="mb-2 h-3 w-24 rounded bg-[#1a1a1a] animate-pulse" />
          <div className="h-32 rounded-lg bg-black/80 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function History() {
  const [history, setHistory]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [detail, setDetail]         = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const navigate                    = useNavigate()

  useEffect(() => {
    getHistory()
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(item) {
    if (selected?.id === item.id) {
      setSelected(null)
      setDetail(null)
      return
    }
    setSelected(item)
    setDetailLoading(true)
    try {
      const res = await getExecutionById(item.id)
      setDetail(res.data)
    } catch {
      setDetail(item)
    } finally {
      setDetailLoading(false)
    }
  }

  function handleRerun(item) {
    navigate(`/editor?lang=${item.language}&code=${encodeURIComponent(item.code)}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Execution History</h1>

        {loading && (
          <Skeleton name="history-list" loading fallback={<HistoryListSkeleton />}>
            <HistoryListSkeleton />
          </Skeleton>
        )}

        {!loading && history.length === 0 && (
          <div className="text-center py-16 text-gray-500">No executions found.</div>
        )}

        <div className="flex flex-col gap-2">
          {history.map((item) => (
            <div key={item.id}>
              {/* Row */}
              <div
                onClick={() => handleSelect(item)}
                className={`bg-[#111] border rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                  selected?.id === item.id
                    ? 'border-blue-500/50'
                    : 'border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-mono px-2.5 py-1 rounded font-medium ${
                    item.language === 'javascript'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.language}
                  </span>
                  <span className="text-gray-400 text-sm font-mono truncate max-w-sm">
                    {item.code?.split('\n')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {item.duration_ms && (
                    <span className="text-gray-600 text-xs">{item.duration_ms}ms</span>
                  )}
                  <Badge status={item.status} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRerun(item) }}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                  >
                    Re-run
                  </button>
                </div>
              </div>

              {/* Detail drawer */}
              {selected?.id === item.id && (
                <div className="border border-t-0 border-blue-500/30 bg-[#0d0d0d] rounded-b-xl px-5 py-4">
                  <Skeleton
                    name="history-detail"
                    loading={detailLoading}
                    fallback={<HistoryDetailSkeleton />}
                  >
                    {detailLoading ? (
                      <HistoryDetailSkeleton />
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Code</p>
                          <pre className="bg-black rounded-lg p-3 text-green-400 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                            {detail?.code}
                          </pre>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Output</p>
                          <pre className="bg-black rounded-lg p-3 text-green-400 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                            {detail?.output || 'No output recorded'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </Skeleton>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}