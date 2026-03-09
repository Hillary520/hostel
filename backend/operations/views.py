from django.db.models import Count, Q, Sum
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsAdminOrManager
from config.constants import ROLE_STUDENT
from bookings.models import Allocation
from finance.models import PaymentInvoice

from .models import MaintenanceTicket, SystemSetting, VisitorLog
from .serializers import MaintenanceTicketSerializer, SystemSettingSerializer, VisitorLogSerializer


class VisitorLogViewSet(viewsets.ModelViewSet):
    queryset = VisitorLog.objects.select_related("allocation", "approved_by").all().order_by("-created_at")
    serializer_class = VisitorLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["allocation", "approved_by"]
    search_fields = ["visitor_name", "id_number", "phone", "allocation__student__email"]
    ordering_fields = ["created_at", "check_in", "check_out"]


class MaintenanceTicketViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceTicket.objects.select_related("room", "bed", "raised_by").all().order_by("-created_at")
    serializer_class = MaintenanceTicketSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "priority", "room", "bed", "raised_by"]
    search_fields = ["category", "description", "raised_by__email", "raised_by__full_name"]
    ordering_fields = ["created_at", "updated_at", "priority"]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == ROLE_STUDENT:
            return qs.filter(raised_by=self.request.user)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role == ROLE_STUDENT:
            serializer.save(raised_by=self.request.user)
            return
        serializer.save()

    def update(self, request, *args, **kwargs):
        if request.user.role == ROLE_STUDENT:
            from rest_framework import status

            return Response({"detail": "Students cannot edit tickets after submission"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role == ROLE_STUDENT:
            from rest_framework import status

            return Response({"detail": "Students cannot edit tickets after submission"}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == ROLE_STUDENT:
            from rest_framework import status

            return Response({"detail": "Students cannot delete tickets"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all().order_by("-created_at")
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["key"]
    search_fields = ["key"]
    ordering_fields = ["created_at", "key"]


class OccupancyReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        total = Allocation.objects.count()
        active = Allocation.objects.filter(status=Allocation.Status.ACTIVE).count()
        pending = Allocation.objects.filter(status=Allocation.Status.PENDING_CHECKIN).count()
        vacated = Allocation.objects.filter(status=Allocation.Status.VACATED).count()

        per_hostel = (
            Allocation.objects.filter(status__in=[Allocation.Status.ACTIVE, Allocation.Status.PENDING_CHECKIN])
            .values("bed__room__hostel__id", "bed__room__hostel__name", "bed__room__hostel__code")
            .annotate(allocated=Count("id"))
            .order_by("bed__room__hostel__name")
        )
        return Response(
            {
                "summary": {
                    "total_allocations": total,
                    "active_allocations": active,
                    "pending_checkin_allocations": pending,
                    "vacated_allocations": vacated,
                },
                "by_hostel": list(per_hostel),
            }
        )


class FinanceReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        total_due = PaymentInvoice.objects.aggregate(total=Sum("amount_due"))["total"] or 0
        by_status = PaymentInvoice.objects.values("status").annotate(count=Count("id"), total=Sum("amount_due")).order_by("status")
        return Response(
            {
                "summary": {
                    "invoices_count": PaymentInvoice.objects.count(),
                    "total_amount_due": total_due,
                },
                "by_status": list(by_status),
            }
        )


class DefaultersReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        defaulters = (
            PaymentInvoice.objects.filter(Q(status=PaymentInvoice.Status.UNPAID) | Q(status=PaymentInvoice.Status.OVERDUE))
            .select_related("student")
            .values("id", "term", "amount_due", "due_date", "status", "student__id", "student__full_name", "student__email")
            .order_by("due_date")
        )
        return Response({"count": len(defaulters), "results": list(defaulters)})
