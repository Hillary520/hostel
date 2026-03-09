import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

interface VisitorLog {
  id: number
  allocation: number
  visitor_name: string
  id_number: string
  phone: string
  check_in: string
}

export function ManagerVisitorsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ allocation: '', visitor_name: '', id_number: '', phone: '' })
  const [openVisitorModal, setOpenVisitorModal] = useState(false)

  const logs = useQuery({ queryKey: ['visitors'], queryFn: async () => asList<VisitorLog>((await api.get('/visitors/')).data) })

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
      <section className="card section-head">
        <div>
          <h3>Visitor Register</h3>
          <p>Log guest entries linked to active allocations.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenVisitorModal(true)}>
          Add Visitor
        </button>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Allocation</th><th>Check-in</th></tr></thead>
          <tbody>
            {logs.data?.map((log) => (
              <tr key={log.id}><td>{log.id}</td><td>{log.visitor_name}</td><td>{log.allocation}</td><td>{log.check_in}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openVisitorModal} title="Add Visitor" onClose={() => setOpenVisitorModal(false)}>
        <form onSubmit={onSubmit}>
          <label>
            Allocation ID
            <input value={form.allocation} onChange={(e) => setForm({ ...form, allocation: e.target.value })} />
          </label>
          <label>
            Visitor name
            <input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} />
          </label>
          <label>
            ID number
            <input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenVisitorModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={create.isPending}>
              Save visitor
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
