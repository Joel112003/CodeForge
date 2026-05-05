// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

const FEATURES = [
  { icon: '🐳', title: 'Isolated Execution', desc: 'Every run gets its own Docker container. No interference, no data leaks.' },
  { icon: '⚡', title: 'Live Streaming Output', desc: 'Output streams to your screen line by line in real time, not all at once.' },
  { icon: '👥', title: 'Real-time Collaboration', desc: 'Share a room link. Code together, run together, see the same output.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Navbar */}
      <nav className="px-8 py-4 flex items-center justify-between border-b border-gray-800">
        <span className="text-white font-bold text-xl">
          Code<span className="text-blue-500">Engine</span>
        </span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
          <Button onClick={() => navigate('/register')}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full mb-6">
          Now with real-time collaboration
        </div>

        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Write Code.<br />
          <span className="text-blue-500">Run Anywhere.</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl mb-8">
          Execute code in isolated Docker containers, collaborate in real time,
          and watch output stream live — right in your browser.
        </p>

        <div className="flex gap-3">
          <Button onClick={() => navigate('/register')} className="px-8 py-3 text-base">
            Start for Free
          </Button>
          <Button variant="ghost" onClick={() => navigate('/login')} className="px-8 py-3 text-base">
            Sign In
          </Button>
        </div>

        {/* Code preview */}
        <div className="mt-16 w-full max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden text-left">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-gray-500 text-xs">main.js</span>
          </div>
          <pre className="p-6 text-sm font-mono text-gray-300 leading-relaxed">
            <span className="text-blue-400">const</span>{' '}
            <span className="text-white">nums</span>{' '}
            <span className="text-gray-500">=</span>{' '}
            <span className="text-yellow-400">[1, 2, 3, 4, 5]</span>{'\n'}
            {'\n'}
            <span className="text-blue-400">nums</span>
            <span className="text-gray-300">.forEach</span>
            <span className="text-yellow-300">(</span>
            <span className="text-orange-400">n</span>{' '}
            <span className="text-gray-500">=&gt;</span>{' '}
            <span className="text-yellow-300">{'{'}</span>{'\n'}
            {'  '}
            <span className="text-blue-300">console</span>
            <span className="text-gray-300">.log</span>
            <span className="text-yellow-300">(</span>
            <span className="text-orange-400">n</span>{' '}
            <span className="text-gray-500">*</span>{' '}
            <span className="text-green-400">2</span>
            <span className="text-yellow-300">)</span>{'\n'}
            <span className="text-yellow-300">{'}'}</span>
            <span className="text-gray-300">)</span>
          </pre>
          <div className="border-t border-gray-800 bg-black p-4 font-mono text-sm">
            <span className="text-green-400">2{'\n'}4{'\n'}6{'\n'}8{'\n'}10</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16 border-t border-gray-800">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#111] border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}