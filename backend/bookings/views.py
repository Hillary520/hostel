from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminOrManager
from config.constants import ROLE_STUDENT

from .models import Allocation, BookingApplication
from .serializers import AllocationSerializer, BookingApplicationSerializer
from .services import approve_booking, check_in_allocation, reject_booking, submit_booking, vacate_allocation


class BookingApplicationViewSet(viewsets.ModelViewSet):
    queryset = BookingApplication.objects.select_related("student", "preferred_hostel", "preferred_room_type").all().order_by(
        "-created_at"
    )
    serializer_class = BookingApplicationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "academic_term", "student"]
    search_fields = ["student__full_name", "student__email", "academic_term"]
    ordering_fields = ["created_at", "submitted_at", "academic_term"]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == ROLE_STUDENT:
            return qs.filter(student=self.request.user)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role == ROLE_STUDENT:
            serializer.save(student=self.request.user)
        else:
            student = serializer.validated_data.get("student")
            if student is None:
                from rest_framework import serializers

                raise serializers.ValidationError({"student": "student is required for non-student creators"})
            serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        application = self.get_object()
        if request.user.role == ROLE_STUDENT and application.student_id != request.user.id:
            return Response({"detail": "Not permitted"}, status=status.HTTP_403_FORBIDDEN)

        updated = submit_booking(application)
        return Response(self.get_serializer(updated).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrManager])
    def approve(self, request, pk=None):
        application = self.get_object()
        bed_id = request.data.get("bed")
        due_date = request.data.get("check_in_due_date")
        checkout_date = request.data.get("expected_checkout_date")
        notes = request.data.get("notes", "")

        if not bed_id or not due_date or not checkout_date:
            return Response(
                {"detail": "bed, check_in_due_date and expected_checkout_date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            parsed_bed_id = int(bed_id)
            parsed_due_date = date.fromisoformat(due_date)
            parsed_checkout_date = date.fromisoformat(checkout_date)
        except (TypeError, ValueError):
            return Response(
                {"detail": "bed must be an integer and dates must be ISO format (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allocation = approve_booking(
            application=application,
            reviewer=request.user,
            bed_id=parsed_bed_id,
            check_in_due_date=parsed_due_date,
            expected_checkout_date=parsed_checkout_date,
            notes=notes,
        )
        return Response(AllocationSerializer(allocation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrManager])
    def reject(self, request, pk=None):
        application = self.get_object()
        reason = request.data.get("reason", "")
        updated = reject_booking(application=application, reviewer=request.user, reason=reason)
        return Response(self.get_serializer(updated).data)


class AllocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Allocation.objects.select_related("student", "bed", "application", "bed__room").all().order_by("-created_at")
    serializer_class = AllocationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "student", "bed", "application"]
    search_fields = ["student__full_name", "student__email", "bed__bed_no", "application__academic_term"]
    ordering_fields = ["created_at", "check_in_due_date", "expected_checkout_date"]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == ROLE_STUDENT:
            return qs.filter(student=self.request.user)
        return qs

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrManager])
    def check_in(self, request, pk=None):
        allocation = self.get_object()
        updated = check_in_allocation(allocation=allocation, actor=request.user)
        return Response(self.get_serializer(updated).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrManager])
    def vacate(self, request, pk=None):
        allocation = self.get_object()
        updated = vacate_allocation(allocation=allocation, actor=request.user)
        return Response(self.get_serializer(updated).data)
