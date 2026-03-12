with open("src/pages/admin/AdminStudentsPage.tsx", "w") as f:
    f.write("""import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

interface StudentRecord {
  id: number
  student_no: string
  program: string
  year_of_study: number
  registration_status: string
  user: {
    id: number
    email: string
    full_name: string
  }
}

interface UserOption {
  id: number
  email: string
  full_name: string
  role: string
}

interface AllocationOption {
  id: number
  student: number
  bed: number
  status: string
  check_in_due_date: string
  expected_checkout_date: string
  check_in_at?: string | null
  checkout_at?: string | null
}

interface BedOption {
  id: number
  room: number
  bed_no: string
  status: string
}

interface RoomOption {
  id: number
  hostel: number
  room_no: string
  status: string
}

interface HostelOption {
  id: number
  code: string
  name: string
}

export function AdminStudentsPage() {
  const qc = useQueryClient()
  const [openModal, setOpenModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)
  const [form, setForm] = useState({
    user_id: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    student_no: '',
    program: '',
    year_of_study: 1,
    guardian_name: '',
    guardian_phone: '',
  })

  const students = useQuery({ queryKey: ['admin-students'], queryFn: async () => asList<StudentRecord>((await api.get('/students/')).data) })
  const users = useQuery({
    queryKey: ['admin-users', 'students'],
    queryFn: async () => asList<UserOption>((await api.get('/users/?role=STUDENT')).data),
  })
  const allocations = useQuery({
    queryKey: ['admin-allocations'],
    queryFn: async () => asList<AllocationOption>((await api.get('/allocations/')).data),
  })
  const beds = useQuery({ queryKey: ['admin-beds'], queryFn: async () => asList<BedOption>((await api.get('/beds/')).data) })
  const rooms = useQuery({ queryKey: ['admin-rooms'], queryFn: async () => asList<RoomOption>((await api.get('/rooms/')).data) })
  const hostels = useQuery({ queryKey: ['admin-hostels'], queryFn: async () => asList<HostelOption>((await api.get('/hostels/')).data) })

  const existingStudentUserIds = useMemo(
    () => new Set(students.data?.map((student) => student.user.id) ?? []),
    [students.data]
  )
  const availableStudentUsers = useMemo(
    () => (users.data ?? []).filter((user) => !existingStudentUserIds.has(user.id)),
    [users.data, existingStudentUserIds]
  )

  const activeAllocations = useMemo(
    () => (allocations.data ?? []).filter((allocation) => ['ACTIVE', 'PENDING_CHECKIN'].includes(allocation.status)),
    [allocations.data]
  )

  const allocationByStudent = useMemo(
    () => new Map(activeAllocations.map((allocation) => [allocation.student, allocation])),
    [activeAllocations]
  )

  const bedsById = useMemo(() => new Map(beds.data?.map((bed) => [bed.id, bed]) ?? []), [beds.data])
  const roomsById = useMemo(() => new Map(rooms.data?.map((room) => [room.id, room]) ?? []), [rooms.data])
  const hostelsById = useMemo(() => new Map(hostels.data?.map((hostel) => [hostel.id, hostel]) ?? []), [hostels.data])

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        student_no: form.student_no,
        program: form.program,
        year_of_study: Number(form.year_of_study),
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
      }

      if (form.user_id) {
        payload.user_id = Number(form.user_id)
      } else {
        payload.user = {
          email: form.email,
          full_name: form.full_name,
          phone: form.phone || undefined,
          password: form.password,
        }
      }

      return api.post('/students/', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-students'] })
      setForm({
        user_id: '',
        email: '',
        full_name: '',
        phone: '',
        password: '',
        student_no: '',
        program: '',
        year_of_study: 1,
        guardian_name: '',
        guardian_phone: '',
      })
      setOpenModal(false)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <AppLayout title="Students">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Student Records</h3>
            <p className="text-sm text-gray-500">Create and manage enrolled students.</p>
          </div>
          <Button onClick={() => setOpenModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Student
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.data?.map((student) => (
                  <TableRow 
                    key={student.id} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors" 
                    onClick={() => setSelectedStudent(student)}
                  >
                    <TableCell className="font-medium text-slate-500">{student.student_no}</TableCell>
                    <TableCell className="font-medium">{student.user.full_name}</TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>{student.program}</TableCell>
                    <TableCell>{student.year_of_study}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {student.registration_status.replace('_', ' ').toLowerCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!students.data?.length && !students.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal open={openModal} title="Create Student" onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Existing student user (optional)</Label>
            <Select
              value={form.user_id}
              onValueChange={(val) => {
                const nextUserId = val === "none" ? "" : val
                setForm((prev) => ({
                  ...prev,
                  user_id: nextUserId,
                  email: nextUserId ? '' : prev.email,
                  full_name: nextUserId ? '' : prev.full_name,
                  phone: nextUserId ? '' : prev.phone,
                  password: nextUserId ? '' : prev.password,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Create new user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Create new user</SelectItem>
                {availableStudentUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.full_name} · {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              disabled={Boolean(form.user_id)}
            />
          </div>
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              disabled={Boolean(form.user_id)}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={Boolean(form.user_id)}
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={Boolean(form.user_id)}
            />
          </div>
          <div className="space-y-2">
            <Label>Student number</Label>
            <Input value={form.student_no} onChange={(e) => setForm({ ...form, student_no: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Program</Label>
            <Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Year of study</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={form.year_of_study}
              onChange={(e) => setForm({ ...form, year_of_study: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Guardian name</Label>
            <Input value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Guardian phone</Label>
            <Input value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating...' : 'Create student'}
            </Button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedStudent !== null}
        title={selectedStudent ? selectedStudent.user.full_name : 'Student Details'}
        onClose={() => setSelectedStudent(null)}
        sections={[
          {
            title: 'Profile',
            items: [
              { label: 'Student No', value: selectedStudent?.student_no },
              { label: 'Name', value: selectedStudent?.user.full_name },
              { label: 'Email', value: selectedStudent?.user.email },
              { label: 'Program', value: selectedStudent?.program },
              { label: 'Year of study', value: selectedStudent?.year_of_study },
              { label: 'Registration status', value: selectedStudent?.registration_status },
            ],
          },
          {
            title: 'Allocation',
            items: (() => {
              if (!selectedStudent) return []
              const allocation = allocationByStudent.get(selectedStudent.user.id)
              if (!allocation) {
                return [{ label: 'Status', value: 'No active allocation' }]
              }
              const bed = bedsById.get(allocation.bed)
              const room = bed ? roomsById.get(bed.room) : null
              const hostel = room ? hostelsById.get(room.hostel) : null
              return [
                { label: 'Allocation ID', value: allocation.id },
                { label: 'Status', value: allocation.status },
                { label: 'Bed', value: bed ? `Bed ${bed.bed_no} (ID ${bed.id})` : allocation.bed },
                { label: 'Room', value: room ? `Room ${room.room_no} (ID ${room.id})` : '—' },
                { label: 'Hostel', value: hostel ? `${hostel.code} · ${hostel.name}` : '—' },
                { label: 'Check-in due', value: allocation.check_in_due_date },
                { label: 'Expected checkout', value: allocation.expected_checkout_date },
              ]
            })(),
          },
        ]}
      />
    </AppLayout>
  )
}
""")
