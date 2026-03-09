from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    class RegistrationStatus(models.TextChoices):
        INCOMPLETE = "INCOMPLETE", "Incomplete"
        COMPLETE = "COMPLETE", "Complete"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile")
    student_no = models.CharField(max_length=64, unique=True)
    program = models.CharField(max_length=128)
    year_of_study = models.PositiveIntegerField()
    guardian_name = models.CharField(max_length=255)
    guardian_phone = models.CharField(max_length=32)
    registration_status = models.CharField(
        max_length=32,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.INCOMPLETE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_no} - {self.user.full_name}"
