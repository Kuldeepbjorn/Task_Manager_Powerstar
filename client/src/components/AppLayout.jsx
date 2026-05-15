import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AppLayout() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-white text-indigo-900 shadow-sm ring-1 ring-slate-200/80'
        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
    }`

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
                TT
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">Team Task Manager</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/projects" className={linkClass}>
                Projects
              </NavLink>
              {user?.role === 'Admin' && (
                <NavLink to="/admin" className={linkClass}>
                  Workspace
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1 sm:hidden">
              <NavLink to="/dashboard" className={linkClass}>
                Board
              </NavLink>
              <NavLink to="/projects" className={linkClass}>
                Teams
              </NavLink>
              {user?.role === 'Admin' && (
                <NavLink to="/admin" className={linkClass}>
                  Admin
                </NavLink>
              )}
            </nav>
            <div className="hidden flex-col items-end text-right sm:flex">
              <span className="text-xs font-medium text-slate-500">Signed in</span>
              <span className="text-sm font-semibold text-slate-900">{user?.name || user?.email}</span>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800">
              {user?.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
