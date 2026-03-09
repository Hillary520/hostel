import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation } from '../../types'

export function StudentStatusPage() {
  const query = useQuery({
    queryKey: ['student-allocations'],
    queryFn: async () => asList<Allocation>((await api.get('/allocations/')).data),
  })

  return (
    <AppLayout title="Allocation Status">
      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Bed</th><th>Status</th><th>Check-in</th><th>Checkout</th></tr></thead>
          <tbody>
            {query.data?.map((allocation) => (
              <tr key={allocation.id}>
                <td>{allocation.id}</td>
                <td>{allocation.bed}</td>
                <td>{allocation.status}</td>
                <td>{allocation.check_in_at || '-'}</td>
                <td>{allocation.checkout_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  )
}
