import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'team-task-manager-auth'

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { token: null, user: null }
    }
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.user) {
      return { token: parsed.token, user: parsed.user }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(readStoredAuth)

  useEffect(() => {
    if (token && user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [token, user])

  const login = useCallback((nextToken, nextUser) => {
    setAuth({ token: nextToken, user: nextUser })
  }, [])

  const logout = useCallback(() => {
    setAuth({ token: null, user: null })
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role ?? null,
      login,
      logout,
    }),
    [token, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
