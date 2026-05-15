# Team Task Manager (Full-Stack)

Production-ready **Express + MongoDB** REST API with a **React (Vite)** client, **JWT authentication**, **role-based access (Admin / Member)**, **project & team membership**, **Kanban dashboard**, and **overdue task highlighting** tied to the browser clock.

Built to match typical internship / full-stack assessment rubrics (auth, CRUD, RBAC, validations, deployment).

---

## Live demo (Railway)

Deploy from this repo on **Railway** (required for many assessments):

1. Create a **MongoDB** database (Railway plugin or MongoDB Atlas) and copy `MONGODB_URI`.
2. Create a **new project → Deploy from GitHub** (this repo).
3. Set **Root directory** to `team-task-manager` if the repo contains that folder at the top level (or move these files to repo root).
4. **Variables** (production):

   | Variable | Example |
   |----------|---------|
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `JWT_SECRET` | long random string |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | your Railway public URL (optional if same-origin) |

5. **Build command:** `npm install && npm run build`  
   **Start command:** `npm start`

The server serves the built React app from `client/dist` and mounts APIs at `/api/*`, so your **single public URL** loads the UI and talks to `/api` on the same host (no CORS issues).

**First account:** open `/register`. If the database is empty, the **first registered user becomes Admin** (see `server/src/routes/auth.js`). Use that account to create projects, invite users, and publish tasks.

---

## Local development

Requirements: **Node 20+**, **MongoDB** locally or Atlas.

```bash
cd team-task-manager
cp server/.env.example server/.env   # edit MONGODB_URI + JWT_SECRET
npm install
npm run dev
```

- API: `http://localhost:5000` (set `PORT` in `server/.env` if 5000 is taken on macOS by AirPlay)
- Client (dev): Vite default port with proxy to API (`client/vite.config.js`)

Or run `npm run dev` from project root (Express + Vite via `concurrently`).

---

## Feature checklist (for reviewers)

| Area | Behaviour |
|------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, JWT `Authorization: Bearer` |
| **RBAC** | **Admin:** full users/projects/tasks. **Member:** read scoped projects/tasks; **only** `PATCH`/`PUT` task **status** on **own assigned** tasks |
| **Projects** | Owner + members array; relationships populated on reads |
| **Tasks** | Required `dueDate`, status enum (`todo`, `in_progress`, `done`, `blocked`), assignee + project refs |
| **Dashboard** | Kanban: To Do (incl. blocked), In Progress, Done; **overdue** (not done & past due) in **red**; stats strip |
| **Admin UI** | Tabs: projects + member roster, invite users, create/list/delete tasks |
| **Security** | Bcrypt passwords, JWT, Mongoose validations |

---

## REST API (summary)

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/users` (admin rules apply)
- `GET|POST|PUT|DELETE /api/projects`
- `GET|POST|PUT|PATCH|DELETE /api/tasks`

See route files under `server/src/routes/`.

---

## Demo video (2–5 min) — suggested script

1. Show **live URL** and **GitHub** in the browser tab bar.
2. **Register** first user → lands as **Admin** on dashboard (empty state).
3. **Workspace (Admin):** create **project**, add **members**, **invite** another user (Member), create **task** with due date in the **past** → shows **red** on dashboard when still open.
4. Log in as **Member** in another window/incognito: see board, **cannot** open Admin workspace; **can** change **status** only on **assigned** task.
5. Mention **MongoDB**, **JWT**, **RBAC**, **Railway** env vars.

---

## Submission bundle

- **Live URL** — Railway deployment root URL  
- **GitHub** — this repository  
- **README** — this file (`README.md`) and `README.txt` (plain text for form uploads)  
- **Demo video** — screen recording with voice-over  

Good luck—you’ve got a complete vertical stack to show.
