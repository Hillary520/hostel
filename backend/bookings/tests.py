from datetime import date, timedelta

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from config.constants import ROLE_ADMIN, ROLE_MANAGER, ROLE_STUDENT
from finance.models import PaymentInvoice
from hostels.models import Bed, Hostel, Room, RoomType
from students.models import StudentProfile

User = get_user_model()


class BookingLifecycleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="Admin123!",
            full_name="Admin",
            role=ROLE_ADMIN,
            is_staff=True,
        )
        self.manager = User.objects.create_user(
            email="manager@example.com",
            password="Manager123!",
            full_name="Manager",
            role=ROLE_MANAGER,
        )
        self.student = User.objects.create_user(
            email="student@example.com",
            password="Student123!",
            full_name="Student",
            role=ROLE_STUDENT,
        )
        self.student2 = User.objects.create_user(
            email="student2@example.com",
            password="Student123!",
            full_name="Student Two",
            role=ROLE_STUDENT,
        )
        StudentProfile.objects.create(
            user=self.student,
            student_no="UKU001",
            program="CS",
            year_of_study=2,
            guardian_name="Guardian",
            guardian_phone="070000000",
            registration_status=StudentProfile.RegistrationStatus.COMPLETE,
        )
        StudentProfile.objects.create(
            user=self.student2,
            student_no="UKU002",
            program="CS",
            year_of_study=1,
            guardian_name="Guardian2",
            guardian_phone="071111111",
            registration_status=StudentProfile.RegistrationStatus.COMPLETE,
        )

        self.hostel = Hostel.objects.create(code="H1", name="Hostel 1", capacity=10)
        self.room_type = RoomType.objects.create(code="STD", name="Standard", monthly_fee=250000)
        self.room = Room.objects.create(
            hostel=self.hostel,
            room_no="A1",
            floor=1,
            room_type=self.room_type,
            bed_count=2,
        )
        self.bed1 = Bed.objects.create(room=self.room, bed_no="1")
        self.bed2 = Bed.objects.create(room=self.room, bed_no="2")

    def _login(self, email, password):
        response = self.client.post("/api/v1/auth/login", {"email": email, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_full_booking_lifecycle_with_payment_gate(self):
        self._login("student@example.com", "Student123!")
        create = self.client.post(
            "/api/v1/bookings/",
            {
                "academic_term": "2026-S1",
                "preferred_hostel": self.hostel.id,
                "preferred_room_type": self.room_type.id,
                "notes": "Need quiet room",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        booking_id = create.data["id"]

        submit = self.client.post(f"/api/v1/bookings/{booking_id}/submit/")
        self.assertEqual(submit.status_code, status.HTTP_200_OK)
        self.assertEqual(submit.data["status"], "SUBMITTED")

        self._login("manager@example.com", "Manager123!")
        approve = self.client.post(
            f"/api/v1/bookings/{booking_id}/approve/",
            {
                "bed": self.bed1.id,
                "check_in_due_date": date.today().isoformat(),
                "expected_checkout_date": (date.today() + timedelta(days=120)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(approve.status_code, status.HTTP_200_OK)
        allocation_id = approve.data["id"]

        check_in_without_payment = self.client.post(f"/api/v1/allocations/{allocation_id}/check_in/")
        self.assertEqual(check_in_without_payment.status_code, status.HTTP_400_BAD_REQUEST)

        invoice = PaymentInvoice.objects.create(student=self.student, term="2026-S1", amount_due=250000, due_date=date.today())
        self._login("admin@example.com", "Admin123!")
        update_status = self.client.post(
            f"/api/v1/invoices/{invoice.id}/status/",
            {"status": "PAID"},
            format="json",
        )
        self.assertEqual(update_status.status_code, status.HTTP_200_OK)
        self.assertEqual(update_status.data["status"], "PAID")

        self._login("manager@example.com", "Manager123!")
        check_in = self.client.post(f"/api/v1/allocations/{allocation_id}/check_in/")
        self.assertEqual(check_in.status_code, status.HTTP_200_OK)
        self.assertEqual(check_in.data["status"], "ACTIVE")

        vacate = self.client.post(f"/api/v1/allocations/{allocation_id}/vacate/")
        self.assertEqual(vacate.status_code, status.HTTP_200_OK)
        self.assertEqual(vacate.data["status"], "VACATED")

    def test_bed_conflict_rejected_for_second_approval(self):
        self._login("student@example.com", "Student123!")
        first_booking = self.client.post("/api/v1/bookings/", {"academic_term": "2026-S1"}, format="json")
        self.client.post(f"/api/v1/bookings/{first_booking.data['id']}/submit/")

        self._login("student2@example.com", "Student123!")
        second_booking = self.client.post("/api/v1/bookings/", {"academic_term": "2026-S1"}, format="json")
        self.client.post(f"/api/v1/bookings/{second_booking.data['id']}/submit/")

        self._login("manager@example.com", "Manager123!")
        first_approve = self.client.post(
            f"/api/v1/bookings/{first_booking.data['id']}/approve/",
            {
                "bed": self.bed1.id,
                "check_in_due_date": date.today().isoformat(),
                "expected_checkout_date": (date.today() + timedelta(days=120)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(first_approve.status_code, status.HTTP_200_OK)

        second_approve = self.client.post(
            f"/api/v1/bookings/{second_booking.data['id']}/approve/",
            {
                "bed": self.bed1.id,
                "check_in_due_date": date.today().isoformat(),
                "expected_checkout_date": (date.today() + timedelta(days=120)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(second_approve.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_requires_reason(self):
        self._login("student@example.com", "Student123!")
        booking = self.client.post("/api/v1/bookings/", {"academic_term": "2026-S1"}, format="json")
        self.client.post(f"/api/v1/bookings/{booking.data['id']}/submit/")

        self._login("manager@example.com", "Manager123!")
        reject = self.client.post(f"/api/v1/bookings/{booking.data['id']}/reject/", {"reason": ""}, format="json")
        self.assertEqual(reject.status_code, status.HTTP_400_BAD_REQUEST)
