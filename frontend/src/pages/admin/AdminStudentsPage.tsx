import { useQuery } from '@tanstack/react-query'

import { AppLayout } from '../../components/AppLayout'
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
  const students = useQuery({ queryKey: ['admin-students'], queryFn: async () => asList<StudentRecord>((await api.get('/students/')).data) })

  return (
    <AppLayout title="Students">
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
    </AppLayout>
  )
}
