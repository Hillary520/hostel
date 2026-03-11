import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './auth/AuthContext'
import { homeForRole, ProtectedRoute } from './components/ProtectedRoute'
import { AdminHostelsPage } from './pages/admin/AdminHostelsPage'
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminRoomsPage } from './pages/admin/AdminRoomsPage'
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { LoginPage } from './pages/LoginPage'
import { ManagerAllocationsPage } from './pages/manager/ManagerAllocationsPage'
import { ManagerApplicationsPage } from './pages/manager/ManagerApplicationsPage'
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage'
import { ManagerMaintenancePage } from './pages/manager/ManagerMaintenancePage'
import { ManagerVisitorsPage } from './pages/manager/ManagerVisitorsPage'
import { StudentBookingsPage } from './pages/student/StudentBookingsPage'
import { StudentComplaintsPage } from './pages/student/StudentComplaintsPage'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { StudentPaymentsPage } from './pages/student/StudentPaymentsPage'
import { StudentStatusPage } from './pages/student/StudentStatusPage'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.role)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route element={<ProtectedRoute allowRoles={['STUDENT']} />}>
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/bookings" element={<StudentBookingsPage />} />
        <Route path="/student/complaints" element={<StudentComplaintsPage />} />
        <Route path="/student/payments" element={<StudentPaymentsPage />} />
        <Route path="/student/status" element={<StudentStatusPage />} />
      </Route>

      <Route element={<ProtectedRoute allowRoles={['HOSTEL_MANAGER']} />}>
        <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
        <Route path="/manager/applications" element={<ManagerApplicationsPage />} />
        <Route path="/manager/allocations" element={<ManagerAllocationsPage />} />
        <Route path="/manager/visitors" element={<ManagerVisitorsPage />} />
        <Route path="/manager/maintenance" element={<ManagerMaintenancePage />} />
      </Route>

      <Route element={<ProtectedRoute allowRoles={['ADMIN']} />}>
        <Route path="/portal/admin/users" element={<AdminUsersPage />} />
        <Route path="/portal/admin/students" element={<AdminStudentsPage />} />
        <Route path="/portal/admin/hostels" element={<AdminHostelsPage />} />
        <Route path="/portal/admin/applications" element={<ManagerApplicationsPage />} />
        <Route path="/portal/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/portal/admin/rooms" element={<AdminRoomsPage />} />
        <Route path="/portal/admin/reports" element={<AdminReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
