import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BedDouble } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Allocation } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

export function StudentStatusPage() {
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const query = useQuery({
    queryKey: ['student-allocations'],
    queryFn: async () => asList<Allocation>((await api.get('/allocations/')).data),
  })

  const statusColors: Record<string, string> = {
    PENDING_CHECKIN: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    VACATED: 'bg-slate-100 text-slate-500',
    CANCELLED: 'bg-red-100 text-red-600',
  }

  return (
    <AppLayout title="Allocation Status">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BedDouble className="w-4 h-4" />
            My Room Allocations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Checkout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.map((allocation) => (
                <TableRow
                  key={allocation.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedAllocation(allocation)}
                >
                  <TableCell className="font-medium text-slate-500">#{allocation.id}</TableCell>
                  <TableCell className="font-medium">{allocation.bed}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[allocation.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {allocation.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{allocation.check_in_at || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{allocation.checkout_at || '—'}</TableCell>
                </TableRow>
              ))}
              {!query.data?.length && !query.isLoading && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No allocations found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
