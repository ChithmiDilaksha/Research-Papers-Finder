import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export async function searchPapers({ prompt, limit, sources }) {
  const response = await axios.post(`${API_BASE_URL}/search`, {
    prompt,
    limit,
    sources,
  })
  return response.data
}
