import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation } from '../../types'

export function ManagerAllocationsPage() {
  const qc = useQueryClient()
  const allocations = useQuery({
    queryKey: ['manager-allocations'],
    queryFn: async () => asList<Allocation>((await api.get('/allocations/')).data),
  })

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/allocations/${id}/check_in/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-allocations'] }),
  })
  const vacateMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/allocations/${id}/vacate/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-allocations'] }),
  })

  return (
    <AppLayout title="Allocations">
      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Bed</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {allocations.data?.map((allocation) => (
              <tr key={allocation.id}>
                <td>{allocation.id}</td>
                <td>{allocation.student}</td>
                <td>{allocation.bed}</td>
                <td>{allocation.status}</td>
                <td>
                  <button onClick={() => checkInMutation.mutate(allocation.id)} disabled={checkInMutation.isPending}>Check-in</button>
                  <button onClick={() => vacateMutation.mutate(allocation.id)} disabled={vacateMutation.isPending}>Vacate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  )
}
