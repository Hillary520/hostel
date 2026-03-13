import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Wrench } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface Ticket {
  id: number
  category: string
  priority: string
  status: string
  description: string
}

export function ManagerMaintenancePage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('Electrical')
  const [description, setDescription] = useState('')
  const [openTicketModal, setOpenTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const tickets = useQuery({
    queryKey: ['maintenance-tickets'],
    queryFn: async () => asList<Ticket>((await api.get('/maintenance-tickets/')).data),
  })

  const create = useMutation({
    mutationFn: async () => api.post('/maintenance-tickets/', { category, description, priority: 'MEDIUM' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-tickets'] })
      setDescription('')
      setOpenTicketModal(false)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  }

  return (
    <AppLayout title="Maintenance">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Maintenance Tickets</h3>
            <p className="text-sm text-gray-500">Create and track hostel issue tickets.</p>
          </div>
          <Button onClick={() => setOpenTicketModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Open Ticket
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.data?.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
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
                  </TableRow>
                ))}
                {!tickets.data?.length && !tickets.isLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No maintenance tickets found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal width="lg" open={openTicketModal} title="Open Maintenance Ticket" onClose={() => setOpenTicketModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electrical, Plumbing, Cleaning" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              required
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenTicketModal(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              <Wrench className="w-4 h-4 mr-2" />
              {create.isPending ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedTicket !== null}
        title={selectedTicket ? `Ticket ${selectedTicket.id}` : 'Ticket Details'}
        onClose={() => setSelectedTicket(null)}
        sections={[
          {
            title: 'Ticket',
            items: [
              { label: 'Ticket ID', value: selectedTicket?.id },
              { label: 'Category', value: selectedTicket?.category },
              { label: 'Priority', value: selectedTicket?.priority },
              { label: 'Status', value: selectedTicket?.status },
              { label: 'Description', value: selectedTicket?.description },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
