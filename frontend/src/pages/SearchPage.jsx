import { useState } from 'react'
import SearchForm from '../components/SearchForm'
import ResultsList from '../components/ResultsList'
import { searchPapers } from '../api'

export default function SearchPage() {
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
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-800">Find Research Papers</h1>
        <p className="text-slate-500 mt-2">
          Enter a topic and get a priority-ranked list of papers from your selected sources.
        </p>
      </div>
      <SearchForm onSearch={handleSearch} loading={loading} />
      <ResultsList results={results} loading={loading} error={error} />
    </div>
  )
}
