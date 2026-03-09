from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from config.constants import ROLE_ADMIN, ROLE_STUDENT

User = get_user_model()


class AuthAndPermissionTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="Admin123!",
            full_name="Admin",
            role=ROLE_ADMIN,
            is_staff=True,
        )
        self.student = User.objects.create_user(
            email="student@example.com",
            password="Student123!",
            full_name="Student",
            role=ROLE_STUDENT,
        )

    def test_login_and_me(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"email": "admin@example.com", "password": "Admin123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        me = self.client.get("/api/v1/auth/me")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], "admin@example.com")

    def test_student_cannot_access_user_crud(self):
        login = self.client.post(
            "/api/v1/auth/login",
            {"email": "student@example.com", "password": "Student123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
