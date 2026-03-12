import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Invoice } from '../../types'

export function StudentPaymentsPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const invoiceQuery = useQuery({
    queryKey: ['student-invoices'],
    queryFn: async () => asList<Invoice>((await api.get('/invoices/')).data),
  })

  return (
    <AppLayout title="Payments">
      <section className="card">
        <h3>Payment Policy</h3>
        <p>
          Payments are processed through the University Accounts Office. This portal shows your current payment status only.
        </p>
      </section>

      <section className="card">
        <h3>Invoice Status</h3>
        <table>
          <thead><tr><th>ID</th><th>Term</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {invoiceQuery.data?.map((invoice) => (
              <tr key={invoice.id} className="row-clickable" onClick={() => setSelectedInvoice(invoice)}>
                <td>{invoice.id}</td>
                <td>{invoice.term}</td>
                <td>{invoice.amount_due}</td>
                <td>{invoice.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <DetailsModal
        open={selectedInvoice !== null}
        title={selectedInvoice ? `Invoice ${selectedInvoice.id}` : 'Invoice Details'}
        onClose={() => setSelectedInvoice(null)}
        sections={[
          {
            title: 'Invoice',
            items: [
              { label: 'Invoice ID', value: selectedInvoice?.id },
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
