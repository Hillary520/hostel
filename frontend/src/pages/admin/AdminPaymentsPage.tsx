import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

interface InvoiceRow {
  id: number
  student: number
  term: string
  amount_due: string
  due_date: string
  status: string
}

export function AdminPaymentsPage() {
  const qc = useQueryClient()
  const [targetInvoiceId, setTargetInvoiceId] = useState<number | null>(null)
  const [nextStatus, setNextStatus] = useState<'PENDING' | 'PAID'>('PENDING')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)

  const invoices = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: async () => asList<InvoiceRow>((await api.get('/invoices/')).data),
  })

  const targetInvoice = useMemo(
    () => invoices.data?.find((item) => item.id === targetInvoiceId) ?? null,
    [invoices.data, targetInvoiceId]
  )

  const updateStatus = useMutation({
    mutationFn: async (payload: { invoiceId: number; status: 'PENDING' | 'PAID' }) =>
      api.post(`/invoices/${payload.invoiceId}/status/`, { status: payload.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-invoices'] })
      setTargetInvoiceId(null)
    },
  })

  function openStatusModal(invoice: InvoiceRow) {
    setTargetInvoiceId(invoice.id)
    setNextStatus(invoice.status === 'PAID' ? 'PAID' : 'PENDING')
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!targetInvoiceId) return
    updateStatus.mutate({ invoiceId: targetInvoiceId, status: nextStatus })
  }

  return (
    <AppLayout title="Payments Control">
      <section className="card">
        <h3>Simulated Payment Status</h3>
        <p>Per policy, Accounts Office handles payments. Admins update portal status as pending or paid.</p>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>Invoice ID</th><th>Student ID</th><th>Term</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {invoices.data?.map((invoice) => (
              <tr key={invoice.id} className="row-clickable" onClick={() => setSelectedInvoice(invoice)}>
                <td>{invoice.id}</td>
                <td>{invoice.student}</td>
                <td>{invoice.term}</td>
                <td>{invoice.amount_due}</td>
                <td>{invoice.due_date}</td>
                <td>{invoice.status}</td>
                <td>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openStatusModal(invoice)
                    }}
                  >
                    Update status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={targetInvoiceId !== null} title="Update Payment Status" onClose={() => setTargetInvoiceId(null)}>
        <form onSubmit={onSubmit}>
          <label>
            Invoice ID
            <input value={targetInvoice?.id ?? ''} disabled readOnly />
          </label>
          <label>
            Status
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as 'PENDING' | 'PAID')}>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setTargetInvoiceId(null)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={updateStatus.isPending}>
              Save status
            </button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedInvoice !== null}
        title={selectedInvoice ? `Invoice ${selectedInvoice.id}` : 'Invoice Details'}
        onClose={() => setSelectedInvoice(null)}
        sections={[
          {
            title: 'Invoice',
            items: [
              { label: 'Invoice ID', value: selectedInvoice?.id },
              { label: 'Student ID', value: selectedInvoice?.student },
              { label: 'Term', value: selectedInvoice?.term },
              { label: 'Amount', value: selectedInvoice?.amount_due },
              { label: 'Due date', value: selectedInvoice?.due_date },
              { label: 'Status', value: selectedInvoice?.status },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
