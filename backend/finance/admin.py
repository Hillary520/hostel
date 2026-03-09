from django.contrib import admin

from .models import PaymentInvoice, PaymentTransaction


@admin.register(PaymentInvoice)
class PaymentInvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "term", "amount_due", "due_date", "status")
    list_filter = ("status", "term")
    search_fields = ("student__email", "student__full_name", "term")


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("reference", "invoice", "amount", "method", "verification_status", "verified_by", "paid_at")
    list_filter = ("verification_status", "method")
    search_fields = ("reference", "invoice__student__email", "invoice__student__full_name")
