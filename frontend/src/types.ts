export type Role = 'ADMIN' | 'HOSTEL_MANAGER' | 'STUDENT'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  phone: string
  role: Role
  is_active: boolean
}

export interface BookingApplication {
  id: number
  student: number
  academic_term: string
  status: string
  notes?: string
  preferred_hostel?: number | null
  preferred_room_type?: number | null
  submitted_at?: string | null
  created_at: string
}

export interface Allocation {
  id: number
  student: number
  application: number
  bed: number
  status: string
  check_in_due_date: string
  expected_checkout_date: string
  check_in_at?: string | null
  checkout_at?: string | null
}

export interface Invoice {
  id: number
  student: number
  term: string
  amount_due: string
  due_date: string
  status: string
}
