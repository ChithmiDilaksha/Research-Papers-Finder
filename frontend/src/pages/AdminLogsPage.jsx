import { useEffect, useState } from 'react'
import { fetchActivityLogs, fetchSystemLogs } from '../api'

export default function AdminLogsPage() {
  const [tab, setTab] = useState('activity') // 'activity' | 'system'
  const [activity, setActivity] = useState(null)
  const [system, setSystem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivity(1)
    loadSystem(1)
  }, [])

  function loadActivity(page) {
    setLoading(true)
    fetchActivityLogs(page)
      .then(setActivity)
      .finally(() => setLoading(false))
  }

  function loadSystem(page) {
    setLoading(true)
    fetchSystemLogs(page)
      .then(setSystem)
      .finally(() => setLoading(false))
  }

  const levelColors = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-brand-800">Logs</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('activity')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'activity' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-500'
          }`}
        >
          Activity Log
        </button>
        <button
          onClick={() => setTab('system')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'system' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-500'
          }`}
        >
          System Log
        </button>
      </div>

      {tab === 'activity' && (
        <div className="space-y-3">
          {loading && !activity ? (
            <p className="text-brand-600">Loading…</p>
          ) : activity && activity.data.length === 0 ? (
            <p className="text-slate-400">No activity recorded yet.</p>
          ) : (
            activity?.data.map((log) => (
              <div key={log.id} className="bg-white border border-slate-100 rounded-xl p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                      {log.action}
                    </span>
                    <p className="text-sm text-slate-700 mt-2">{log.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {log.user ? `${log.user.name} (${log.user.email})` : 'Guest'} · {log.ip_address}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}

          {activity && activity.last_page > 1 && (
            <Pagination data={activity} onPage={loadActivity} />
          )}
        </div>
      )}

      {tab === 'system' && (
        <div className="space-y-3">
          {loading && !system ? (
            <p className="text-brand-600">Loading…</p>
          ) : system && system.data.length === 0 ? (
            <p className="text-slate-400">No system events recorded yet.</p>
          ) : (
            system?.data.map((log) => (
              <div key={log.id} className="bg-white border border-slate-100 rounded-xl p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[log.level] || 'bg-slate-100 text-slate-600'}`}>
                      {log.level}
                    </span>
                    <p className="text-sm text-slate-700 mt-2">{log.message}</p>
                    {log.context && (
                      <pre className="text-xs text-slate-400 mt-1 bg-slate-50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}

          {system && system.last_page > 1 && (
            <Pagination data={system} onPage={loadSystem} />
          )}
        </div>
      )}
    </div>
  )
}

function Pagination({ data, onPage }) {
  return (
    <div className="flex justify-center gap-2 pt-2">
      {Array.from({ length: data.last_page }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPage(page)}
          className={`w-8 h-8 rounded-full text-sm ${
            page === data.current_page
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-slate-200 text-slate-500'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  )
}
