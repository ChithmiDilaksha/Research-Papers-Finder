const SOURCE_COLORS = {
  'IEEE Xplore': 'bg-blue-100 text-blue-700',
  'Semantic Scholar': 'bg-indigo-100 text-indigo-700',
  'Google Scholar': 'bg-sky-100 text-sky-700',
  'CrossRef': 'bg-cyan-100 text-cyan-700',
  'arXiv': 'bg-slate-100 text-slate-700',
}

export default function PaperCard({ paper }) {
  const badgeClass = SOURCE_COLORS[paper.source] || 'bg-brand-100 text-brand-700'

  return (
    <div className="bg-white border border-slate-100 hover:border-brand-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
        {paper.rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {paper.source}
          </span>
          {paper.year && (
            <span className="text-xs text-slate-400">{paper.year}</span>
          )}
          <span className="text-xs text-brand-600 font-medium ml-auto">
            Priority score: {paper.priorityScore}
          </span>
        </div>

        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-slate-800 hover:text-brand-700 leading-snug"
        >
          {paper.title}
        </a>

        {paper.authors && (
          <p className="text-sm text-slate-500 mt-1 truncate">{paper.authors}</p>
        )}

        {paper.abstract && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-3">{paper.abstract}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          {paper.venue && <span>{paper.venue}</span>}
          <span>Citations: {paper.citationCount ?? 0}</span>
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:text-brand-800 font-medium ml-auto"
          >
            View paper →
          </a>
        </div>
      </div>
    </div>
  )
}
