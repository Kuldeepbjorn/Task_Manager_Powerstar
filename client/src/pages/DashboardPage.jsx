import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBrowserNow } from '../hooks/useBrowserNow'
import { fetchTasks, patchTask } from '../lib/api'

const STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  BLOCKED: 'blocked',
}

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
  },
  {
    id: 'done',
    title: 'Done',
  },
]

function assigneeId(task) {
  const a = task.assignee
  if (!a) return null
  if (typeof a === 'object' && a._id) return String(a._id)
  return String(a)
}

function isPendingPastDue(task, nowMs) {
  if (task.status === STATUS.DONE) return false
  const due = new Date(task.dueDate).getTime()
  return !Number.isNaN(due) && due < nowMs
}

function TaskCard({ task, nowMs, canChangeStatus, onStatusChange }) {
  const overdue = isPendingPastDue(task, nowMs)
  const projectName = task.project?.name || 'Project'
  const assigneeName = task.assignee?.name || task.assignee?.email || 'Assignee'

  const statusOptions = [
    { value: STATUS.TODO, label: 'To do' },
    { value: STATUS.IN_PROGRESS, label: 'In progress' },
    { value: STATUS.DONE, label: 'Done' },
    { value: STATUS.BLOCKED, label: 'Blocked' },
  ]

  return (
    <article
      className={`rounded-lg border bg-white p-3 shadow-sm ${
        overdue ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-semibold leading-snug ${
            overdue ? 'text-red-600' : 'text-slate-900'
          }`}
        >
          {task.title}
        </h3>
        {task.status === STATUS.BLOCKED && (
          <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            Blocked
          </span>
        )}
      </div>
      {task.description && (
        <p
          className={`mt-1 line-clamp-3 text-xs ${overdue ? 'text-red-600/90' : 'text-slate-600'}`}
        >
          {task.description}
        </p>
      )}
      <p className={`mt-2 text-xs ${overdue ? 'font-medium text-red-600' : 'text-slate-500'}`}>
        Due{' '}
        {new Date(task.dueDate).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
        {overdue && <span className="ml-1 text-red-600">(overdue)</span>}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {projectName} · {assigneeName}
      </p>
      {canChangeStatus && (
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="shrink-0 font-medium">Status</span>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </article>
  )
}

export function DashboardPage() {
  const { token, user } = useAuth()
  const nowMs = useBrowserNow()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await Promise.resolve()
      if (cancelled) return

      if (!token) {
        setTasks([])
        setLoading(false)
        return
      }

      setError('')
      setLoading(true)
      try {
        const data = await fetchTasks(token)
        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load tasks')
          setTasks([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  const refresh = useCallback(() => {
    if (!token) return
    setError('')
    setLoading(true)
    fetchTasks(token)
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err.message || 'Could not load tasks')
        setTasks([])
      })
      .finally(() => setLoading(false))
  }, [token])

  const grouped = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] }
    for (const task of tasks) {
      if (task.status === STATUS.TODO || task.status === STATUS.BLOCKED) {
        map.todo.push(task)
      } else if (task.status === STATUS.IN_PROGRESS) {
        map.in_progress.push(task)
      } else if (task.status === STATUS.DONE) {
        map.done.push(task)
      }
    }
    return map
  }, [tasks])

  const canChangeStatus = useCallback(
    (task) => {
      if (!user) return false
      if (user.role === 'Admin') return true
      return assigneeId(task) === String(user.id)
    },
    [user],
  )

  const handleStatusChange = useCallback(
    async (task, nextStatus) => {
      if (!token || nextStatus === task.status) return
      setBusyId(task._id)
      setError('')
      try {
        const updated = await patchTask(token, task._id, { status: nextStatus })
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
      } catch (err) {
        setError(err.message || 'Update failed')
      } finally {
        setBusyId(null)
      }
    },
    [token],
  )

  const counts = useMemo(() => {
    let overdue = 0
    let open = 0
    for (const task of tasks) {
      if (task.status !== STATUS.DONE) {
        open += 1
        if (isPendingPastDue(task, nowMs)) overdue += 1
      }
    }
    return { overdue, open, total: tasks.length }
  }, [tasks, nowMs])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Task dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Kanban columns mirror your workflow. Open work with a due date in the past is flagged in{' '}
            <span className="font-semibold text-red-600">red</span> using your local time (
            {new Date(nowMs).toLocaleString()}
            ).
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={loading || busyId}
        >
          Refresh board
        </button>
      </div>

      {!loading && tasks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Active tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.open}</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-red-700">Overdue &amp; pending</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{counts.overdue}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">All cards</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.total}</p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Loading tasks…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <section
              key={col.id}
              className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
            >
              <h2 className="mb-4 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    col.id === 'todo'
                      ? 'bg-slate-400'
                      : col.id === 'in_progress'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                  }`}
                />
                {col.title}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-700">
                  {grouped[col.id].length}
                </span>
              </h2>
              <div className="flex flex-1 flex-col gap-3">
                {grouped[col.id].length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-8 text-center text-xs text-slate-500">
                    Drop work here once tasks are created.
                  </p>
                )}
                {grouped[col.id].map((task) => (
                  <div key={task._id} className={busyId === task._id ? 'opacity-60' : ''}>
                    <TaskCard
                      task={task}
                      nowMs={nowMs}
                      canChangeStatus={canChangeStatus(task)}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
