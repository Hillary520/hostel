from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdmin
from config.constants import ROLE_STUDENT

from .models import PaymentInvoice, PaymentTransaction
from .serializers import PaymentInvoiceSerializer, PaymentTransactionSerializer
from .services import create_payment_transaction, set_simulated_invoice_status, verify_payment


class PaymentInvoiceViewSet(viewsets.ModelViewSet):
    queryset = PaymentInvoice.objects.select_related("student").all().order_by("-created_at")
    serializer_class = PaymentInvoiceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["student", "term", "status"]
    search_fields = ["student__email", "student__full_name", "term"]
    ordering_fields = ["created_at", "due_date", "amount_due"]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == ROLE_STUDENT:
            return qs.filter(student=self.request.user)
        return qs

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "add_payment", "set_status"}:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], url_path="payments")
    def add_payment(self, request, pk=None):
        invoice = self.get_object()

        data = request.data.copy()
        data["invoice"] = invoice.id
        serializer = PaymentTransactionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        txn = create_payment_transaction(
            invoice=invoice,
            reference=serializer.validated_data["reference"],
            method=serializer.validated_data["method"],
            amount=serializer.validated_data["amount"],
            paid_at=serializer.validated_data["paid_at"],
            receipt_file=serializer.validated_data.get("receipt_file"),
        )
        return Response(PaymentTransactionSerializer(txn).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request, pk=None):
        invoice = self.get_object()
        status_value = request.data.get("status")
        if not status_value:
            return Response({"detail": "status is required"}, status=status.HTTP_400_BAD_REQUEST)
        updated = set_simulated_invoice_status(invoice=invoice, actor=request.user, status=status_value)
        return Response(self.get_serializer(updated).data, status=status.HTTP_200_OK)


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentTransaction.objects.select_related("invoice", "verified_by").all().order_by("-created_at")
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["invoice", "verification_status", "method"]
    search_fields = ["reference", "invoice__student__email", "invoice__student__full_name"]
    ordering_fields = ["created_at", "paid_at", "amount"]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == ROLE_STUDENT:
            return qs.filter(invoice__student=self.request.user)
        return qs

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin], url_path="verify")
    def verify(self, request, pk=None):
        payment = self.get_object()
        approved = bool(request.data.get("approved", True))
        updated = verify_payment(payment=payment, verifier=request.user, approved=approved)
        return Response(self.get_serializer(updated).data)
