import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation } from '../../types'

interface BedOption {
  id: number
  room: number
  bed_no: string
  status: string
}

interface RoomOption {
  id: number
  hostel: number
  room_no: string
}

interface HostelOption {
  id: number
  code: string
  name: string
}

export function ManagerAllocationsPage() {
  const qc = useQueryClient()
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const allocations = useQuery({
    queryKey: ['manager-allocations'],
    queryFn: async () => asList<Allocation>((await api.get('/allocations/')).data),
  })
  const beds = useQuery({ queryKey: ['manager-beds'], queryFn: async () => asList<BedOption>((await api.get('/beds/')).data) })
  const rooms = useQuery({ queryKey: ['manager-rooms'], queryFn: async () => asList<RoomOption>((await api.get('/rooms/')).data) })
  const hostels = useQuery({
    queryKey: ['manager-hostels'],
    queryFn: async () => asList<HostelOption>((await api.get('/hostels/')).data),
  })

  const bedsById = useMemo(() => new Map(beds.data?.map((bed) => [bed.id, bed]) ?? []), [beds.data])
  const roomsById = useMemo(() => new Map(rooms.data?.map((room) => [room.id, room]) ?? []), [rooms.data])
  const hostelsById = useMemo(() => new Map(hostels.data?.map((hostel) => [hostel.id, hostel]) ?? []), [hostels.data])

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
              <tr key={allocation.id} className="row-clickable" onClick={() => setSelectedAllocation(allocation)}>
                <td>{allocation.id}</td>
                <td>{allocation.student}</td>
                <td>{allocation.bed}</td>
                <td>{allocation.status}</td>
                <td>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      checkInMutation.mutate(allocation.id)
                    }}
                    disabled={checkInMutation.isPending}
                  >
                    Check-in
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      vacateMutation.mutate(allocation.id)
                    }}
                    disabled={vacateMutation.isPending}
                  >
                    Vacate
                  </button>
                </td>
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
              const bed = bedsById.get(selectedAllocation.bed)
              const room = bed ? roomsById.get(bed.room) : null
              const hostel = room ? hostelsById.get(room.hostel) : null
              return [
                { label: 'Allocation ID', value: selectedAllocation.id },
                { label: 'Student ID', value: selectedAllocation.student },
                { label: 'Status', value: selectedAllocation.status },
                { label: 'Bed', value: bed ? `Bed ${bed.bed_no} (ID ${bed.id})` : selectedAllocation.bed },
                { label: 'Room', value: room ? `Room ${room.room_no} (ID ${room.id})` : '—' },
                { label: 'Hostel', value: hostel ? `${hostel.code} · ${hostel.name}` : '—' },
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
