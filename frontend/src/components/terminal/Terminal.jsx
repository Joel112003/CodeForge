// src/components/terminal/Terminal.jsx
import { useEffect, useRef } from 'react'

export default function Terminal({ lines, status }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div className="h-full bg-black rounded-lg border border-gray-800 p-4 overflow-y-auto font-mono text-sm flex flex-col">
      {lines.length === 0 && (
        <span className="text-gray-600">Run your code to see output...</span>
      )}

      {lines.map((line, i) => {
        const isString = typeof line === 'string'
        const text = isString ? line : line?.data || line?.output || line?.message || ''
        const type = isString ? 'stdout' : line?.type
        return (
          <span
            key={i}
            className={`leading-relaxed whitespace-pre-wrap ${
              type === 'stderr' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {text}
          </span>
        )
      })}

      {status === 'RUNNING' && (
        <span className="text-blue-400 animate-pulse mt-1">▋</span>
      )}

      <div ref={bottomRef} />
    </div>
  )
}