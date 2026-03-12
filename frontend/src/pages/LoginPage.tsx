import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Building2, KeyRound } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { homeForRole } from '../components/ProtectedRoute'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

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
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center px-16 bg-zinc-900 text-zinc-50">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-10 text-primary-foreground">
            <Building2 className="w-10 h-10" />
            <h1 className="text-3xl font-bold tracking-tight">UnivResidence</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Campus Operations Portal</h2>
          <p className="text-zinc-400 text-lg">
            Manage room allocation, payments, and resident operations securely from one unified workspace.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-zinc-50 lg:bg-white">
        <Card className="w-full max-w-md shadow-xl border-0 lg:border lg:shadow-sm">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex justify-center mb-4 lg:hidden text-primary">
              <Building2 className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Please enter your credentials to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={busy}>
                {busy ? (
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 animate-pulse" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground mt-4">
            Secured by Campus IT
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
