from django.contrib import admin

from .models import Allocation, BookingApplication


@admin.register(BookingApplication)
class BookingApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "academic_term", "status", "submitted_at", "reviewed_by")
    list_filter = ("status", "academic_term")
    search_fields = ("student__email", "student__full_name", "academic_term")


@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "bed", "status", "check_in_due_date", "expected_checkout_date")
    list_filter = ("status",)
    search_fields = ("student__email", "student__full_name", "bed__bed_no")
