import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Invoice } from '../../types'

export function StudentPaymentsPage() {
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
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.term}</td>
                <td>{invoice.amount_due}</td>
                <td>{invoice.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  )
}
