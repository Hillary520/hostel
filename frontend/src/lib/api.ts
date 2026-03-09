import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken() {
  if (refreshing) return refreshing

  refreshing = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) return null
    try {
      const response = await axios.post(`${baseURL}/auth/refresh`, { refresh })
      const nextAccess = response.data.access as string
      const nextRefresh = (response.data.refresh as string) || refresh
      setTokens(nextAccess, nextRefresh)
      return nextAccess
    } catch {
      clearTokens()
      return null
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    original._retry = true
    const token = await refreshAccessToken()
    if (!token) {
      return Promise.reject(error)
    }

    original.headers.Authorization = `Bearer ${token}`
    return api.request(original)
  }
)
