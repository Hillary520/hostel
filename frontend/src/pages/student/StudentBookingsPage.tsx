import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { BookingApplication } from '../../types'

interface HostelOption {
  id: number
  code: string
  name: string
  sex_restriction: string
}

export function StudentBookingsPage() {
  const [term, setTerm] = useState('2026-S1')
  const [preferredHostel, setPreferredHostel] = useState('')
  const [error, setError] = useState('')
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const qc = useQueryClient()

  const hostelsQuery = useQuery({
    queryKey: ['student-hostels'],
    queryFn: async () => asList<HostelOption>((await api.get('/hostels/?active=true')).data),
  })

  const bookingsQuery = useQuery({
    queryKey: ['student-bookings'],
    queryFn: async () => asList<BookingApplication>((await api.get('/bookings/')).data),
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post('/bookings/', {
        academic_term: term,
        preferred_hostel: preferredHostel ? Number(preferredHostel) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-bookings'] })
      setOpenCreateModal(false)
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/bookings/${id}/submit/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-bookings'] }),
  })

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!term.trim()) {
      setError('Academic term is required')
      return
    }
    if (preferredHostel && Number.isNaN(Number(preferredHostel))) {
      setError('Select a valid hostel')
      return
    }
    createMutation.mutate()
  }

  const hostelById = new Map(hostelsQuery.data?.map((hostel) => [hostel.id, hostel]) || [])

  return (
    <AppLayout title="My Bookings">
      <section className="card section-head">
        <div>
          <h3>Applications</h3>
          <p>Create and submit your accommodation request.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenCreateModal(true)}>
          New Booking
        </button>
      </section>

      <section className="card">
        {bookingsQuery.isLoading ? <p>Loading...</p> : null}
        <table>
          <thead>
            <tr><th>ID</th><th>Term</th><th>Preferred hostel</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {bookingsQuery.data?.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.academic_term}</td>
                <td>
                  {booking.preferred_hostel
                    ? `${hostelById.get(booking.preferred_hostel)?.code ?? 'Hostel'}`
                    : 'Any'}
                </td>
                <td>{booking.status}</td>
                <td>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={booking.status !== 'DRAFT' || submitMutation.isPending}
                    onClick={() => submitMutation.mutate(booking.id)}
                  >
                    Submit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openCreateModal} title="Create Booking" onClose={() => setOpenCreateModal(false)}>
        <form onSubmit={handleCreate}>
          <label>
            Academic term
            <input value={term} onChange={(e) => setTerm(e.target.value)} />
          </label>
          <label>
            Preferred hostel
            <select value={preferredHostel} onChange={(e) => setPreferredHostel(e.target.value)}>
              <option value="">Any hostel</option>
              {hostelsQuery.data?.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.code} · {hostel.name}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={createMutation.isPending}>
              Create booking
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
