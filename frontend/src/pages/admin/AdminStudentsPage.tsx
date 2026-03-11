import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
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

export function AdminStudentsPage() {
  const qc = useQueryClient()
  const [openModal, setOpenModal] = useState(false)
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
              <tr key={student.id}>
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
            Existing user ID (optional)
            <input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          </label>
          <label>
            Full name
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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
    </AppLayout>
  )
}
