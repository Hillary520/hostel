import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

interface Hostel {
  id: number
  code: string
  name: string
  sex_restriction: string
  capacity: number
  active: boolean
}

interface Room {
  id: number
  hostel: number
  room_no: string
  status: string
}

interface Bed {
  id: number
  room: number
  bed_no: string
  status: string
}

export function AdminHostelsPage() {
  const qc = useQueryClient()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [sex, setSex] = useState('ANY')
  const [openHostelModal, setOpenHostelModal] = useState(false)
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null)

  const hostels = useQuery({ queryKey: ['admin-hostels'], queryFn: async () => asList<Hostel>((await api.get('/hostels/')).data) })
  const rooms = useQuery({ queryKey: ['admin-rooms'], queryFn: async () => asList<Room>((await api.get('/rooms/')).data) })
  const beds = useQuery({ queryKey: ['admin-beds'], queryFn: async () => asList<Bed>((await api.get('/beds/')).data) })

  const hostelRooms = useMemo(() => {
    if (!selectedHostel) return []
    return (rooms.data ?? []).filter((room) => room.hostel === selectedHostel.id)
  }, [rooms.data, selectedHostel])

  const hostelBeds = useMemo(() => {
    if (!selectedHostel) return []
    const roomIds = new Set(hostelRooms.map((room) => room.id))
    return (beds.data ?? []).filter((bed) => roomIds.has(bed.room))
  }, [beds.data, hostelRooms, selectedHostel])

  const bedCounts = useMemo(() => {
    const counts = { AVAILABLE: 0, RESERVED: 0, OCCUPIED: 0, OUT_OF_SERVICE: 0 }
    hostelBeds.forEach((bed) => {
      if (bed.status in counts) {
        counts[bed.status as keyof typeof counts] += 1
      }
    })
    return counts
  }, [hostelBeds])

  const create = useMutation({
    mutationFn: async () =>
      api.post('/hostels/', {
        code,
        name,
        capacity: Number(capacity),
        sex_restriction: sex,
        active: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hostels'] })
      setCode('')
      setName('')
      setCapacity('')
      setOpenHostelModal(false)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <AppLayout title="Hostels">
      <section className="card section-head">
        <div>
          <h3>Hostel Directory</h3>
          <p>Manage residence blocks and allocation constraints.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenHostelModal(true)}>
          New Hostel
        </button>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Code</th><th>Name</th><th>Capacity</th><th>Restriction</th></tr></thead>
          <tbody>
            {hostels.data?.map((hostel) => (
              <tr key={hostel.id} className="row-clickable" onClick={() => setSelectedHostel(hostel)}>
                <td>{hostel.id}</td>
                <td>{hostel.code}</td>
                <td>{hostel.name}</td>
                <td>{hostel.capacity}</td>
                <td>{hostel.sex_restriction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openHostelModal} title="Create Hostel" onClose={() => setOpenHostelModal(false)}>
        <form onSubmit={onSubmit}>
          <label>
            Code
            <input value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Capacity
            <input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </label>
          <label>
            Sex restriction
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="ANY">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenHostelModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={create.isPending}>
              Save hostel
            </button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedHostel !== null}
        title={selectedHostel ? `Hostel ${selectedHostel.code}` : 'Hostel Details'}
        onClose={() => setSelectedHostel(null)}
        sections={[
          {
            title: 'Overview',
            items: [
              { label: 'Code', value: selectedHostel?.code },
              { label: 'Name', value: selectedHostel?.name },
              { label: 'Capacity', value: selectedHostel?.capacity },
              { label: 'Restriction', value: selectedHostel?.sex_restriction },
              { label: 'Active', value: selectedHostel?.active ? 'Yes' : 'No' },
            ],
          },
          {
            title: 'Inventory',
            items: [
              { label: 'Rooms', value: hostelRooms.length },
              { label: 'Beds', value: hostelBeds.length },
              { label: 'Available', value: bedCounts.AVAILABLE },
              { label: 'Reserved', value: bedCounts.RESERVED },
              { label: 'Occupied', value: bedCounts.OCCUPIED },
              { label: 'Out of service', value: bedCounts.OUT_OF_SERVICE },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
