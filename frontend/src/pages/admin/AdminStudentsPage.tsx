import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'

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
      <section className="card section-head">
        <div>
          <h3>Student Records</h3>
          <p>Create and manage enrolled students.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenModal(true)}>
          New Student
        </button>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>No.</th><th>Name</th><th>Email</th><th>Program</th><th>Year</th><th>Status</th></tr></thead>
          <tbody>
            {students.data?.map((student) => (
              <tr key={student.id} className="row-clickable" onClick={() => setSelectedStudent(student)}>
                <td>{student.student_no}</td>
                <td>{student.user.full_name}</td>
                <td>{student.user.email}</td>
                <td>{student.program}</td>
                <td>{student.year_of_study}</td>
                <td>{student.registration_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openModal} title="Create Student" onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit}>
          <label>
            Existing student user (optional)
            <select
              value={form.user_id}
              onChange={(e) => {
                const nextUserId = e.target.value
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
              <option value="">Create new user</option>
              {availableStudentUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {user.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              disabled={Boolean(form.user_id)}
            />
          </label>
          <label>
            Full name
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              disabled={Boolean(form.user_id)}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={Boolean(form.user_id)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={Boolean(form.user_id)}
            />
          </label>
          <label>
            Student number
            <input value={form.student_no} onChange={(e) => setForm({ ...form, student_no: e.target.value })} />
          </label>
          <label>
            Program
            <input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
          </label>
          <label>
            Year of study
            <input
              type="number"
              min={1}
              max={10}
              value={form.year_of_study}
              onChange={(e) => setForm({ ...form, year_of_study: Number(e.target.value) })}
            />
          </label>
          <label>
            Guardian name
            <input value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
          </label>
          <label>
            Guardian phone
            <input value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={create.isPending}>
              Create student
            </button>
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
