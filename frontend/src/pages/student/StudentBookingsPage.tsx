import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
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
  const [submitError, setSubmitError] = useState('')
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingApplication | null>(null)
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
      setError('')
    },
    onError: (err) => {
      setError(extractErrorMessage(err, 'Unable to create booking. Please try again.'))
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/bookings/${id}/submit/`),
    onMutate: () => setSubmitError(''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-bookings'] })
      setSubmitError('')
    },
    onError: (err) => {
      setSubmitError(extractErrorMessage(err, 'Unable to submit booking. Please try again.'))
    },
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
        {submitError ? <p className="error">{submitError}</p> : null}
        {bookingsQuery.isLoading ? <p>Loading...</p> : null}
        <table>
          <thead>
            <tr><th>ID</th><th>Term</th><th>Preferred hostel</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {bookingsQuery.data?.map((booking) => (
              <tr key={booking.id} className="row-clickable" onClick={() => setSelectedBooking(booking)}>
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
                    onClick={(event) => {
                      event.stopPropagation()
                      submitMutation.mutate(booking.id)
                    }}
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

      <DetailsModal
        open={selectedBooking !== null}
        title={selectedBooking ? `Booking ${selectedBooking.id}` : 'Booking Details'}
        onClose={() => setSelectedBooking(null)}
        sections={[
          {
            title: 'Booking',
            items: [
              { label: 'Booking ID', value: selectedBooking?.id },
              { label: 'Term', value: selectedBooking?.academic_term },
              { label: 'Status', value: selectedBooking?.status },
              {
                label: 'Preferred hostel',
                value: selectedBooking?.preferred_hostel
                  ? hostelById.get(selectedBooking.preferred_hostel)?.code ?? selectedBooking.preferred_hostel
                  : 'Any',
              },
              { label: 'Submitted at', value: selectedBooking?.submitted_at ?? '—' },
              { label: 'Created at', value: selectedBooking?.created_at },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback
  if (typeof error === 'string') return error
  const message = (error as { message?: string }).message
  if (message) return message
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const detail = (data as { detail?: string | string[] }).detail
    if (detail) return Array.isArray(detail) ? detail.join(', ') : detail
    const nonField = (data as { non_field_errors?: string[] }).non_field_errors
    if (nonField?.length) return nonField.join(', ')
  }
  return fallback
}
