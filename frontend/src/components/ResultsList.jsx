import PaperCard from './PaperCard'

export default function ResultsList({ results, loading, error }) {
  if (loading) {
    return (
      <div className="text-center py-16 text-brand-600">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="font-medium">Searching IEEE, Google Scholar, Semantic Scholar, CrossRef and arXiv…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500 bg-red-50 rounded-2xl border border-red-100">
        {error}
      </div>
    )
  }

  if (!results) return null

  if (results.papers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        No papers found for this prompt. Try broadening your topic.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-brand-800">
          Top {results.papers.length} papers for "{results.query}"
        </h2>
        <span className="text-xs text-slate-400">
          {results.totalBeforeLimit} candidates found before ranking
        </span>
      </div>

      {results.papers.map((paper) => (
        <PaperCard key={`${paper.source}-${paper.rank}`} paper={paper} />
      ))}
    </div>
  )
}
