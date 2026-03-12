import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Home, Building2 } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { homeForRole } from './ProtectedRoute'
import { Button } from './ui/button'

interface NavItem {
  label: string
  to: string
}

const navByRole: Record<string, NavItem[]> = {
  STUDENT: [
    { label: 'Dashboard', to: '/student/dashboard' },
    { label: 'Bookings', to: '/student/bookings' },
    { label: 'Complaints', to: '/student/complaints' },
    { label: 'Payments', to: '/student/payments' },
    { label: 'Status', to: '/student/status' },
  ],
  HOSTEL_MANAGER: [
    { label: 'Dashboard', to: '/manager/dashboard' },
    { label: 'Applications', to: '/manager/applications' },
    { label: 'Allocations', to: '/manager/allocations' },
    { label: 'Visitors', to: '/manager/visitors' },
    { label: 'Maintenance', to: '/manager/maintenance' },
  ],
  ADMIN: [
    { label: 'Users', to: '/portal/admin/users' },
    { label: 'Students', to: '/portal/admin/students' },
    { label: 'Hostels', to: '/portal/admin/hostels' },
    { label: 'Applications', to: '/portal/admin/applications' },
    { label: 'Payments', to: '/portal/admin/payments' },
    { label: 'Rooms', to: '/portal/admin/rooms' },
    { label: 'Reports', to: '/portal/admin/reports' },
  ],
}

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = user ? navByRole[user.role] || [] : []

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Building2 className="w-6 h-6" />
            <h1 className="font-bold text-lg leading-tight">UnivResidence</h1>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hostel Management</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Navigation</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b flex-shrink-0">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workspace</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{title}</h2>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate(homeForRole(user.role))}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
                <Button variant="default" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
