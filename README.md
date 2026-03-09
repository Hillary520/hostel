# Automated Hostel Facility Management System

Production-oriented greenfield implementation with Django REST API + React SPA.

## Stack
- Backend: Django 6, Django REST Framework, JWT auth (`simplejwt`), SQLite by default (PostgreSQL via env)
- Frontend: React + Vite + TypeScript + React Query + Axios
- Auth: Access/refresh JWT with refresh rotation + token blacklist on logout

## Backend Features
- Role-based users: `ADMIN`, `HOSTEL_MANAGER`, `STUDENT`
- Student profile management
- Hostel, room type, room, bed inventory
- Booking lifecycle: draft -> submit -> approve/reject
- Allocation lifecycle: pending check-in -> active -> vacated
- Payment invoices and transaction verification
- Admin-simulated invoice status updates (`PENDING`/`PAID`) for Accounts Office policy
- Visitor logs, maintenance tickets, system settings
- Reporting APIs: occupancy, finance, defaulters
- Audit events for critical actions
- Standard API error envelope: `{ code, message, details }`

## Frontend Features
- Role-gated route groups and navigation
- Login/logout and persistent session bootstrap
- Student pages: dashboard, bookings, payments, status
- Manager pages: dashboard, applications, allocations, visitors, maintenance
- Admin pages: users, students, hostels, rooms, reports

## API Base
- `/api/v1/*`

## Payment Policy (Configured)
- Students cannot submit payments in-app.
- Payments are handled externally by Accounts Office.
- Admin updates invoice status through API/UI simulation (`PENDING` or `PAID`).

## Local Setup

### 1) Backend
```bash
cd backend
python3 manage.py migrate
python3 manage.py seed_baseline
python3 manage.py runserver
```

Default seeded admin:
- Email: `admin@kisubi.ac.ug`
- Password: `Admin123!`

### 2) Frontend (dev)
```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8000`.

### 3) Frontend build + Django serving SPA
```bash
cd frontend
npm run build

cd ../backend
python3 manage.py runserver
```

Django serves the built SPA and catches non-API routes.

## Testing

### Backend
```bash
cd backend
python3 manage.py test
```

### Frontend
```bash
cd frontend
npm run test
npm run build
```

## Important Commands
- Seed baseline data: `python3 manage.py seed_baseline`
- Django admin: `/admin/`
- Auth endpoints:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
