import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'

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
      <section className="grid-3">
        <article className="card stat">
          <h3>Total Allocations</h3>
          <p>{occSummary?.total_allocations ?? 0}</p>
        </article>
        <article className="card stat">
          <h3>Active Allocations</h3>
          <p>{occSummary?.active_allocations ?? 0}</p>
        </article>
        <article className="card stat">
          <h3>Pending Check-in</h3>
          <p>{occSummary?.pending_checkin_allocations ?? 0}</p>
        </article>
      </section>

      <section className="card">
        <h3>Occupancy by Hostel</h3>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Hostel</th>
              <th>Allocated Beds</th>
            </tr>
          </thead>
          <tbody>
            {occupancy.data?.by_hostel?.map((item) => (
              <tr key={item.bed__room__hostel__id}>
                <td>{item.bed__room__hostel__code}</td>
                <td>{item.bed__room__hostel__name}</td>
                <td>{item.allocated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Finance Summary</h3>
        <div className="grid-3">
          <article className="metric-tile">
            <h3>Total Invoices</h3>
            <p>{financeSummary?.invoices_count ?? 0}</p>
          </article>
          <article className="metric-tile">
            <h3>Total Due (UGX)</h3>
            <p>{financeSummary?.total_amount_due ?? 0}</p>
          </article>
          <article className="metric-tile">
            <h3>Defaulters</h3>
            <p>{defaulters.data?.count ?? 0}</p>
          </article>
        </div>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {finance.data?.by_status?.map((item) => (
              <tr key={item.status}>
                <td>{item.status}</td>
                <td>{item.count}</td>
                <td>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Defaulters</h3>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Term</th>
              <th>Due Date</th>
              <th>Amount Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {defaulters.data?.results?.map((item) => (
              <tr key={item.id}>
                <td>{item.student__full_name}</td>
                <td>{item.student__email}</td>
                <td>{item.term}</td>
                <td>{item.due_date}</td>
                <td>{item.amount_due}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  )
}
