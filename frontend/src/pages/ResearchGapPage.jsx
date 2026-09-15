import { useEffect, useState } from 'react'
import {
  fetchGapFinderStatus,
  fetchSearchHistory,
  runGapAnalysis,
  fetchGapAnalyses,
  fetchGapAnalysisDetail,
  translateGapAnalysis,
} from '../api'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'Sinhala (සිංහල)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'ar', label: 'Arabic (العربية)' },
]

export default function ResearchGapPage() {
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [past, setPast] = useState(null)
  const [pastLoading, setPastLoading] = useState(true)

  // ---- Language / translation state ----
  const [language, setLanguage] = useState('en')
  const [translating, setTranslating] = useState(false)
  const [translationError, setTranslationError] = useState('')
  // cache: { [gapAnalysisId]: { [langCode]: translatedResultObject } }
  const [translationCache, setTranslationCache] = useState({})

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
    setLanguage('en')
    setTranslationError('')
    fetchGapAnalysisDetail(id).then(setResult)
  }

  async function handleRun() {
    if (!selectedHistoryId) return
    setRunning(true)
    setError('')
    setResult(null)
    setLanguage('en')
    setTranslationError('')
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

  // Switch the displayed language. Original English result is always kept
  // in `result` — translations are cached per analysis id + language so
  // switching back and forth doesn't re-call the API.
  async function handleLanguageChange(nextLang) {
    setLanguage(nextLang)
    setTranslationError('')

    if (!result || nextLang === 'en') return

    const analysisId = result.id
    const cached = analysisId && translationCache[analysisId]?.[nextLang]
    if (cached) return // already have it, just render from cache below

    setTranslating(true)
    try {
      const translated = await translateGapAnalysis(analysisId, nextLang)
      setTranslationCache((prev) => ({
        ...prev,
        [analysisId]: { ...(prev[analysisId] || {}), [nextLang]: translated },
      }))
    } catch (e) {
      setTranslationError(
        e?.response?.data?.message || 'Could not translate this into the selected language.'
      )
      setLanguage('en')
    } finally {
      setTranslating(false)
    }
  }

  const eligibleHistory = history.filter((h) => h.found_count >= 2)

  // What to actually render: the cached translation if one is selected
  // and available, otherwise fall back to the original English result.
  const displayed =
    result && language !== 'en' && result.id && translationCache[result.id]?.[language]
      ? translationCache[result.id][language]
      : result

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
          {/* ---- Language selector ---- */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="text-sm font-medium text-slate-600">Read in:</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={translating}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            {translating && (
              <span className="text-xs text-brand-600 flex items-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                Translating…
              </span>
            )}
          </div>

          {translationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
              {translationError}
            </div>
          )}

          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-5">
            <p className="text-xs text-slate-400 mb-1">
              Analysis of "{displayed.topic}" · {displayed.papers_analyzed} papers ·{' '}
              {displayed.ai_provider}
            </p>
            <p className="text-slate-700 text-sm">{displayed.overview}</p>
          </div>

          <div className="space-y-4">
            {displayed.gaps.map((gap, i) => (
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