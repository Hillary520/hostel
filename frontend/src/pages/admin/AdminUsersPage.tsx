import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'

import { AppLayout } from '../../components/AppLayout'
import { DetailsModal } from '../../components/DetailsModal'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { asList } from '../../lib/apiData'
import type { AuthUser, Role } from '../../types'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
            <p className="text-sm text-gray-500">Provision students, managers, and administrators.</p>
          </div>
          <Button onClick={() => setOpenUserModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New User
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data?.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors" 
                    onClick={() => setSelectedUser(user)}
                  >
                    <TableCell className="font-medium text-slate-500">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {user.role.replace('_', ' ').toLowerCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!users.data?.length && !users.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal width="lg" open={openUserModal} title="Create User" onClose={() => setOpenUserModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input 
              value={form.full_name} 
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input 
              type="password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={form.role} 
              onValueChange={(val) => setForm({ ...form, role: val as Role })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="HOSTEL_MANAGER">Hostel Manager</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" type="button" onClick={() => setOpenUserModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating...' : 'Create user'}
            </Button>
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
              { label: 'Role', value: selectedUser?.role.replace('_', ' ') },
              { label: 'Active', value: selectedUser?.is_active ? 'Yes' : 'No' },
            ],
          },
        ]}
      />
    </AppLayout>
  )
}
