from rest_framework import serializers

from .models import PaymentInvoice, PaymentTransaction


class PaymentInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInvoice
        fields = "__all__"


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = "__all__"
        read_only_fields = ["verified_by", "verification_status", "created_at", "updated_at"]
