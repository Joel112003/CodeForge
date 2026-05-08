import './bones/registry'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useHydrate } from './hooks/useHydrate'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ToastContainer from './components/ui/Toast'
import { PageSkeleton } from './components/ui/Skeleton'

const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const Playground     = lazy(() => import('./pages/Playground'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Editor         = lazy(() => import('./pages/Editor'))
const History        = lazy(() => import('./pages/History'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))
const NotFound       = lazy(() => import('./CodeForge404'))

export default function App() {
  useHydrate()

  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/"                  element={<Landing />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/playground"        element={<Playground />} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />
          <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/editor/:roomId?"   element={<ProtectedRoute><Editor /></ProtectedRoute>} />
          <Route path="/history"           element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="*"                  element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}