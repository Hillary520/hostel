from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from audits.services import log_audit_event

from .models import PaymentInvoice, PaymentTransaction


@transaction.atomic
def create_payment_transaction(*, invoice: PaymentInvoice, reference: str, method: str, amount, paid_at=None, receipt_file=None):
    if amount is None or Decimal(amount) <= 0:
        raise serializers.ValidationError("Payment amount must be greater than zero")

    if paid_at is None:
        paid_at = timezone.now()

    txn = PaymentTransaction.objects.create(
        invoice=invoice,
        reference=reference,
        method=method,
        amount=amount,
        paid_at=paid_at,
        receipt_file=receipt_file,
    )
    return txn


@transaction.atomic
def verify_payment(*, payment: PaymentTransaction, verifier, approved: bool):
    locked = PaymentTransaction.objects.select_for_update().select_related("invoice").get(pk=payment.pk)
    if locked.verification_status != PaymentTransaction.VerificationStatus.PENDING:
        raise serializers.ValidationError("Only pending transactions can be verified/rejected")

    before_data = {
        "verification_status": locked.verification_status,
        "invoice_status": locked.invoice.status,
    }

    locked.verification_status = (
        PaymentTransaction.VerificationStatus.VERIFIED
        if approved
        else PaymentTransaction.VerificationStatus.REJECTED
    )
    locked.verified_by = verifier
    locked.save(update_fields=["verification_status", "verified_by", "updated_at"])

    sync_invoice_status(locked.invoice)

    log_audit_event(
        actor=verifier,
        action="payment_verified" if approved else "payment_rejected",
        entity_type="PaymentTransaction",
        entity_id=locked.id,
        before=before_data,
        after={
            "verification_status": locked.verification_status,
            "invoice_status": locked.invoice.status,
        },
    )

    return locked


@transaction.atomic
def sync_invoice_status(invoice: PaymentInvoice):
    verified_total = (
        invoice.transactions.filter(verification_status=PaymentTransaction.VerificationStatus.VERIFIED).aggregate(total=Sum("amount"))["total"]
        or Decimal("0")
    )

    if verified_total >= invoice.amount_due:
        new_status = PaymentInvoice.Status.PAID
    elif verified_total > 0:
        new_status = PaymentInvoice.Status.PARTIAL
    else:
        new_status = PaymentInvoice.Status.PENDING

    if invoice.status != new_status:
        invoice.status = new_status
        invoice.save(update_fields=["status", "updated_at"])

    return invoice


def has_verified_payment_for_term(*, student, term: str) -> bool:
    try:
        invoice = PaymentInvoice.objects.get(student=student, term=term)
    except PaymentInvoice.DoesNotExist:
        return False

    return invoice.status == PaymentInvoice.Status.PAID


@transaction.atomic
def set_simulated_invoice_status(*, invoice: PaymentInvoice, actor, status: str):
    allowed_statuses = {PaymentInvoice.Status.PENDING, PaymentInvoice.Status.PAID}
    if status not in allowed_statuses:
        raise serializers.ValidationError("status must be either PENDING or PAID")

    before_data = {"invoice_status": invoice.status}
    invoice.status = status
    invoice.save(update_fields=["status", "updated_at"])

    log_audit_event(
        actor=actor,
        action="invoice_status_simulated",
        entity_type="PaymentInvoice",
        entity_id=invoice.id,
        before=before_data,
        after={"invoice_status": invoice.status},
    )
    return invoice
