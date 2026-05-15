import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  createProject,
  createTask,
  createUser,
  deleteProject,
  deleteTask,
  fetchProjects,
  fetchTasks,
  fetchUsers,
  updateProject,
} from '../lib/api'

const TABS = [
  { id: 'projects', label: 'Projects & teams' },
  { id: 'users', label: 'People' },
  { id: 'tasks', label: 'Tasks' },
]

const TASK_STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
]

function uid(x) {
  return x?._id || x
}

function labelUser(u) {
  return u?.name || u?.email || uid(u)
}

export function AdminPage() {
  const { token, user: me } = useAuth()
  const [tab, setTab] = useState('projects')
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refreshAll = useCallback(async () => {
    if (!token) return
    setError('')
    setLoading(true)
    try {
      const [u, p, t] = await Promise.all([fetchUsers(token), fetchProjects(token), fetchTasks(token)])
      setUsers(Array.isArray(u) ? u : [])
      setProjects(Array.isArray(p) ? p : [])
      setTasks(Array.isArray(t) ? t : [])
    } catch (e) {
      setError(e.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void (async () => {
      await Promise.resolve()
      await refreshAll()
    })()
  }, [refreshAll])

  const memberOptions = useMemo(
    () => users.filter((u) => String(uid(u)) !== String(me?.id)),
    [users, me],
  )

  /* ——— Project create ——— */
  const [pName, setPName] = useState('')
  const [pDesc, setPDesc] = useState('')
  const [pMembers, setPMembers] = useState(() => new Set())

  async function handleCreateProject(e) {
    e.preventDefault()
    setMessage('')
    try {
      const members = [...pMembers]
      await createProject(token, { name: pName.trim(), description: pDesc.trim(), members })
      setPName('')
      setPDesc('')
      setPMembers(new Set())
      setMessage('Project created.')
      await refreshAll()
    } catch (e2) {
      setError(e2.message || 'Create failed')
    }
  }

  function toggleMember(id) {
    setPMembers((prev) => {
      const next = new Set(prev)
      const s = String(id)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  /* ——— User create ——— */
  const [uEmail, setUEmail] = useState('')
  const [uPass, setUPass] = useState('')
  const [uName, setUName] = useState('')
  const [uRole, setURole] = useState('Member')

  async function handleCreateUser(e) {
    e.preventDefault()
    setMessage('')
    try {
      await createUser(token, {
        email: uEmail.trim(),
        password: uPass,
        name: uName.trim(),
        role: uRole,
      })
      setUEmail('')
      setUPass('')
      setUName('')
      setURole('Member')
      setMessage('Team member invited.')
      await refreshAll()
    } catch (e2) {
      setError(e2.message || 'Could not create user')
    }
  }

  /* ——— Task create ——— */
  const [tTitle, setTTitle] = useState('')
  const [tDesc, setTDesc] = useState('')
  const [tProject, setTProject] = useState('')
  const [tAssignee, setTAssignee] = useState('')
  const [tDue, setTDue] = useState('')
  const [tStatus, setTStatus] = useState('todo')

  async function handleCreateTask(e) {
    e.preventDefault()
    setMessage('')
    try {
      await createTask(token, {
        title: tTitle.trim(),
        description: tDesc.trim(),
        project: tProject,
        assignee: tAssignee,
        dueDate: new Date(tDue).toISOString(),
        status: tStatus,
      })
      setTTitle('')
      setTDesc('')
      setTDue('')
      setTStatus('todo')
      setMessage('Task created.')
      await refreshAll()
    } catch (e2) {
      setError(e2.message || 'Could not create task')
    }
  }

  async function handleDeleteTask(id) {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(token, id)
      await refreshAll()
    } catch (e2) {
      setError(e2.message || 'Delete failed')
    }
  }

  async function handleDeleteProject(id) {
    if (!confirm('Delete project and orphan tasks in DB? (delete tasks first in production)')) return
    try {
      await deleteProject(token, id)
      await refreshAll()
    } catch (e2) {
      setError(e2.message || 'Delete failed')
    }
  }

  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectDraft, setProjectDraft] = useState(null)

  async function saveEditedProject(projectId) {
    if (!projectDraft) return
    setError('')
    try {
      await updateProject(token, projectId, {
        name: projectDraft.name.trim(),
        description: projectDraft.description.trim(),
        members: projectDraft.memberIds,
      })
      setMessage('Project updated.')
      setEditingProjectId(null)
      setProjectDraft(null)
      await refreshAll()
    } catch (e2) {
      setError(e2.message || 'Update failed')
    }
  }

  function openProjectEditor(p) {
    setEditingProjectId(p._id)
    setProjectDraft({
      name: p.name,
      description: p.description || '',
      memberIds: (p.members || []).map((m) => String(uid(m))),
    })
  }

  function closeProjectEditor() {
    setEditingProjectId(null)
    setProjectDraft(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin workspace</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create projects, assign team members, invite accounts, and publish tasks. Only admins reach
          this route — members are redirected automatically.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
          <button
            type="button"
            className="ml-3 font-semibold text-emerald-800 underline"
            onClick={() => setMessage('')}
          >
            OK
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-200/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={refreshAll}
          className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-white/50"
        >
          Reload data
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          {tab === 'projects' && (
            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">New project</h2>
                <form className="mt-4 space-y-4" onSubmit={handleCreateProject}>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500">Name</label>
                    <input
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500">Description</label>
                    <textarea
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Team members</p>
                    <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                      {memberOptions.map((m) => (
                        <label key={uid(m)} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={pMembers.has(String(uid(m)))}
                            onChange={() => toggleMember(uid(m))}
                          />
                          {labelUser(m)}
                          <span className="text-xs text-slate-400">{m.role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Create project
                  </button>
                </form>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Existing projects</h2>
                {projects.map((p) => {
                  const isOpen = editingProjectId === p._id
                  return (
                    <div
                      key={p._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{p.name}</h3>
                          <p className="text-xs text-slate-500">
                            Owner {labelUser(p.owner)} · {p.members?.length || 0} members
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => (isOpen ? closeProjectEditor() : openProjectEditor(p))}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {isOpen ? 'Close' : 'Edit'}
                        </button>
                      </div>
                      {isOpen && projectDraft && (
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                          <input
                            value={projectDraft.name}
                            onChange={(e) =>
                              setProjectDraft((d) => ({ ...d, name: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <textarea
                            value={projectDraft.description}
                            onChange={(e) =>
                              setProjectDraft((d) => ({ ...d, description: e.target.value }))
                            }
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                            {users.map((m) => {
                              const id = String(uid(m))
                              if (String(uid(p.owner)) === id) return null
                              return (
                                <label key={id} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={projectDraft.memberIds.includes(id)}
                                    onChange={() => {
                                      setProjectDraft((d) => {
                                        const set = new Set(d.memberIds)
                                        if (set.has(id)) set.delete(id)
                                        else set.add(id)
                                        return { ...d, memberIds: [...set] }
                                      })
                                    }}
                                  />
                                  {labelUser(m)}
                                </label>
                              )
                            })}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditedProject(p._id)}
                              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(p._id)}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>
            </div>
          )}

          {tab === 'users' && (
            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">Add teammate</h2>
                <form className="mt-4 space-y-3" onSubmit={handleCreateUser}>
                  <input
                    required
                    placeholder="Full name"
                    value={uName}
                    onChange={(e) => setUName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="password"
                    placeholder="Temp password"
                    value={uPass}
                    onChange={(e) => setUPass(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={uRole}
                    onChange={(e) => setURole(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                  >
                    Create account
                  </button>
                </form>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-base font-semibold text-slate-900">Directory</h2>
                </div>
                <ul className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <li key={uid(u)} className="flex items-center justify-between px-6 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{labelUser(u)}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {u.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">New task</h2>
                <form className="mt-4 space-y-3" onSubmit={handleCreateTask}>
                  <input
                    required
                    placeholder="Title"
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Description"
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    required
                    value={tProject}
                    onChange={(e) => setTProject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={tAssignee}
                    onChange={(e) => setTAssignee(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Assign to</option>
                    {users.map((u) => (
                      <option key={uid(u)} value={uid(u)}>
                        {labelUser(u)}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="datetime-local"
                    value={tDue}
                    onChange={(e) => setTDue(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={tStatus}
                    onChange={(e) => setTStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                  >
                    Create task
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-base font-semibold text-slate-900">Recent tasks</h2>
                </div>
                <ul className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto">
                  {tasks.map((t) => (
                    <li key={t._id} className="px-6 py-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">{t.title}</p>
                          <p className="text-xs text-slate-500">
                            {t.project?.name} · {labelUser(t.assignee)} ·{' '}
                            {new Date(t.dueDate).toLocaleString()}
                          </p>
                          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t._id)}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
