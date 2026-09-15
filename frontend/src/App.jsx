import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import HistoryPage from './pages/HistoryPage'
import ResearchGapPage from './pages/ResearchGapPage'
import AdminSourcesPage from './pages/AdminSourcesPage'
import AdminLogsPage from './pages/AdminLogsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/research-gaps"
          element={
            <ProtectedRoute>
              <ResearchGapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sources"
          element={
            <AdminRoute>
              <AdminSourcesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminRoute>
              <AdminLogsPage />
            </AdminRoute>
          }
        />
      </Routes>

      <footer className="text-center text-xs text-slate-400 py-8">
        Built with React + Laravel · Results ranked by citations, source reliability and recency
      </footer>
    </div>
  )
}
