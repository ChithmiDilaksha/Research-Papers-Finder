import { useState } from 'react'
import SearchForm from './components/SearchForm'
import ResultsList from './components/ResultsList'
import { searchPapers } from './api'

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(params) {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const data = await searchPapers(params)
      setResults(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Something went wrong while searching. Please make sure the backend server is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-brand-100 bg-gradient-to-r from-brand-700 to-brand-500">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Research Paper Finder
          </h1>
          <p className="text-brand-100 mt-2 max-w-xl mx-auto">
            Enter a topic and get a priority-ranked list of research papers from
            IEEE, Google Scholar, Semantic Scholar, CrossRef and arXiv.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <SearchForm onSearch={handleSearch} loading={loading} />
        <ResultsList results={results} loading={loading} error={error} />
      </main>

      <footer className="text-center text-xs text-slate-400 py-8">
        Built with React + Laravel · Results ranked by citations, source reliability and recency
      </footer>
    </div>
  )
}
