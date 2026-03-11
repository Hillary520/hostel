import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation, BookingApplication, Invoice } from '../../types'

export function StudentDashboardPage() {
  const bookings = useQuery({
    queryKey: ['student-bookings'],
    queryFn: async () => asList<BookingApplication>((await api.get('/bookings/')).data),
  })
  const allocations = useQuery({
    queryKey: ['student-allocations'],
    queryFn: async () => asList<Allocation>((await api.get('/allocations/')).data),
  })
  const invoices = useQuery({
    queryKey: ['student-invoices'],
    queryFn: async () => asList<Invoice>((await api.get('/invoices/')).data),
  })

  const bookingCount = bookings.data?.length ?? 0
  const allocationCount = allocations.data?.length ?? 0
  const invoiceCount = invoices.data?.length ?? 0

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
