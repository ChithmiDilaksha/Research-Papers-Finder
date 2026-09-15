import { useEffect, useState } from 'react'
import { createSource, deleteSource, fetchAdminSources, updateSource } from '../api'

const emptyForm = {
  key: '',
  name: '',
  description: '',
  requires_api_key: false,
  api_key_env: '',
  priority_weight: 10,
  is_active: true,
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    fetchAdminSources()
      .then(setSources)
      .finally(() => setLoading(false))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId) {
        await updateSource(editingId, form)
      } else {
        await createSource(form)
      }
      setForm(emptyForm)
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this source.')
    }
  }

  function startEdit(source) {
    setEditingId(source.id)
    setForm({
      key: source.key,
      name: source.name,
      description: source.description || '',
      requires_api_key: source.requires_api_key,
      api_key_env: source.api_key_env || '',
      priority_weight: source.priority_weight,
      is_active: source.is_active,
    })
  }

  async function toggleActive(source) {
    await updateSource(source.id, { is_active: !source.is_active })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this source? It will no longer be searchable.')) return
    await deleteSource(id)
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-brand-800">Sources Master</h1>
      <p className="text-slate-500 -mt-4">
        Add, edit, activate or deactivate the research databases users can search.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-brand-100 rounded-2xl shadow-sm p-6 grid md:grid-cols-2 gap-4"
      >
        {error && (
          <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Key (unique, e.g. ieee) {editingId && '— locked'}
          </label>
          <input
            required
            disabled={!!editingId}
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            className="w-full rounded-xl border border-slate-200 p-2.5 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Display name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 p-2.5"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-xl border border-slate-200 p-2.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Priority weight (0-100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.priority_weight}
            onChange={(e) => setForm({ ...form, priority_weight: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 p-2.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            API key env var (optional)
          </label>
          <input
            value={form.api_key_env}
            onChange={(e) => setForm({ ...form, api_key_env: e.target.value })}
            placeholder="e.g. IEEE_API_KEY"
            className="w-full rounded-xl border border-slate-200 p-2.5"
          />
        </div>

        <div className="flex items-center gap-6 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.requires_api_key}
              onChange={(e) => setForm({ ...form, requires_api_key: e.target.checked })}
            />
            Requires API key
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active (searchable)
          </label>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
          >
            {editingId ? 'Update source' : 'Add source'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-brand-600">Loading sources…</p>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-slate-800">
                  {s.name}{' '}
                  <span className="text-xs text-slate-400 font-normal">({s.key})</span>
                  {!s.is_active && (
                    <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      inactive
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{s.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Weight: {s.priority_weight} · {s.requires_api_key ? `Needs ${s.api_key_env}` : 'No key needed'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(s)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-brand-300"
                >
                  {s.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => startEdit(s)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-brand-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
