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
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hostel Directory</h3>
            <p className="text-sm text-gray-500">Manage residence blocks and allocation constraints.</p>
          </div>
          <Button onClick={() => setOpenHostelModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Hostel
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Restriction</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostels.data?.map((hostel) => (
                  <TableRow 
                    key={hostel.id} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors" 
                    onClick={() => setSelectedHostel(hostel)}
                  >
                    <TableCell className="font-medium text-slate-700">{hostel.code}</TableCell>
                    <TableCell className="font-medium">{hostel.name}</TableCell>
                    <TableCell>{hostel.capacity} beds</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                        {hostel.sex_restriction.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {hostel.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!hostels.data?.length && !hostels.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No hostels found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal width="lg" open={openHostelModal} title="Create Hostel" onClose={() => setOpenHostelModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. MDB" />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Mandela Block" />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required min={1} />
          </div>
          <div className="space-y-2">
            <Label>Sex restriction</Label>
            <Select value={sex} onValueChange={(val) => setSex(val || '')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenHostelModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving...' : 'Save hostel'}
            </Button>
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
