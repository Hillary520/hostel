import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

import { api } from '../lib/api'
import { ManagerApplicationsPage } from './manager/ManagerApplicationsPage'
import { StudentBookingsPage } from './student/StudentBookingsPage'

const mockUseAuth = vi.fn()

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function renderWithProviders(node: ReactNode) {
  const queryClient = new QueryClient()
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Workflow UI paths', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { role: 'STUDENT', full_name: 'Student User' },
      logout: vi.fn(),
    })
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  it('submits student booking form', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/bookings/') {
        return Promise.resolve({
          data: {
            results: [{ id: 1, student: 1, academic_term: '2026-S1', status: 'DRAFT', created_at: '2026-01-01' }],
          },
        })
      }
      if (url === '/hostels/?active=true') {
        return Promise.resolve({ data: { results: [] } })
      }
      return Promise.resolve({ data: { results: [] } })
    })
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    renderWithProviders(<StudentBookingsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'New Booking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Create booking' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/bookings/', { academic_term: '2026-S1' })
    })
  })

  it('approves submitted booking from manager page', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'HOSTEL_MANAGER', full_name: 'Manager User' },
      logout: vi.fn(),
    })
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/bookings/?status=SUBMITTED') {
        return Promise.resolve({
          data: {
            results: [{ id: 2, student: 10, academic_term: '2026-S1', status: 'SUBMITTED', created_at: '2026-01-01' }],
          },
        })
      }
      if (url === '/rooms/?status=ACTIVE') {
        return Promise.resolve({
          data: {
            results: [{ id: 1, room_no: 'A1', status: 'ACTIVE' }],
          },
        })
      }
      if (url === '/beds/?status=AVAILABLE') {
        return Promise.resolve({
          data: {
            results: [{ id: 9, room: 1, bed_no: '1', status: 'AVAILABLE' }],
          },
        })
      }
      if (url === '/hostels/') {
        return Promise.resolve({
          data: {
            results: [{ id: 1, code: 'H1', name: 'Hostel 1' }],
          },
        })
      }
      if (url === '/room-types/') {
        return Promise.resolve({
          data: {
            results: [{ id: 1, code: 'STD', name: 'Standard' }],
          },
        })
      }
      return Promise.resolve({ data: { results: [] } })
    })
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    renderWithProviders(<ManagerApplicationsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    fireEvent.change(await screen.findByLabelText('Room'), { target: { value: '1' } })
    fireEvent.change(await screen.findByLabelText('Bed'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Approve booking' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/bookings/2/approve/',
        expect.objectContaining({
          bed: 9,
        })
      )
    })
  })
})
