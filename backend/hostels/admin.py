from django.contrib import admin

from .models import Bed, Hostel, Room, RoomType


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "sex_restriction", "capacity", "active", "manager")
    list_filter = ("sex_restriction", "active")
    search_fields = ("code", "name")


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "monthly_fee")
    search_fields = ("code", "name")


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("hostel", "room_no", "floor", "room_type", "bed_count", "status")
    list_filter = ("status", "hostel")
    search_fields = ("room_no", "hostel__code", "hostel__name")


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ("room", "bed_no", "status")
    list_filter = ("status", "room__hostel")
    search_fields = ("bed_no", "room__room_no", "room__hostel__name")
