import { useQuery } from '@tanstack/react-query'
import { FileText, KeyRound, Receipt } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation, BookingApplication, Invoice } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bookingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Allocations</CardTitle>
            <KeyRound className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allocationCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{invoiceCount}</div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
