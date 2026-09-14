import { useState } from 'react'

const SOURCES = [
  { id: 'semantic_scholar', label: 'Semantic Scholar' },
  { id: 'crossref', label: 'CrossRef' },
  { id: 'arxiv', label: 'arXiv' },
  { id: 'ieee', label: 'IEEE Xplore' },
  { id: 'google_scholar', label: 'Google Scholar' },
]

export default function SearchForm({ onSearch, loading }) {
  const [prompt, setPrompt] = useState('')
  const [limit, setLimit] = useState(10)
  const [sources, setSources] = useState(SOURCES.map((s) => s.id))

  function toggleSource(id) {
    setSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    onSearch({ prompt: prompt.trim(), limit, sources })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-brand-100 rounded-2xl shadow-sm p-6 md:p-8 space-y-6"
    >
      <div>
        <label className="block text-sm font-semibold text-brand-800 mb-2">
          Research prompt / topic
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Deep learning approaches for early breast cancer detection"
          rows={3}
          className="w-full rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none p-4 text-slate-700 placeholder:text-slate-400 transition"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-brand-800 mb-2">
            Number of papers: <span className="text-brand-600">{limit}</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-800 mb-2">
            Sources to search
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleSource(s.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  sources.includes(s.id)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-sm transition"
      >
        {loading ? 'Searching…' : 'Find Research Papers'}
      </button>
    </form>
  )
}
