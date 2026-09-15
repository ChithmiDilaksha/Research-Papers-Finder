import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-white text-brand-700' : 'text-brand-100 hover:bg-brand-600/50'
    }`

  return (
    <nav className="bg-brand-700">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-white font-bold tracking-tight">📄 Research Paper Finder</span>

        {user && (
          <div className="flex items-center gap-2">
            <NavLink to="/" end className={linkClass}>Search</NavLink>
            <NavLink to="/history" className={linkClass}>My History</NavLink>
            <NavLink to="/research-gaps" className={linkClass}>🔎 Research Gaps</NavLink>
            {user.is_admin && (
              <>
                <NavLink to="/admin/sources" className={linkClass}>Sources Master</NavLink>
                <NavLink to="/admin/logs" className={linkClass}>Logs</NavLink>
              </>
            )}
            <span className="text-brand-100 text-sm ml-2 hidden md:inline">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-brand-800 hover:bg-brand-900 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
