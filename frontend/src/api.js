import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const api = axios.create({ baseURL: API_BASE_URL })

// Attach the saved auth token (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Auth ----
export const registerUser = (data) => api.post('/register', data).then((r) => r.data)
export const loginUser = (data) => api.post('/login', data).then((r) => r.data)
export const logoutUser = () => api.post('/logout').then((r) => r.data)
export const fetchMe = () => api.get('/me').then((r) => r.data)

// ---- Sources (master data, shown to every logged-in user) ----
export const fetchSources = () => api.get('/sources').then((r) => r.data)

// ---- Search ----
export const searchPapers = ({ prompt, limit, sources }) =>
  api.post('/search', { prompt, limit, sources }).then((r) => r.data)

// ---- Search history (logged-in user's own prompts + found papers) ----
export const fetchSearchHistory = (page = 1) =>
  api.get(`/search-history?page=${page}`).then((r) => r.data)
export const fetchSearchHistoryDetail = (id) =>
  api.get(`/search-history/${id}`).then((r) => r.data)

// ---- AI Research Gap Finder ----
export const fetchGapFinderStatus = () => api.get('/research-gaps/status').then((r) => r.data)
export const runGapAnalysis = (searchHistoryId) =>
  api.post('/research-gaps', { search_history_id: searchHistoryId }).then((r) => r.data)
export const fetchGapAnalyses = (page = 1) =>
  api.get(`/research-gaps?page=${page}`).then((r) => r.data)
export const fetchGapAnalysisDetail = (id) =>
  api.get(`/research-gaps/${id}`).then((r) => r.data)
export const translateGapAnalysis = (id, lang) =>
  api.post(`/research-gaps/${id}/translate`, { language: lang }).then((r) => r.data)
// ---- Admin: sources master CRUD ----
export const fetchAdminSources = () => api.get('/admin/sources').then((r) => r.data)
export const createSource = (data) => api.post('/admin/sources', data).then((r) => r.data)
export const updateSource = (id, data) => api.put(`/admin/sources/${id}`, data).then((r) => r.data)
export const deleteSource = (id) => api.delete(`/admin/sources/${id}`).then((r) => r.data)

// ---- Admin: logs ----
export const fetchActivityLogs = (page = 1) =>
  api.get(`/admin/activity-logs?page=${page}`).then((r) => r.data)
export const fetchSystemLogs = (page = 1) =>
  api.get(`/admin/system-logs?page=${page}`).then((r) => r.data)
