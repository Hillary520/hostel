import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import type { Role } from '../types'

export function ProtectedRoute({ allowRoles }: { allowRoles?: Role[] }) {
  const { ready, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="page"><p>Loading session...</p></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowRoles && user && !allowRoles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />
  }

  return <Outlet />
}

export function homeForRole(role: Role) {
  if (role === 'ADMIN') return '/portal/admin/reports'
  if (role === 'HOSTEL_MANAGER') return '/manager/dashboard'
  return '/student/dashboard'
}
