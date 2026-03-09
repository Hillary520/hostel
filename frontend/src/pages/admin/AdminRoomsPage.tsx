import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

interface Room {
  id: number
  hostel: number
  room_no: string
  room_type: number
  bed_count: number
  status: string
}

export function AdminRoomsPage() {
  const qc = useQueryClient()
  const [room, setRoom] = useState({ hostel: '', room_no: '', room_type: '', floor: '1', bed_count: '2' })
  const [bed, setBed] = useState({ room: '', bed_no: '' })
  const [openRoomModal, setOpenRoomModal] = useState(false)
  const [openBedModal, setOpenBedModal] = useState(false)

  const rooms = useQuery({ queryKey: ['admin-rooms'], queryFn: async () => asList<Room>((await api.get('/rooms/')).data) })

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
              <tr key={item.id}><td>{item.id}</td><td>{item.hostel}</td><td>{item.room_no}</td><td>{item.room_type}</td><td>{item.bed_count}</td><td>{item.status}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openRoomModal} title="Create Room" onClose={() => setOpenRoomModal(false)}>
        <form onSubmit={onCreateRoom}>
          <label>
            Hostel ID
            <input value={room.hostel} onChange={(e) => setRoom({ ...room, hostel: e.target.value })} />
          </label>
          <label>
            Room Type ID
            <input value={room.room_type} onChange={(e) => setRoom({ ...room, room_type: e.target.value })} />
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
            <button className="btn btn-solid" type="submit" disabled={createRoom.isPending}>
              Create room
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={openBedModal} title="Create Bed" onClose={() => setOpenBedModal(false)}>
        <form onSubmit={onCreateBed}>
          <label>
            Room ID
            <input value={bed.room} onChange={(e) => setBed({ ...bed, room: e.target.value })} />
          </label>
          <label>
            Bed Number
            <input value={bed.bed_no} onChange={(e) => setBed({ ...bed, bed_no: e.target.value })} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenBedModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={createBed.isPending}>
              Create bed
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
