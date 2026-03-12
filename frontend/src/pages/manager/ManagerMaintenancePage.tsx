import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

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

  return (
    <AppLayout title="Maintenance">
      <section className="card section-head">
        <div>
          <h3>Maintenance Tickets</h3>
          <p>Create and track hostel issue tickets.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenTicketModal(true)}>
          Open Ticket
        </button>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Category</th><th>Priority</th><th>Status</th><th>Description</th></tr></thead>
          <tbody>
            {tickets.data?.map((ticket) => (
              <tr key={ticket.id} className="row-clickable" onClick={() => setSelectedTicket(ticket)}>
                <td>{ticket.id}</td><td>{ticket.category}</td><td>{ticket.priority}</td><td>{ticket.status}</td><td>{ticket.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openTicketModal} title="Open Maintenance Ticket" onClose={() => setOpenTicketModal(false)}>
        <form onSubmit={onSubmit}>
          <label>
            Category
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenTicketModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={create.isPending}>
              Submit ticket
            </button>
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
