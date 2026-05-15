import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-indigo-50 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
        <p className="text-xs font-bold uppercase tracking-widest text-red-600">403 restricted</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">That workspace is admin-only</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Members can use the dashboard and projects view. Admins unlock the full team workspace for
          invitations, project rosters, and task creation.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/dashboard"
            className="inline-flex justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
          >
            Back to dashboard
          </Link>
          <Link
            to="/projects"
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View projects
          </Link>
        </div>
      </div>
    </div>
  )
}
