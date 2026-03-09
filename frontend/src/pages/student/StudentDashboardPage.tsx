import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'

export function StudentDashboardPage() {
  const bookings = useQuery({ queryKey: ['student-bookings'], queryFn: async () => (await api.get('/bookings/')).data })
  const allocations = useQuery({ queryKey: ['student-allocations'], queryFn: async () => (await api.get('/allocations/')).data })
  const invoices = useQuery({ queryKey: ['student-invoices'], queryFn: async () => (await api.get('/invoices/')).data })

  const bookingCount = bookings.data?.results?.length ?? 0
  const allocationCount = allocations.data?.results?.length ?? 0
  const invoiceCount = invoices.data?.results?.length ?? 0

  return (
    <AppLayout title="Student Dashboard">
      <div className="grid-3">
        <article className="card stat"><h3>Bookings</h3><p>{bookingCount}</p></article>
        <article className="card stat"><h3>Allocations</h3><p>{allocationCount}</p></article>
        <article className="card stat"><h3>Invoices</h3><p>{invoiceCount}</p></article>
      </div>
    </AppLayout>
  )
}
