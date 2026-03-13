import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

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
      qc.invalidateQueries({ queryKey: ['admin-beds'] })
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
      <div className="space-y-6">
        <Card className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Room Inventory</CardTitle>
            <CardDescription>Manage rooms and associated bed records.</CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpenBedModal(true)} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              New Bed
            </Button>
            <Button onClick={() => setOpenRoomModal(true)} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              New Room
            </Button>
          </div>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.data?.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors" 
                    onClick={() => setSelectedRoom(item)}
                  >
                    <TableCell className="font-medium text-slate-700">{item.id}</TableCell>
                    <TableCell>{hostelsById.get(item.hostel)?.code ?? item.hostel}</TableCell>
                    <TableCell className="font-medium">{item.room_no}</TableCell>
                    <TableCell>{roomTypesById.get(item.room_type)?.code ?? item.room_type}</TableCell>
                    <TableCell>{item.bed_count}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!rooms.data?.length && !rooms.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No rooms found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal width="lg" open={openRoomModal} title="Create Room" onClose={() => setOpenRoomModal(false)}>
        <form onSubmit={onCreateRoom} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hostel</Label>
            <Select value={room.hostel} onValueChange={(val) => setRoom({ ...room, hostel: val || "" })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hostel" />
              </SelectTrigger>
              <SelectContent>
                {hostels.data?.map((hostel) => (
                  <SelectItem key={hostel.id} value={hostel.id.toString()}>
                    {hostel.code} · {hostel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select value={room.room_type} onValueChange={(val) => setRoom({ ...room, room_type: val || "" })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.data?.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.id.toString()}>
                    {roomType.code} · {roomType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input value={room.room_no} onChange={(e) => setRoom({ ...room, room_no: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Floor</Label>
            <Input type="number" value={room.floor} onChange={(e) => setRoom({ ...room, floor: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Bed Count</Label>
            <Input type="number" value={room.bed_count} onChange={(e) => setRoom({ ...room, bed_count: e.target.value })} required />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenRoomModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRoom.isPending || !room.hostel || !room.room_type || !room.room_no}
            >
              {createRoom.isPending ? 'Saving...' : 'Create room'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal width="lg" open={openBedModal} title="Create Bed" onClose={() => setOpenBedModal(false)}>
        <form onSubmit={onCreateBed} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={bed.room} onValueChange={(val) => setBed({ ...bed, room: val || "" })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {activeRooms.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    Room {item.room_no} · {hostelsById.get(item.hostel)?.code ?? 'Hostel'} (ID {item.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bed Number</Label>
            <Input value={bed.bed_no} onChange={(e) => setBed({ ...bed, bed_no: e.target.value })} required />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenBedModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBed.isPending || !bed.room || !bed.bed_no}>
              {createBed.isPending ? 'Saving...' : 'Create bed'}
            </Button>
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
