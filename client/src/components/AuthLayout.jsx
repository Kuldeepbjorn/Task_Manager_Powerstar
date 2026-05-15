export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 p-10 text-white lg:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            Team Task Manager
          </p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Plan projects, assign work, and ship together.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100">
            Role-based access for Admins and Members, Kanban task flow, and overdue alerts aligned
            to your browser clock.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-indigo-100/90">
          <li className="flex gap-2">
            <span className="text-emerald-300">✓</span> REST API + MongoDB with validated relationships
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-300">✓</span> JWT auth, RBAC, and live task board
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-300">✓</span> Project &amp; team membership controls
          </li>
        </ul>
      </div>
      <div className="flex w-full flex-col justify-center bg-slate-50 px-4 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Team Task Manager
            </p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-slate-200 pt-6">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
