import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { InfoIcon, CreditCard } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { Invoice } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

export function StudentPaymentsPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const invoiceQuery = useQuery({
    queryKey: ['student-invoices'],
    queryFn: async () => asList<Invoice>((await api.get('/invoices/')).data),
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    PAID: 'bg-emerald-100 text-emerald-800',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  }

  return (
    <AppLayout title="Payments">
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
              <InfoIcon className="w-4 h-4" />
              Payment Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              Payments are processed through the University Accounts Office. This portal shows your current payment status only.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Amount (UGX)</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceQuery.data?.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <TableCell className="font-medium text-slate-500">#{invoice.id}</TableCell>
                    <TableCell className="font-medium">{invoice.term}</TableCell>
                    <TableCell className="font-semibold">{Number(invoice.amount_due).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.due_date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!invoiceQuery.data?.length && !invoiceQuery.isLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No invoices found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
