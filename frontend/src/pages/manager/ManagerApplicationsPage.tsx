import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { BookingApplication } from '../../types'

interface RoomOption {
  id: number
  room_no: string
  status: string
}

interface BedOption {
  id: number
  room: number
  bed_no: string
  status: string
}

interface HostelOption {
  id: number
  code: string
  name: string
}

interface RoomTypeOption {
  id: number
  code: string
  name: string
}

export function ManagerApplicationsPage() {
  const qc = useQueryClient()
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null)
  const [roomId, setRoomId] = useState('')
  const [bedId, setBedId] = useState('')
  const [checkInDueDate, setCheckInDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(() =>
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10)
  )
  const [selectedApplication, setSelectedApplication] = useState<BookingApplication | null>(null)

  const applications = useQuery({
    queryKey: ['manager-applications'],
    queryFn: async () => asList<BookingApplication>((await api.get('/bookings/?status=SUBMITTED')).data),
  })

  const roomsQuery = useQuery({
    queryKey: ['manager-rooms'],
    queryFn: async () => asList<RoomOption>((await api.get('/rooms/?status=ACTIVE')).data),
  })

  const bedsQuery = useQuery({
    queryKey: ['manager-beds'],
    queryFn: async () => asList<BedOption>((await api.get('/beds/?status=AVAILABLE')).data),
  })

  const hostelsQuery = useQuery({
    queryKey: ['manager-hostels'],
    queryFn: async () => asList<HostelOption>((await api.get('/hostels/')).data),
  })

  const roomTypesQuery = useQuery({
    queryKey: ['manager-room-types'],
    queryFn: async () => asList<RoomTypeOption>((await api.get('/room-types/')).data),
  })

  const targetApplication = useMemo(
    () => applications.data?.find((item) => item.id === approveTargetId) ?? null,
    [applications.data, approveTargetId]
  )

  const roomsById = useMemo(
    () => new Map(roomsQuery.data?.map((room) => [room.id, room]) ?? []),
    [roomsQuery.data]
  )
  const hostelsById = useMemo(
    () => new Map(hostelsQuery.data?.map((hostel) => [hostel.id, hostel]) ?? []),
    [hostelsQuery.data]
  )
  const roomTypesById = useMemo(
    () => new Map(roomTypesQuery.data?.map((roomType) => [roomType.id, roomType]) ?? []),
    [roomTypesQuery.data]
  )

  const availableBeds = useMemo(
    () => (bedsQuery.data ?? []).filter((bed) => roomsById.has(bed.room)),
    [bedsQuery.data, roomsById]
  )

  const roomsWithAvailableBeds = useMemo(() => {
    const roomIds = new Set(availableBeds.map((bed) => bed.room))
    return (roomsQuery.data ?? []).filter((room) => roomIds.has(room.id))
  }, [availableBeds, roomsQuery.data])

  const bedsForSelectedRoom = useMemo(() => {
    if (!roomId) return []
    return availableBeds.filter((bed) => bed.room === Number(roomId))
  }, [availableBeds, roomId])

  const approveMutation = useMutation({
    mutationFn: async (payload: { bookingId: number; bed: number; checkInDueDate: string; expectedCheckoutDate: string }) =>
      api.post(`/bookings/${payload.bookingId}/approve/`, {
        bed: payload.bed,
        check_in_due_date: payload.checkInDueDate,
        expected_checkout_date: payload.expectedCheckoutDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-applications'] })
      setApproveTargetId(null)
      setRoomId('')
      setBedId('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (bookingId: number) => api.post(`/bookings/${bookingId}/reject/`, { reason: 'Capacity exhausted' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-applications'] }),
  })

  function onApproveSubmit(event: FormEvent) {
    event.preventDefault()
    if (!approveTargetId || !bedId) return
    approveMutation.mutate({
      bookingId: approveTargetId,
      bed: Number(bedId),
      checkInDueDate,
      expectedCheckoutDate,
    })
  }

  function closeApproveModal() {
    setApproveTargetId(null)
    setRoomId('')
    setBedId('')
  }

  return (
    <AppLayout title="Applications Review">
      <section className="card">
        <h3>Pending Applications</h3>
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Term</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {applications.data?.map((item) => (
              <tr key={item.id} className="row-clickable" onClick={() => setSelectedApplication(item)}>
                <td>{item.id}</td>
                <td>{item.student}</td>
                <td>{item.academic_term}</td>
                <td>{item.status}</td>
                <td>
                  <div className="inline-actions">
                    <button
                      className="btn btn-solid"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setApproveTargetId(item.id)
                        setRoomId('')
                        setBedId('')
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        rejectMutation.mutate(item.id)
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={approveTargetId !== null} title="Approve Application" onClose={closeApproveModal}>
        <form onSubmit={onApproveSubmit}>
          <label>
            Application ID
            <input value={targetApplication?.id ?? ''} disabled readOnly />
          </label>
          <label>
            Room
            <select
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value)
                setBedId('')
              }}
            >
              <option value="">Select a room</option>
              {roomsWithAvailableBeds.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_no} (ID {room.id})
                </option>
              ))}
            </select>
          </label>
          <label>
            Bed
            <select value={bedId} onChange={(e) => setBedId(e.target.value)} disabled={!roomId}>
              <option value="">Select a bed</option>
              {bedsForSelectedRoom.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  Bed {bed.bed_no} (ID {bed.id})
                </option>
              ))}
            </select>
          </label>
          <label>
            Check-in Due Date
            <input type="date" value={checkInDueDate} onChange={(e) => setCheckInDueDate(e.target.value)} />
          </label>
          <label>
            Expected Checkout Date
            <input type="date" value={expectedCheckoutDate} onChange={(e) => setExpectedCheckoutDate(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={closeApproveModal}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={!bedId || approveMutation.isPending}>
              Approve booking
            </button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedApplication !== null}
        title={selectedApplication ? `Application ${selectedApplication.id}` : 'Application Details'}
        onClose={() => setSelectedApplication(null)}
        sections={[
          {
            title: 'Application',
            items: [
              { label: 'Application ID', value: selectedApplication?.id },
              { label: 'Student ID', value: selectedApplication?.student },
              { label: 'Term', value: selectedApplication?.academic_term },
              { label: 'Status', value: selectedApplication?.status },
              { label: 'Submitted at', value: selectedApplication?.submitted_at ?? '—' },
              { label: 'Created at', value: selectedApplication?.created_at },
              {
                label: 'Preferred hostel',
                value: selectedApplication?.preferred_hostel
                  ? hostelsById.get(selectedApplication.preferred_hostel)?.code ?? selectedApplication.preferred_hostel
                  : 'Any',
              },
              {
                label: 'Preferred room type',
                value: selectedApplication?.preferred_room_type
                  ? roomTypesById.get(selectedApplication.preferred_room_type)?.code ?? selectedApplication.preferred_room_type
                  : 'Any',
              },
              { label: 'Notes', value: selectedApplication?.notes ?? '—' },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
