import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, UserPlus } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface VisitorLog {
  id: number
  allocation: number
  visitor_name: string
  id_number: string
  phone: string
  check_in: string
}

interface AllocationOption {
  id: number
  student: number
  bed: number
  status: string
}

export function ManagerVisitorsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ allocation: '', visitor_name: '', id_number: '', phone: '' })
  const [openVisitorModal, setOpenVisitorModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<VisitorLog | null>(null)

  const logs = useQuery({ queryKey: ['visitors'], queryFn: async () => asList<VisitorLog>((await api.get('/visitors/')).data) })
  const allocations = useQuery({
    queryKey: ['manager-allocations', 'active'],
    queryFn: async () => asList<AllocationOption>((await api.get('/allocations/?status=ACTIVE')).data),
  })

  const allocationsById = useMemo(
    () => new Map(allocations.data?.map((allocation) => [allocation.id, allocation]) ?? []),
    [allocations.data]
  )

  const create = useMutation({
    mutationFn: async () =>
      api.post('/visitors/', {
        ...form,
        allocation: Number(form.allocation),
        check_in: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
      setForm({ allocation: '', visitor_name: '', id_number: '', phone: '' })
      setOpenVisitorModal(false)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <AppLayout title="Visitor Logs">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Visitor Register</h3>
            <p className="text-sm text-gray-500">Log guest entries linked to active room allocations.</p>
          </div>
          <Button onClick={() => setOpenVisitorModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Visitor
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Visitor Name</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead>Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data?.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="font-medium text-slate-500">#{log.id}</TableCell>
                    <TableCell className="font-medium">{log.visitor_name}</TableCell>
                    <TableCell>Allocation #{log.allocation}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(log.check_in).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!logs.data?.length && !logs.isLoading && (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No visitor logs found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal open={openVisitorModal} title="Log a Visitor" onClose={() => setOpenVisitorModal(false)}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Allocation</Label>
            <Select value={form.allocation || 'none'} onValueChange={(v) => setForm({ ...form, allocation: v === 'none' ? '' : (v || '') })}>
              <SelectTrigger><SelectValue placeholder="Select allocation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select allocation</SelectItem>
                {allocations.data?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    Allocation #{a.id} · Student {a.student} · Bed {a.bed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vname">Visitor Name</Label>
            <Input id="vname" value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idnum">ID Number</Label>
              <Input id="idnum" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenVisitorModal(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !form.allocation}>
              <UserPlus className="w-4 h-4 mr-2" />
              {create.isPending ? 'Saving...' : 'Save Visitor'}
            </Button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedLog !== null}
        title={selectedLog ? `Visitor ${selectedLog.visitor_name}` : 'Visitor Details'}
        onClose={() => setSelectedLog(null)}
        sections={[
          {
            title: 'Visit',
            items: (() => {
              if (!selectedLog) return []
              const allocation = allocationsById.get(selectedLog.allocation)
              return [
                { label: 'Visitor', value: selectedLog.visitor_name },
                { label: 'ID number', value: selectedLog.id_number },
                { label: 'Phone', value: selectedLog.phone },
                { label: 'Check-in', value: selectedLog.check_in },
                { label: 'Allocation', value: selectedLog.allocation },
                { label: 'Allocation status', value: allocation?.status ?? '—' },
                { label: 'Student ID', value: allocation?.student ?? '—' },
                { label: 'Bed ID', value: allocation?.bed ?? '—' },
              ]
            })(),
          },
        ]}
      />
    </AppLayout>
  )
}
