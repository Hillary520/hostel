from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("action", "entity_type", "entity_id", "actor", "created_at")
    list_filter = ("action", "entity_type")
    search_fields = ("entity_type", "entity_id", "action", "actor__email")
    readonly_fields = ("action", "entity_type", "entity_id", "actor", "before_json", "after_json", "created_at")

    def has_add_permission(self, request):
        return False
