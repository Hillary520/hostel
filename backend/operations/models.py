from django.conf import settings
from django.db import models

from bookings.models import Allocation
from hostels.models import Bed, Room


class VisitorLog(models.Model):
    allocation = models.ForeignKey(Allocation, on_delete=models.CASCADE, related_name="visitors")
    visitor_name = models.CharField(max_length=255)
    id_number = models.CharField(max_length=64)
    phone = models.CharField(max_length=32)
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="approved_visitors")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.visitor_name} - alloc {self.allocation_id}"


class MaintenanceTicket(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    room = models.ForeignKey(Room, null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets")
    bed = models.ForeignKey(Bed, null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets")
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="maintenance_tickets")
    category = models.CharField(max_length=100)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.MEDIUM)
    description = models.TextField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ticket {self.id} - {self.status}"


class SystemSetting(models.Model):
    key = models.CharField(max_length=128, unique=True)
    value_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
