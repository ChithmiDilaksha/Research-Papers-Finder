import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="text-center py-20 text-brand-600">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="text-center py-20 text-brand-600">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!user.is_admin) {
    return (
      <div className="text-center py-20 text-red-500">
        Admin access required to view this page.
      </div>
    )
  }
  return children
}
