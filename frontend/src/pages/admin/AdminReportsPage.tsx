import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface OccupancyResponse {
  summary: {
    total_allocations: number
    active_allocations: number
    pending_checkin_allocations: number
    vacated_allocations: number
  }
  by_hostel: Array<{
    bed__room__hostel__id: number
    bed__room__hostel__name: string
    bed__room__hostel__code: string
    allocated: number
  }>
}

interface FinanceResponse {
  summary: {
    invoices_count: number
    total_amount_due: number
  }
  by_status: Array<{
    status: string
    count: number
    total: number
  }>
}

interface DefaultersResponse {
  count: number
  results: Array<{
    id: number
    student__full_name: string
    student__email: string
    term: string
    amount_due: number
    due_date: string
    status: string
  }>
}

export function AdminReportsPage() {
  const occupancy = useQuery({
    queryKey: ['report-occupancy'],
    queryFn: async () => (await api.get<OccupancyResponse>('/reports/occupancy')).data,
  })
  const finance = useQuery({
    queryKey: ['report-finance'],
    queryFn: async () => (await api.get<FinanceResponse>('/reports/finance')).data,
  })
  const defaulters = useQuery({
    queryKey: ['report-defaulters'],
    queryFn: async () => (await api.get<DefaultersResponse>('/reports/defaulters')).data,
  })

  const occSummary = occupancy.data?.summary
  const financeSummary = finance.data?.summary

  return (
    <AppLayout title="Reports">
      <div className="space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{occSummary?.total_allocations ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{occSummary?.active_allocations ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Check-in</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{occSummary?.pending_checkin_allocations ?? 0}</div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy by Hostel</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Allocated Beds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupancy.data?.by_hostel?.map((item) => (
                  <TableRow key={item.bed__room__hostel__id}>
                    <TableCell className="font-medium">{item.bed__room__hostel__code}</TableCell>
                    <TableCell>{item.bed__room__hostel__name}</TableCell>
                    <TableCell>{item.allocated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Invoices</h3>
                <p className="text-2xl font-bold">{financeSummary?.invoices_count ?? 0}</p>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Due (UGX)</h3>
                <p className="text-2xl font-bold">{financeSummary?.total_amount_due ?? 0}</p>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Defaulters</h3>
                <p className="text-2xl font-bold text-destructive">{defaulters.data?.count ?? 0}</p>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.data?.by_status?.map((item) => (
                  <TableRow key={item.status}>
                    <TableCell className="font-medium capitalize">{item.status.toLowerCase()}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defaulters</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulters.data?.results?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.student__full_name}</TableCell>
                    <TableCell>{item.student__email}</TableCell>
                    <TableCell>{item.term}</TableCell>
                    <TableCell>{item.due_date}</TableCell>
                    <TableCell className="text-destructive font-bold">{item.amount_due}</TableCell>
                    <TableCell>{item.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
