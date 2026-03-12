import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation } from '../../types'

export function StudentStatusPage() {
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
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
              <tr key={allocation.id} className="row-clickable" onClick={() => setSelectedAllocation(allocation)}>
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

      <DetailsModal
        open={selectedAllocation !== null}
        title={selectedAllocation ? `Allocation ${selectedAllocation.id}` : 'Allocation Details'}
        onClose={() => setSelectedAllocation(null)}
        sections={[
          {
            title: 'Allocation',
            items: (() => {
              if (!selectedAllocation) return []
              return [
                { label: 'Allocation ID', value: selectedAllocation.id },
                { label: 'Status', value: selectedAllocation.status },
                { label: 'Bed ID', value: selectedAllocation.bed },
                { label: 'Check-in due', value: selectedAllocation.check_in_due_date },
                { label: 'Expected checkout', value: selectedAllocation.expected_checkout_date },
                { label: 'Checked in at', value: selectedAllocation.check_in_at ?? '—' },
                { label: 'Checked out at', value: selectedAllocation.checkout_at ?? '—' },
              ]
            })(),
          },
        ]}
      />
    </AppLayout>
  )
}
