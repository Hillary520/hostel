import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'

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

interface Complaint {
  id: number
  category: string
  priority: string
  status: string
  description: string
  created_at: string
}

export function StudentComplaintsPage() {
  const qc = useQueryClient()
  const [openComplaintModal, setOpenComplaintModal] = useState(false)
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)

  const complaints = useQuery({
    queryKey: ['student-complaints'],
    queryFn: async () => asList<Complaint>((await api.get('/maintenance-tickets/')).data),
  })

  const createComplaint = useMutation({
    mutationFn: async () =>
      api.post('/maintenance-tickets/', {
        category,
        priority,
        description,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-complaints'] })
      setDescription('')
      setOpenComplaintModal(false)
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!description.trim()) return
    createComplaint.mutate()
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  }

  return (
    <AppLayout title="Complaints">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">My Complaints</h3>
            <p className="text-sm text-gray-500">Raise and track maintenance issues for hostel follow-up.</p>
          </div>
          <Button onClick={() => setOpenComplaintModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Raise Complaint
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.data?.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedComplaint(ticket)}
                  >
                    <TableCell className="font-medium text-slate-500">#{ticket.id}</TableCell>
                    <TableCell className="font-medium">{ticket.category}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>{ticket.status}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{ticket.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!complaints.data?.length && !complaints.isLoading && (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No complaints filed yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal open={openComplaintModal} title="Raise a Complaint" onClose={() => setOpenComplaintModal(false)}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Plumbing, Electrical" required />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenComplaintModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createComplaint.isPending}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              {createComplaint.isPending ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedComplaint !== null}
        title={selectedComplaint ? `Complaint ${selectedComplaint.id}` : 'Complaint Details'}
        onClose={() => setSelectedComplaint(null)}
        sections={[
          {
            title: 'Complaint',
            items: [
              { label: 'Complaint ID', value: selectedComplaint?.id },
              { label: 'Category', value: selectedComplaint?.category },
              { label: 'Priority', value: selectedComplaint?.priority },
              { label: 'Status', value: selectedComplaint?.status },
              { label: 'Description', value: selectedComplaint?.description },
              { label: 'Created at', value: selectedComplaint ? new Date(selectedComplaint.created_at).toLocaleString() : '—' },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
