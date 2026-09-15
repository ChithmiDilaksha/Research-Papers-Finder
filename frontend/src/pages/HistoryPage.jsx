import { useEffect, useState } from 'react'
import { fetchSearchHistory, fetchSearchHistoryDetail } from '../api'
import PaperCard from '../components/PaperCard'

export default function HistoryPage() {
  const [history, setHistory] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadHistory(1)
  }, [])

  function loadHistory(page) {
    setLoading(true)
    fetchSearchHistory(page)
      .then(setHistory)
      .finally(() => setLoading(false))
  }

  function viewDetail(id) {
    setDetailLoading(true)
    setSelected(null)
    fetchSearchHistoryDetail(id)
      .then(setSelected)
      .finally(() => setDetailLoading(false))
  }

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => setSelected(null)}
          className="text-brand-600 text-sm font-medium mb-6 hover:underline"
        >
          ← Back to my history
        </button>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-6">
          <p className="text-xs text-slate-400 mb-1">
            Searched on {new Date(selected.created_at).toLocaleString()}
          </p>
          <h1 className="text-xl font-bold text-brand-800">"{selected.prompt}"</h1>
          <p className="text-sm text-slate-500 mt-1">
            Requested {selected.limit_requested} papers from{' '}
            {selected.sources_used.join(', ')} — {selected.found_count} found
          </p>
        </div>

        <div className="space-y-4">
          {selected.results.map((paper) => (
            <PaperCard key={`${paper.source}-${paper.rank}`} paper={paper} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-800 mb-6">My Search History</h1>

      {loading || detailLoading ? (
        <p className="text-brand-600">Loading…</p>
      ) : !history || history.data.length === 0 ? (
        <p className="text-slate-400">You haven't searched for anything yet.</p>
      ) : (
        <div className="space-y-3">
          {history.data.map((item) => (
            <button
              key={item.id}
              onClick={() => viewDetail(item.id)}
              className="w-full text-left bg-white border border-slate-100 hover:border-brand-300 rounded-xl p-4 shadow-sm transition"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-slate-800">"{item.prompt}"</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(item.created_at).toLocaleString()} · sources: {item.sources_used.join(', ')}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-600 whitespace-nowrap">
                  {item.found_count} papers
                </span>
              </div>
            </button>
          ))}

          {history.last_page > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: history.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadHistory(page)}
                  className={`w-8 h-8 rounded-full text-sm ${
                    page === history.current_page
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-500'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
