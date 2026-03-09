import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'

export function ManagerDashboardPage() {
  const report = useQuery({ queryKey: ['occupancy-report'], queryFn: async () => (await api.get('/reports/occupancy')).data })
  return (
    <AppLayout title="Manager Dashboard">
      <section className="card">
        <h3>Occupancy summary</h3>
        <pre>{JSON.stringify(report.data?.summary || {}, null, 2)}</pre>
      </section>
    </AppLayout>
  )
}
