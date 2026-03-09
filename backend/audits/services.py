from typing import Any

from .models import AuditEvent


def log_audit_event(*, actor, action: str, entity_type: str, entity_id: Any, before=None, after=None):
    AuditEvent.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        before_json=before,
        after_json=after,
    )
