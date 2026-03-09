from django.contrib import admin

from .models import MaintenanceTicket, SystemSetting, VisitorLog


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = ("visitor_name", "allocation", "check_in", "check_out", "approved_by")
    search_fields = ("visitor_name", "id_number", "allocation__student__email")


@admin.register(MaintenanceTicket)
class MaintenanceTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "priority", "status", "room", "bed", "raised_by")
    list_filter = ("priority", "status")
    search_fields = ("category", "description", "raised_by__email")


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "updated_at")
    search_fields = ("key",)
