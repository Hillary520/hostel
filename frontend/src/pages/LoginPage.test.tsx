import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { LoginPage } from './LoginPage'

const mockUseAuth = vi.fn()

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('LoginPage', () => {
  it('shows required validation', async () => {
    mockUseAuth.mockReturnValue({ user: null, login: vi.fn() })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByText('Email and password are required')).toBeInTheDocument()
  })

  it('calls login when inputs are valid', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({ user: null, login })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Admin123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin@example.com', 'Admin123!')
    })
  })
})
