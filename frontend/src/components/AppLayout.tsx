import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { homeForRole } from './ProtectedRoute'

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
    <div className="app-shell">
      <aside className="app-nav">
        <div className="brand-block">
          <p className="brand-kicker">University Residence Suite</p>
          <h1>Hostel Facility Management</h1>
        </div>

        <nav className="nav-stack">
          <p className="nav-title">Navigation</p>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <section className="user-card">
            <p className="user-name">{user.full_name}</p>
            <span className="role-pill">{user.role.replace('_', ' ')}</span>
          </section>
        ) : null}
      </aside>

      <div className="main-shell">
        <header className="app-header">
          <div className="page-title-wrap">
            <p className="page-title-label">Workspace</p>
            <h2>{title}</h2>
          </div>
          {user ? (
            <div className="header-actions">
              <button className="btn btn-ghost" onClick={() => navigate(homeForRole(user.role))}>
                Home
              </button>
              <button className="btn btn-solid" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  )
}
