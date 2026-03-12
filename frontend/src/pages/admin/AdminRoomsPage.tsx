import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

interface Room {
  id: number
  hostel: number
  room_no: string
  room_type: number
  floor: number
  bed_count: number
  status: string
}

interface Bed {
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

export function AdminRoomsPage() {
  const qc = useQueryClient()
  const [room, setRoom] = useState({ hostel: '', room_no: '', room_type: '', floor: '1', bed_count: '2' })
  const [bed, setBed] = useState({ room: '', bed_no: '' })
  const [openRoomModal, setOpenRoomModal] = useState(false)
  const [openBedModal, setOpenBedModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const rooms = useQuery({ queryKey: ['admin-rooms'], queryFn: async () => asList<Room>((await api.get('/rooms/')).data) })
  const hostels = useQuery({ queryKey: ['admin-hostels'], queryFn: async () => asList<HostelOption>((await api.get('/hostels/')).data) })
  const roomTypes = useQuery({
    queryKey: ['admin-room-types'],
    queryFn: async () => asList<RoomTypeOption>((await api.get('/room-types/')).data),
  })
  const beds = useQuery({ queryKey: ['admin-beds'], queryFn: async () => asList<Bed>((await api.get('/beds/')).data) })

  const hostelsById = useMemo(() => new Map(hostels.data?.map((hostel) => [hostel.id, hostel]) ?? []), [hostels.data])
  const roomTypesById = useMemo(() => new Map(roomTypes.data?.map((roomType) => [roomType.id, roomType]) ?? []), [roomTypes.data])
  const activeRooms = useMemo(() => (rooms.data ?? []).filter((item) => item.status === 'ACTIVE'), [rooms.data])
  const roomBeds = useMemo(() => {
    if (!selectedRoom) return []
    return (beds.data ?? []).filter((item) => item.room === selectedRoom.id)
  }, [beds.data, selectedRoom])

  const bedCounts = useMemo(() => {
    const counts = { AVAILABLE: 0, RESERVED: 0, OCCUPIED: 0, OUT_OF_SERVICE: 0 }
    roomBeds.forEach((bedItem) => {
      if (bedItem.status in counts) {
        counts[bedItem.status as keyof typeof counts] += 1
      }
    })
    return counts
  }, [roomBeds])

  const bedSummary = useMemo(() => {
    if (!roomBeds.length) return 'No beds'
    return roomBeds.map((bedItem) => `Bed ${bedItem.bed_no} (${bedItem.status})`).join(', ')
  }, [roomBeds])

  const createRoom = useMutation({
    mutationFn: async () =>
      api.post('/rooms/', {
        hostel: Number(room.hostel),
        room_no: room.room_no,
        room_type: Number(room.room_type),
        floor: Number(room.floor),
        bed_count: Number(room.bed_count),
        status: 'ACTIVE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rooms'] })
      setRoom({ hostel: '', room_no: '', room_type: '', floor: '1', bed_count: '2' })
      setOpenRoomModal(false)
    },
  })

  const createBed = useMutation({
    mutationFn: async () =>
      api.post('/beds/', {
        room: Number(bed.room),
        bed_no: bed.bed_no,
        status: 'AVAILABLE',
      }),
    onSuccess: () => {
      setBed({ room: '', bed_no: '' })
      setOpenBedModal(false)
    },
  })

  function onCreateRoom(e: FormEvent) {
    e.preventDefault()
    createRoom.mutate()
  }

  function onCreateBed(e: FormEvent) {
    e.preventDefault()
    createBed.mutate()
  }

  return (
    <AppLayout title="Rooms and Beds">
      <section className="card section-head">
        <div>
          <h3>Room Inventory</h3>
          <p>Manage rooms and associated bed records.</p>
        </div>
        <div className="inline-actions">
          <button className="btn btn-ghost" type="button" onClick={() => setOpenBedModal(true)}>
            New Bed
          </button>
          <button className="btn btn-solid" type="button" onClick={() => setOpenRoomModal(true)}>
            New Room
          </button>
        </div>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Hostel</th><th>Room</th><th>Type</th><th>Beds</th><th>Status</th></tr></thead>
          <tbody>
            {rooms.data?.map((item) => (
              <tr key={item.id} className="row-clickable" onClick={() => setSelectedRoom(item)}>
                <td>{item.id}</td>
                <td>{item.hostel}</td>
                <td>{item.room_no}</td>
                <td>{item.room_type}</td>
                <td>{item.bed_count}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openRoomModal} title="Create Room" onClose={() => setOpenRoomModal(false)}>
        <form onSubmit={onCreateRoom}>
          <label>
            Hostel
            <select value={room.hostel} onChange={(e) => setRoom({ ...room, hostel: e.target.value })}>
              <option value="">Select a hostel</option>
              {hostels.data?.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.code} · {hostel.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Room Type
            <select value={room.room_type} onChange={(e) => setRoom({ ...room, room_type: e.target.value })}>
              <option value="">Select a room type</option>
              {roomTypes.data?.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.code} · {roomType.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Room Number
            <input value={room.room_no} onChange={(e) => setRoom({ ...room, room_no: e.target.value })} />
          </label>
          <label>
            Floor
            <input value={room.floor} onChange={(e) => setRoom({ ...room, floor: e.target.value })} />
          </label>
          <label>
            Bed Count
            <input value={room.bed_count} onChange={(e) => setRoom({ ...room, bed_count: e.target.value })} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenRoomModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-solid"
              type="submit"
              disabled={createRoom.isPending || !room.hostel || !room.room_type || !room.room_no}
            >
              Create room
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={openBedModal} title="Create Bed" onClose={() => setOpenBedModal(false)}>
        <form onSubmit={onCreateBed}>
          <label>
            Room
            <select value={bed.room} onChange={(e) => setBed({ ...bed, room: e.target.value })}>
              <option value="">Select a room</option>
              {activeRooms.map((item) => (
                <option key={item.id} value={item.id}>
                  Room {item.room_no} · {hostelsById.get(item.hostel)?.code ?? 'Hostel'} (ID {item.id})
                </option>
              ))}
            </select>
          </label>
          <label>
            Bed Number
            <input value={bed.bed_no} onChange={(e) => setBed({ ...bed, bed_no: e.target.value })} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenBedModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={createBed.isPending || !bed.room || !bed.bed_no}>
              Create bed
            </button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedRoom !== null}
        title={selectedRoom ? `Room ${selectedRoom.room_no}` : 'Room Details'}
        onClose={() => setSelectedRoom(null)}
        sections={[
          {
            title: 'Overview',
            items: [
              { label: 'Room', value: selectedRoom?.room_no },
              { label: 'Floor', value: selectedRoom?.floor },
              {
                label: 'Hostel',
                value: selectedRoom ? hostelsById.get(selectedRoom.hostel)?.code ?? selectedRoom.hostel : '—',
              },
              {
                label: 'Room Type',
                value: selectedRoom ? roomTypesById.get(selectedRoom.room_type)?.code ?? selectedRoom.room_type : '—',
              },
              { label: 'Status', value: selectedRoom?.status },
              { label: 'Planned beds', value: selectedRoom?.bed_count },
            ],
          },
          {
            title: 'Beds',
            items: [
              { label: 'Total beds', value: roomBeds.length },
              { label: 'Available', value: bedCounts.AVAILABLE },
              { label: 'Reserved', value: bedCounts.RESERVED },
              { label: 'Occupied', value: bedCounts.OCCUPIED },
              { label: 'Out of service', value: bedCounts.OUT_OF_SERVICE },
              { label: 'Bed list', value: bedSummary },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
