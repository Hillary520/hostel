from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from config.constants import ROLE_ADMIN, ROLE_MANAGER, ROLE_STUDENT
from .models import PaymentInvoice

User = get_user_model()


class PaymentPermissionTests(APITestCase):
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
        self.invoice = PaymentInvoice.objects.create(student=self.student, term="2026-S1", amount_due=1000, due_date=date.today())

    def _login(self, email, password):
        response = self.client.post("/api/v1/auth/login", {"email": email, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_student_cannot_add_payment_transaction(self):
        self._login("student@example.com", "Student123!")
        response = self.client.post(
            f"/api/v1/invoices/{self.invoice.id}/payments/",
            {
                "reference": "REF-123",
                "method": "BANK",
                "amount": "1000.00",
                "paid_at": "2026-01-01T10:00:00Z",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_simulate_payment_status(self):
        self._login("admin@example.com", "Admin123!")
        response = self.client.post(
            f"/api/v1/invoices/{self.invoice.id}/status/",
            {"status": "PAID"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "PAID")

    def test_manager_cannot_simulate_payment_status(self):
        self._login("manager@example.com", "Manager123!")
        response = self.client.post(
            f"/api/v1/invoices/{self.invoice.id}/status/",
            {"status": "PAID"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
