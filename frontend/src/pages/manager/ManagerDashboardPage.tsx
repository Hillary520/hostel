import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export function ManagerDashboardPage() {
  const report = useQuery({ queryKey: ['occupancy-report'], queryFn: async () => (await api.get('/reports/occupancy')).data })
  return (
    <AppLayout title="Manager Dashboard">
      <Card>
        <CardHeader>
          <CardTitle>Occupancy summary</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
            {JSON.stringify(report.data?.summary || {}, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
