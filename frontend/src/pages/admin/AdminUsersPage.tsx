import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { AuthUser, Role } from '../../types'

export function AdminUsersPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'STUDENT' as Role })
  const [openUserModal, setOpenUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)

  const users = useQuery({ queryKey: ['admin-users'], queryFn: async () => asList<AuthUser>((await api.get('/users/')).data) })

  const create = useMutation({
    mutationFn: async () => api.post('/users/', { ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setForm({ email: '', full_name: '', password: '', role: 'STUDENT' })
      setOpenUserModal(false)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <AppLayout title="User Management">
      <section className="card section-head">
        <div>
          <h3>System Users</h3>
          <p>Provision students, managers, and administrators.</p>
        </div>
        <button className="btn btn-solid" type="button" onClick={() => setOpenUserModal(true)}>
          New User
        </button>
      </section>

      <section className="card">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.data?.map((user) => (
              <tr key={user.id} className="row-clickable" onClick={() => setSelectedUser(user)}>
                <td>{user.id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={openUserModal} title="Create User" onClose={() => setOpenUserModal(false)}>
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            Full name
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="STUDENT">Student</option>
              <option value="HOSTEL_MANAGER">Hostel Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setOpenUserModal(false)}>
              Cancel
            </button>
            <button className="btn btn-solid" type="submit" disabled={create.isPending}>
              Create user
            </button>
          </div>
        </form>
      </Modal>

      <DetailsModal
        open={selectedUser !== null}
        title={selectedUser ? selectedUser.full_name : 'User Details'}
        onClose={() => setSelectedUser(null)}
        sections={[
          {
            title: 'Profile',
            items: [
              { label: 'Name', value: selectedUser?.full_name },
              { label: 'Email', value: selectedUser?.email },
              { label: 'Phone', value: selectedUser?.phone || '—' },
              { label: 'Role', value: selectedUser?.role },
              { label: 'Active', value: selectedUser?.is_active ? 'Yes' : 'No' },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
