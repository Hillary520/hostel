from django.conf import settings
from django.db import models


class Hostel(models.Model):
    class SexRestriction(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        ANY = "ANY", "Any"

    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)
    sex_restriction = models.CharField(max_length=16, choices=SexRestriction.choices, default=SexRestriction.ANY)
    capacity = models.PositiveIntegerField()
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_hostels",
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class RoomType(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    monthly_fee = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Room(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        INACTIVE = "INACTIVE", "Inactive"

    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name="rooms")
    room_no = models.CharField(max_length=32)
    floor = models.IntegerField(default=0)
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name="rooms")
    bed_count = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("hostel", "room_no")

    def __str__(self):
        return f"{self.hostel.code} - {self.room_no}"


class Bed(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        RESERVED = "RESERVED", "Reserved"
        OCCUPIED = "OCCUPIED", "Occupied"
        OUT_OF_SERVICE = "OUT_OF_SERVICE", "Out of service"

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="beds")
    bed_no = models.CharField(max_length=32)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("room", "bed_no")

    def __str__(self):
        return f"{self.room} - Bed {self.bed_no}"
