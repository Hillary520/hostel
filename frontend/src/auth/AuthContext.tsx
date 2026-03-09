import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { api } from '../lib/api'
import {
  clearStoredUser,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from '../lib/tokenStorage'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  ready: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const access = getAccessToken()
    const refresh = getRefreshToken()
    if (!access || !refresh) {
      setReady(true)
      return
    }

    api
      .get<AuthUser>('/auth/me')
      .then((res) => {
        setUser(res.data)
        setStoredUser(res.data)
      })
      .catch(() => {
        clearTokens()
        clearStoredUser()
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    setTokens(response.data.access, response.data.refresh)
    setStoredUser(response.data.user)
    setUser(response.data.user)
  }

  async function logout() {
    const refresh = getRefreshToken()
    if (refresh) {
      try {
        await api.post('/auth/logout', { refresh })
      } catch {
        // best effort on logout
      }
    }
    clearTokens()
    clearStoredUser()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
