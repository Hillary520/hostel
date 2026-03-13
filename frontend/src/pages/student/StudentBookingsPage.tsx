import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Send } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { BookingApplication } from '../../types'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface HostelOption {
  id: number
  code: string
  name: string
  sex_restriction: string
}

export function StudentBookingsPage() {
  const [term, setTerm] = useState('2026-S1')
  const [preferredHostel, setPreferredHostel] = useState('')
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingApplication | null>(null)
  const qc = useQueryClient()

  const hostelsQuery = useQuery({
    queryKey: ['student-hostels'],
    queryFn: async () => asList<HostelOption>((await api.get('/hostels/?active=true')).data),
  })

  const bookingsQuery = useQuery({
    queryKey: ['student-bookings'],
    queryFn: async () => asList<BookingApplication>((await api.get('/bookings/')).data),
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post('/bookings/', {
        academic_term: term,
        preferred_hostel: preferredHostel ? Number(preferredHostel) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-bookings'] })
      setOpenCreateModal(false)
      setError('')
    },
    onError: (err) => {
      setError(extractErrorMessage(err, 'Unable to create booking. Please try again.'))
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/bookings/${id}/submit/`),
    onMutate: () => setSubmitError(''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-bookings'] })
      setSubmitError('')
    },
    onError: (err) => {
      setSubmitError(extractErrorMessage(err, 'Unable to submit booking. Please try again.'))
    },
  })

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!term.trim()) {
      setError('Academic term is required')
      return
    }
    if (preferredHostel && Number.isNaN(Number(preferredHostel))) {
      setError('Select a valid hostel')
      return
    }
    createMutation.mutate()
  }

  const hostelById = new Map(hostelsQuery.data?.map((hostel) => [hostel.id, hostel]) ?? [])

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-700',
    WAITLISTED: 'bg-amber-100 text-amber-800',
  }

  return (
    <AppLayout title="My Bookings">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Accommodation Applications</h3>
            <p className="text-sm text-gray-500">Create and submit your room request for the upcoming term.</p>
          </div>
          <Button onClick={() => setOpenCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {submitError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">{submitError}</div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Preferred Hostel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsQuery.isLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {bookingsQuery.data?.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <TableCell className="font-medium text-slate-500">#{booking.id}</TableCell>
                    <TableCell className="font-medium">{booking.academic_term}</TableCell>
                    <TableCell>
                      {booking.preferred_hostel
                        ? hostelById.get(booking.preferred_hostel)?.code ?? 'Hostel'
                        : <span className="text-muted-foreground">Any</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={booking.status !== 'DRAFT' || submitMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); submitMutation.mutate(booking.id) }}
                      >
                        <Send className="w-3 h-3 mr-1.5" />
                        Submit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!bookingsQuery.data?.length && !bookingsQuery.isLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No bookings yet. Create your first booking above.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal open={openCreateModal} title="New Accommodation Booking" onClose={() => setOpenCreateModal(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term">Academic Term</Label>
            <Input id="term" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. 2026-S1" required />
          </div>
          <div className="space-y-2">
            <Label>Preferred Hostel</Label>
            <Select value={preferredHostel || 'any'} onValueChange={(v) => setPreferredHostel(v === 'any' ? '' : (v || ''))}>
              <SelectTrigger><SelectValue placeholder="Any hostel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any hostel</SelectItem>
                {hostelsQuery.data?.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>{h.code} · {h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedBooking !== null}
        title={selectedBooking ? `Booking #${selectedBooking.id}` : 'Booking Details'}
        onClose={() => setSelectedBooking(null)}
        sections={[{
          title: 'Booking Details',
          items: [
            { label: 'Booking ID', value: selectedBooking?.id },
            { label: 'Term', value: selectedBooking?.academic_term },
            { label: 'Status', value: selectedBooking?.status },
            { label: 'Preferred Hostel', value: selectedBooking?.preferred_hostel ? hostelById.get(selectedBooking.preferred_hostel)?.code ?? selectedBooking.preferred_hostel : 'Any' },
            { label: 'Submitted At', value: selectedBooking?.submitted_at ?? '—' },
            { label: 'Created At', value: selectedBooking?.created_at },
          ],
        }]}
      />
    </AppLayout>
  )
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback
  if (typeof error === 'string') return error
  const message = (error as { message?: string }).message
  if (message) return message
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const detail = (data as { detail?: string | string[] }).detail
    if (detail) return Array.isArray(detail) ? detail.join(', ') : detail
    const nonField = (data as { non_field_errors?: string[] }).non_field_errors
    if (nonField?.length) return nonField.join(', ')
  }
  return fallback
}
