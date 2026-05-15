import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchProjects } from '../lib/api'

function userLabel(u) {
  return u?.name || u?.email || 'User'
}

export function ProjectsPage() {
  const { token, user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setError('')
    setLoading(true)
    try {
      const data = await fetchProjects(token)
      setProjects(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Could not load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void (async () => {
      await Promise.resolve()
      await load()
    })()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects &amp; teams</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {user?.role === 'Admin'
              ? 'Every project lists its owner and member roster. Edit rosters and tasks from the Admin workspace.'
              : 'Projects you own or belong to. Tasks assigned to you appear on the dashboard.'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">No projects yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Admins can create a project and add members under{' '}
            <span className="font-semibold text-slate-800">Workspace → Admin</span>.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <article
              key={p._id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{p.name}</h2>
              {p.description && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-800">
                  Owner: {userLabel(p.owner)}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Members</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(p.members || []).length === 0 && (
                    <span className="text-xs text-slate-400">No extra members</span>
                  )}
                  {(p.members || []).map((m) => (
                    <span
                      key={m._id || m}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {userLabel(m)}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
