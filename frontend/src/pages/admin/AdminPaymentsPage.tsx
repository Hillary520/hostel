import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { DetailsModal } from '../../components/DetailsModal'

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
  const [nextStatus, setNextStatus] = useState<'PENDING' | 'PAID' | undefined>()
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)

  const { data: invoices } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: async () => asList<InvoiceRow>((await api.get('/invoices/')).data),
  })

  const targetInvoice = useMemo(
    () => invoices?.find((item) => item.id === targetInvoiceId) ?? null,
    [invoices, targetInvoiceId]
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!targetInvoiceId || !nextStatus) return
    updateStatus.mutate({ invoiceId: targetInvoiceId, status: nextStatus })
  }

  return (
    <AppLayout title="Payments Control">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulated Payment Status</CardTitle>
            <CardDescription>
              Per policy, Accounts Office handles payments. Admins update portal status as pending or paid.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>View and manage student invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <TableCell className="font-medium">#{invoice.id}</TableCell>
                    <TableCell>{invoice.student}</TableCell>
                    <TableCell>{invoice.term}</TableCell>
                    <TableCell className="font-semibold text-green-600 dark:text-green-500">
                      ${invoice.amount_due}
                    </TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          invoice.status === 'PAID'
                            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20'
                            : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          openStatusModal(invoice)
                        }}
                      >
                        Update status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!invoices?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={targetInvoiceId !== null} onOpenChange={(open) => !open && setTargetInvoiceId(null)}>
        <DialogContent>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>Update Payment Status</DialogTitle>
              <DialogDescription>Change the payment status for Invoice #{targetInvoice?.id}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceId">Invoice ID</Label>
                <Input id="invoiceId" value={targetInvoice?.id ?? ''} disabled readOnly />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={nextStatus}
                  onValueChange={(val: 'PENDING' | 'PAID' | null) => {
                    if (val) setNextStatus(val)
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="PAID">PAID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTargetInvoiceId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateStatus.isPending || !nextStatus}>
                {updateStatus.isPending ? 'Saving...' : 'Save status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              { label: 'Amount', value: selectedInvoice?.amount_due ? `$${selectedInvoice.amount_due}` : null },
              { label: 'Due date', value: selectedInvoice?.due_date },
              { label: 'Status', value: selectedInvoice?.status },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
