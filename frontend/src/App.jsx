import './bones/registry'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ToastContainer from './components/ui/Toast'
import Landing   from './pages/Landing'
import Login     from './pages/Login'
import Register  from './pages/Register'
import Dashboard from './pages/Dashboard'
import Editor    from './pages/Editor'
import History   from './pages/History'
import Playground from './pages/Playground'
import { getMe } from './services/api'
import useAuthStore from './store/authStore'

export default function App() {
  const { setAuth, setHydrated } = useAuthStore()

  useEffect(() => {
    let isMounted = true

    async function hydrate() {
      try {
        const res = await getMe()
        if (!isMounted) return
        const csrfToken = res.data.csrfToken || res.data.csrf_token
        setAuth(res.data.user, csrfToken)
      } catch {
        if (!isMounted) return
      } finally {
        if (isMounted) setHydrated(true)
      }
    }

    hydrate()
    return () => {
      isMounted = false
    }
  }, [setAuth, setHydrated])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/playground"  element={<Playground />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/editor/:roomId?" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}