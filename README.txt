TEAM TASK MANAGER (FULL-STACK) — README
=========================================

OVERVIEW
--------
Express.js REST API + MongoDB (Mongoose), React (Vite) SPA, Tailwind CSS.
JWT login/register, Admin vs Member RBAC, projects with team members, tasks with required due dates and status. Kanban dashboard with overdue (pending + past due) tasks shown in red using the browser clock.

RAILWAY DEPLOYMENT (ASSESSMENT)
------------------------------
1. Provision MongoDB (Railway plugin or MongoDB Atlas). Set MONGODB_URI.
2. Deploy this repo; root folder should be team-task-manager if nested.
3. Environment variables:
   - MONGODB_URI
   - JWT_SECRET (long random string)
   - NODE_ENV=production
   - CORS_ORIGIN=your public URL (optional if same-origin)
4. Build:  npm install && npm run build
   Start:  npm start

The Node server serves the built React app and exposes /api/* on the same host.

FIRST USER / ADMIN
------------------
Open /register on the live site. The first user in an empty database becomes Admin.

LOCAL DEV
---------
Node 20+, MongoDB running or Atlas URI.

  cd team-task-manager
  cp server/.env.example server/.env
  npm install
  npm run dev

FEATURES FOR REVIEWERS
----------------------
- Sign up and sign in
- Projects and team membership (owner + members)
- Task CRUD (admin); members update status only on assigned tasks
- Dashboard: Kanban To Do / In Progress / Done
- Overdue open tasks highlighted in red

API SUMMARY
-----------
POST /api/auth/register
POST /api/auth/login
/api/users, /api/projects, /api/tasks — authenticated; admin rules per route files.

SUBMISSION
----------
Include: Live URL, GitHub repo link, README, 2–5 min demo video.
