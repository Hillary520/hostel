from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from config.constants import ROLE_MANAGER, ROLE_STUDENT
from .models import MaintenanceTicket

User = get_user_model()


class StudentComplaintTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="student@example.com",
            password="Student123!",
            full_name="Student",
            role=ROLE_STUDENT,
        )
        self.manager = User.objects.create_user(
            email="manager@example.com",
            password="Manager123!",
            full_name="Manager",
            role=ROLE_MANAGER,
        )

    def _login(self, email, password):
        response = self.client.post("/api/v1/auth/login", {"email": email, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_student_can_raise_complaint(self):
        self._login("student@example.com", "Student123!")
        response = self.client.post(
            "/api/v1/maintenance-tickets/",
            {
                "category": "Water",
                "priority": "MEDIUM",
                "description": "Shower has low pressure",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["raised_by"], self.student.id)

    def test_student_cannot_edit_complaint(self):
        ticket = MaintenanceTicket.objects.create(
            raised_by=self.student,
            category="Electrical",
            priority="LOW",
            description="Bulb flickers",
        )
        self._login("student@example.com", "Student123!")
        response = self.client.patch(
            f"/api/v1/maintenance-tickets/{ticket.id}/",
            {"status": "IN_PROGRESS"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_only_sees_own_complaints(self):
        MaintenanceTicket.objects.create(
            raised_by=self.student,
            category="Electrical",
            priority="LOW",
            description="Bulb flickers",
        )
        other_student = User.objects.create_user(
            email="other@example.com",
            password="Student123!",
            full_name="Other",
            role=ROLE_STUDENT,
        )
        MaintenanceTicket.objects.create(
            raised_by=other_student,
            category="Water",
            priority="MEDIUM",
            description="Leak",
        )

        self._login("student@example.com", "Student123!")
        response = self.client.get("/api/v1/maintenance-tickets/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
