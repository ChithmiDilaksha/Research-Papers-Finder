import { useEffect, useState } from 'react'
import {
  fetchGapFinderStatus,
  fetchSearchHistory,
  runGapAnalysis,
  fetchGapAnalyses,
  fetchGapAnalysisDetail,
} from '../api'

export default function ResearchGapPage() {
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [past, setPast] = useState(null)
  const [pastLoading, setPastLoading] = useState(true)

  useEffect(() => {
    fetchGapFinderStatus().then(setStatus)
    fetchSearchHistory(1).then((data) => setHistory(data.data || []))
    loadPast(1)
  }, [])

  function loadPast(page) {
    setPastLoading(true)
    fetchGapAnalyses(page)
      .then(setPast)
      .finally(() => setPastLoading(false))
  }

  function viewPast(id) {
    setError('')
    setResult(null)
    fetchGapAnalysisDetail(id).then(setResult)
  }

  async function handleRun() {
    if (!selectedHistoryId) return
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const data = await runGapAnalysis(selectedHistoryId)
      setResult(data)
      loadPast(1)
    } catch (e) {
      setError(e?.response?.data?.message || 'Something went wrong running the analysis.')
    } finally {
      setRunning(false)
    }
  }

  const eligibleHistory = history.filter((h) => h.found_count >= 2)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-800 mb-1">🔎 AI Research Gap Finder</h1>
      <p className="text-slate-500 text-sm mb-6">
        Pick one of your past searches — the AI looks at the papers that were found and points
        out gaps in the literature you could explore.
      </p>

      {status && !status.available && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
          <p className="font-semibold mb-1">AI feature not configured yet</p>
          <p>
            Ask the site admin to set <code className="bg-amber-100 px-1 rounded">AI_PROVIDER</code>{' '}
            and <code className="bg-amber-100 px-1 rounded">AI_API_KEY</code> in the backend{' '}
            <code className="bg-amber-100 px-1 rounded">.env</code> file. Gemini's free tier
            (aistudio.google.com) is the easiest to get started with.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Choose a past search
        </label>
        {eligibleHistory.length === 0 ? (
          <p className="text-slate-400 text-sm">
            You need at least one saved search with 2+ papers found. Go run a search first.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedHistoryId}
              onChange={(e) => setSelectedHistoryId(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select a search…</option>
              {eligibleHistory.map((h) => (
                <option key={h.id} value={h.id}>
                  "{h.prompt}" — {h.found_count} papers
                </option>
              ))}
            </select>
            <button
              onClick={handleRun}
              disabled={!selectedHistoryId || running || (status && !status.available)}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {running ? 'Analyzing…' : 'Find Research Gaps'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-10">
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-5">
            <p className="text-xs text-slate-400 mb-1">
              Analysis of "{result.topic}" · {result.papers_analyzed} papers ·{' '}
              {result.ai_provider}
            </p>
            <p className="text-slate-700 text-sm">{result.overview}</p>
          </div>

          <div className="space-y-4">
            {result.gaps.map((gap, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-brand-600 font-bold text-sm mt-0.5">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-slate-800">{gap.gap}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-medium text-slate-600">Why it matters: </span>
                      {gap.why_it_matters}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-medium text-slate-600">Suggested direction: </span>
                      {gap.suggested_direction}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-brand-800 mb-4">Past Analyses</h2>
      {pastLoading ? (
        <p className="text-brand-600 text-sm">Loading…</p>
      ) : !past || past.data.length === 0 ? (
        <p className="text-slate-400 text-sm">No gap analyses yet.</p>
      ) : (
        <div className="space-y-3">
          {past.data.map((item) => (
            <button
              key={item.id}
              onClick={() => viewPast(item.id)}
              className="w-full text-left bg-white border border-slate-100 hover:border-brand-300 rounded-xl p-4 shadow-sm transition"
            >
              <div className="flex justify-between items-start gap-4">
                <p className="font-semibold text-slate-800">"{item.topic}"</p>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {item.papers_analyzed} papers analyzed · {(item.gaps || []).length} gaps found
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
