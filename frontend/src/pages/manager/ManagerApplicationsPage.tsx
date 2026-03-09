import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { BookingApplication } from '../../types'

export function ManagerApplicationsPage() {
  const qc = useQueryClient()
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null)
  const [bedId, setBedId] = useState('')
  const [checkInDueDate, setCheckInDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(() =>
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10)
  )

  const applications = useQuery({
    queryKey: ['manager-applications'],
    queryFn: async () => asList<BookingApplication>((await api.get('/bookings/?status=SUBMITTED')).data),
  })

  const targetApplication = useMemo(
    () => applications.data?.find((item) => item.id === approveTargetId) ?? null,
    [applications.data, approveTargetId]
  )

  const approveMutation = useMutation({
    mutationFn: async (payload: { bookingId: number; bed: number; checkInDueDate: string; expectedCheckoutDate: string }) =>
      api.post(`/bookings/${payload.bookingId}/approve/`, {
        bed: payload.bed,
        check_in_due_date: payload.checkInDueDate,
        expected_checkout_date: payload.expectedCheckoutDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-applications'] })
      setApproveTargetId(null)
      setBedId('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (bookingId: number) => api.post(`/bookings/${bookingId}/reject/`, { reason: 'Capacity exhausted' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-applications'] }),
  })

  function onApproveSubmit(event: FormEvent) {
    event.preventDefault()
    if (!approveTargetId || !bedId) return
    approveMutation.mutate({
      bookingId: approveTargetId,
      bed: Number(bedId),
      checkInDueDate,
      expectedCheckoutDate,
    })
  }

  return (
    <AppLayout title="Applications Review">
      <section className="card">
        <h3>Pending Applications</h3>
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Term</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {applications.data?.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.student}</td>
                <td>{item.academic_term}</td>
                <td>{item.status}</td>
                <td>
                  <div className="inline-actions">
                    <button className="btn btn-solid" type="button" onClick={() => setApproveTargetId(item.id)}>
                      Approve
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => rejectMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={approveTargetId !== null} title="Approve Application" onClose={() => setApproveTargetId(null)}>
        <form onSubmit={onApproveSubmit}>
          <label>
            Application ID
            <input value={targetApplication?.id ?? ''} disabled readOnly />
          </label>
          <label>
            Bed ID
            <input value={bedId} onChange={(e) => setBedId(e.target.value)} />
          </label>
          <label>
            Check-in Due Date
            <input type="date" value={checkInDueDate} onChange={(e) => setCheckInDueDate(e.target.value)} />
          </label>
          <label>
            Expected Checkout Date
            <input type="date" value={expectedCheckoutDate} onChange={(e) => setExpectedCheckoutDate(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setApproveTargetId(null)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={!bedId || approveMutation.isPending}>
              Approve booking
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
