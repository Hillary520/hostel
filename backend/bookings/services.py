from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from audits.services import log_audit_event
from hostels.models import Bed, Room
from students.models import StudentProfile

from .models import Allocation, BookingApplication


def _ensure_student_eligibility(student):
    try:
        profile = StudentProfile.objects.get(user=student)
    except StudentProfile.DoesNotExist as exc:
        raise serializers.ValidationError("Student profile is required before booking submission") from exc

    if profile.registration_status != StudentProfile.RegistrationStatus.COMPLETE:
        raise serializers.ValidationError("Student registration must be complete before submission")

    active_allocation_exists = Allocation.objects.filter(
        student=student,
        status__in=[Allocation.Status.PENDING_CHECKIN, Allocation.Status.ACTIVE],
    ).exists()
    if active_allocation_exists:
        raise serializers.ValidationError("Student already has an active or pending allocation")


def submit_booking(application: BookingApplication):
    if application.status != BookingApplication.Status.DRAFT:
        raise serializers.ValidationError("Only draft bookings can be submitted")

    _ensure_student_eligibility(application.student)
    application.status = BookingApplication.Status.SUBMITTED
    application.submitted_at = timezone.now()
    application.save(update_fields=["status", "submitted_at", "updated_at"])
    return application


@transaction.atomic
def approve_booking(*, application: BookingApplication, reviewer, bed_id: int, check_in_due_date, expected_checkout_date, notes: str = ""):
    locked_application = BookingApplication.objects.select_for_update().get(pk=application.pk)
    if locked_application.status not in [BookingApplication.Status.SUBMITTED, BookingApplication.Status.UNDER_REVIEW]:
        raise serializers.ValidationError("Only submitted/under-review bookings can be approved")

    try:
        bed = Bed.objects.select_for_update().select_related("room").get(pk=bed_id)
    except Bed.DoesNotExist as exc:
        raise serializers.ValidationError({"bed": "Bed not found"}) from exc
    if bed.status == Bed.Status.OUT_OF_SERVICE:
        raise serializers.ValidationError("Cannot allocate out-of-service bed")
    if bed.status in [Bed.Status.RESERVED, Bed.Status.OCCUPIED]:
        raise serializers.ValidationError("Bed is not available")

    try:
        room = Room.objects.select_for_update().get(pk=bed.room_id)
    except Room.DoesNotExist as exc:
        raise serializers.ValidationError({"bed": "Bed is not attached to an active room"}) from exc
    if room.status != Room.Status.ACTIVE:
        raise serializers.ValidationError("Cannot allocate a bed from an inactive/maintenance room")

    existing_active = Allocation.objects.filter(
        student=locked_application.student,
        status__in=[Allocation.Status.PENDING_CHECKIN, Allocation.Status.ACTIVE],
    ).exists()
    if existing_active:
        raise serializers.ValidationError("Student already has an active or pending allocation")

    before_data = {
        "application_status": locked_application.status,
        "bed_status": bed.status,
    }

    allocation = Allocation.objects.create(
        application=locked_application,
        student=locked_application.student,
        bed=bed,
        check_in_due_date=check_in_due_date,
        expected_checkout_date=expected_checkout_date,
        status=Allocation.Status.PENDING_CHECKIN,
    )

    bed.status = Bed.Status.RESERVED
    bed.save(update_fields=["status", "updated_at"])

    locked_application.status = BookingApplication.Status.APPROVED
    locked_application.reviewed_by = reviewer
    locked_application.reviewed_at = timezone.now()
    locked_application.notes = notes
    locked_application.save(update_fields=["status", "reviewed_by", "reviewed_at", "notes", "updated_at"])

    log_audit_event(
        actor=reviewer,
        action="booking_approved",
        entity_type="BookingApplication",
        entity_id=locked_application.id,
        before=before_data,
        after={
            "application_status": locked_application.status,
            "allocation_id": allocation.id,
            "bed_status": bed.status,
        },
    )

    return allocation


@transaction.atomic
def reject_booking(*, application: BookingApplication, reviewer, reason: str):
    if not reason or not reason.strip():
        raise serializers.ValidationError("Rejection reason is required")

    locked_application = BookingApplication.objects.select_for_update().get(pk=application.pk)
    if locked_application.status not in [BookingApplication.Status.SUBMITTED, BookingApplication.Status.UNDER_REVIEW]:
        raise serializers.ValidationError("Only submitted/under-review bookings can be rejected")

    before_data = {"application_status": locked_application.status, "notes": locked_application.notes}

    locked_application.status = BookingApplication.Status.REJECTED
    locked_application.reviewed_by = reviewer
    locked_application.reviewed_at = timezone.now()
    locked_application.notes = reason
    locked_application.save(update_fields=["status", "reviewed_by", "reviewed_at", "notes", "updated_at"])

    log_audit_event(
        actor=reviewer,
        action="booking_rejected",
        entity_type="BookingApplication",
        entity_id=locked_application.id,
        before=before_data,
        after={"application_status": locked_application.status, "notes": locked_application.notes},
    )

    return locked_application


@transaction.atomic
def check_in_allocation(*, allocation: Allocation, actor):
    from finance.services import has_verified_payment_for_term

    locked = Allocation.objects.select_for_update().select_related("application", "bed").get(pk=allocation.pk)
    if locked.status != Allocation.Status.PENDING_CHECKIN:
        raise serializers.ValidationError("Only pending check-in allocations can be checked in")

    term = locked.application.academic_term
    if not has_verified_payment_for_term(student=locked.student, term=term):
        raise serializers.ValidationError("Verified payment for the current term is required")

    before_data = {"allocation_status": locked.status, "bed_status": locked.bed.status}

    locked.status = Allocation.Status.ACTIVE
    locked.check_in_at = timezone.now()
    locked.save(update_fields=["status", "check_in_at", "updated_at"])

    locked.bed.status = Bed.Status.OCCUPIED
    locked.bed.save(update_fields=["status", "updated_at"])

    log_audit_event(
        actor=actor,
        action="allocation_checked_in",
        entity_type="Allocation",
        entity_id=locked.id,
        before=before_data,
        after={"allocation_status": locked.status, "bed_status": locked.bed.status},
    )

    return locked


@transaction.atomic
def vacate_allocation(*, allocation: Allocation, actor):
    locked = Allocation.objects.select_for_update().select_related("bed").get(pk=allocation.pk)
    if locked.status != Allocation.Status.ACTIVE:
        raise serializers.ValidationError("Only active allocations can be vacated")

    before_data = {"allocation_status": locked.status, "bed_status": locked.bed.status}

    locked.status = Allocation.Status.VACATED
    locked.checkout_at = timezone.now()
    locked.save(update_fields=["status", "checkout_at", "updated_at"])

    locked.bed.status = Bed.Status.AVAILABLE
    locked.bed.save(update_fields=["status", "updated_at"])

    log_audit_event(
        actor=actor,
        action="allocation_vacated",
        entity_type="Allocation",
        entity_id=locked.id,
        before=before_data,
        after={"allocation_status": locked.status, "bed_status": locked.bed.status},
    )

    return locked
