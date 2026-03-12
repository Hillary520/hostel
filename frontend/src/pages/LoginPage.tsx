import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { homeForRole } from '../components/ProtectedRoute'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  if (user) {
    return <Navigate to={fromPath ?? homeForRole(user.role)} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setBusy(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid credentials')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel card">
        <section className="auth-intro">
          <p className="brand-kicker">Campus Operations Portal</p>
          <h2>Sign in</h2>
          <p>Manage room allocation, payments, and resident operations from one workspace.</p>
        </section>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button disabled={busy} type="submit">
            {busy ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
