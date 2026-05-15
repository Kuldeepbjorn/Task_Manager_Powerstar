function getBaseUrl() {
  const env = import.meta.env.VITE_API_URL
  if (env && String(env).trim() !== '') {
    return String(env).replace(/\/$/, '')
  }
  return ''
}

export function apiUrl(path) {
  const prefix = getBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${prefix}${p}`
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function handleJson(res) {
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export async function authFetch(token, path, options = {}) {
  const headers = {
    ...options.headers,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const isForm = options.body instanceof FormData
  if (!isForm && options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
    body:
      isForm || options.body === undefined
        ? options.body
        : typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body),
  })
  if (res.status === 204) return null
  return handleJson(res)
}

export async function loginRequest(email, password) {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleJson(res)
}

export async function registerRequest(name, email, password) {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  return handleJson(res)
}

export function fetchTasks(token) {
  return authFetch(token, '/api/tasks', { method: 'GET' })
}

export function patchTask(token, taskId, body) {
  return authFetch(token, `/api/tasks/${taskId}`, { method: 'PATCH', body })
}

export function createTask(token, body) {
  return authFetch(token, '/api/tasks', { method: 'POST', body })
}

export function deleteTask(token, taskId) {
  return authFetch(token, `/api/tasks/${taskId}`, { method: 'DELETE' })
}

export function fetchProjects(token) {
  return authFetch(token, '/api/projects', { method: 'GET' })
}

export function createProject(token, body) {
  return authFetch(token, '/api/projects', { method: 'POST', body })
}

export function updateProject(token, projectId, body) {
  return authFetch(token, `/api/projects/${projectId}`, { method: 'PUT', body })
}

export function deleteProject(token, projectId) {
  return authFetch(token, `/api/projects/${projectId}`, { method: 'DELETE' })
}

export function fetchUsers(token) {
  return authFetch(token, '/api/users', { method: 'GET' })
}

export function createUser(token, body) {
  return authFetch(token, '/api/users', { method: 'POST', body })
}
