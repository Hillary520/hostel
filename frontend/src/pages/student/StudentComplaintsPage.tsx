import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

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

  return (
    <AppLayout title="Complaints">
      <section className="card section-head">
        <div>
          <h3>My Complaints</h3>
          <p>Raise maintenance issues for hostel follow-up.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenComplaintModal(true)}>
          Raise Complaint
        </button>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Category</th><th>Priority</th><th>Status</th><th>Description</th><th>Created</th></tr></thead>
          <tbody>
            {complaints.data?.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.category}</td>
                <td>{ticket.priority}</td>
                <td>{ticket.status}</td>
                <td>{ticket.description}</td>
                <td>{new Date(ticket.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openComplaintModal} title="Raise Complaint" onClose={() => setOpenComplaintModal(false)}>
        <form onSubmit={onSubmit}>
          <label>
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenComplaintModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={createComplaint.isPending}>
              Submit complaint
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
