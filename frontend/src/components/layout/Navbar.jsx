// src/components/layout/Navbar.jsx
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-[#0a0a0a]">
      <Link to="/dashboard" className="text-white font-bold text-lg tracking-tight">
        Code<span className="text-blue-500">Forge</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/history" className="text-gray-400 hover:text-white text-sm transition-colors">
          History
        </Link>
        <span className="text-gray-600 text-sm">{user?.email}</span>
        <Button variant="ghost" onClick={handleLogout}>Logout</Button>
      </div>
    </nav>
  )
}