import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

import { ProtectedRoute } from './ProtectedRoute'

const mockUseAuth = vi.fn()

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({ ready: true, isAuthenticated: false, user: null })

    render(
      <MemoryRouter initialEntries={['/student/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowRoles={['STUDENT']} />}>
            <Route path="/student/dashboard" element={<div>Student dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects role mismatch users to their home route', () => {
    mockUseAuth.mockReturnValue({
      ready: true,
      isAuthenticated: true,
      user: { role: 'STUDENT' },
    })

    render(
      <MemoryRouter initialEntries={['/portal/admin/users']}>
        <Routes>
          <Route element={<ProtectedRoute allowRoles={['ADMIN']} />}>
            <Route path="/portal/admin/users" element={<div>Admin page</div>} />
          </Route>
          <Route path="/student/dashboard" element={<div>Student home</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Student home')).toBeInTheDocument()
  })
})
