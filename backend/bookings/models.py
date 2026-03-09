from django.conf import settings
from django.db import models

from hostels.models import Bed, Hostel, RoomType


class BookingApplication(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"
        EXPIRED = "EXPIRED", "Expired"

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="booking_applications")
    academic_term = models.CharField(max_length=64)
    preferred_hostel = models.ForeignKey(Hostel, null=True, blank=True, on_delete=models.SET_NULL, related_name="preferred_bookings")
    preferred_room_type = models.ForeignKey(
        RoomType,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="preferred_bookings",
    )
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_bookings",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking {self.id} - {self.student_id} ({self.status})"


class Allocation(models.Model):
    class Status(models.TextChoices):
        PENDING_CHECKIN = "PENDING_CHECKIN", "Pending check-in"
        ACTIVE = "ACTIVE", "Active"
        VACATED = "VACATED", "Vacated"
        CANCELLED = "CANCELLED", "Cancelled"

    application = models.OneToOneField(BookingApplication, on_delete=models.CASCADE, related_name="allocation")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="allocations")
    bed = models.ForeignKey(Bed, on_delete=models.PROTECT, related_name="allocations")
    check_in_due_date = models.DateField()
    check_in_at = models.DateTimeField(null=True, blank=True)
    expected_checkout_date = models.DateField()
    checkout_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING_CHECKIN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Allocation {self.id} - student {self.student_id}"
