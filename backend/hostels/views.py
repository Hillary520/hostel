from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS

from accounts.permissions import IsAdminOrManager
from config.constants import ROLE_STUDENT
from .models import Bed, Hostel, Room, RoomType
from .serializers import BedSerializer, HostelSerializer, RoomSerializer, RoomTypeSerializer


class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.select_related("manager").all().order_by("-created_at")
    serializer_class = HostelSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["sex_restriction", "active", "manager"]
    search_fields = ["code", "name"]
    ordering_fields = ["created_at", "code", "name"]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrManager()]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", None) == ROLE_STUDENT:
            return qs.filter(active=True)
        return qs


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.all().order_by("-created_at")
    serializer_class = RoomTypeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    search_fields = ["code", "name"]
    ordering_fields = ["created_at", "code", "name", "monthly_fee"]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related("hostel", "room_type").all().order_by("-created_at")
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["hostel", "room_type", "status", "floor"]
    search_fields = ["room_no", "hostel__name", "hostel__code"]
    ordering_fields = ["created_at", "room_no", "floor"]


class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.select_related("room", "room__hostel").all().order_by("-created_at")
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["room", "status", "room__hostel"]
    search_fields = ["bed_no", "room__room_no", "room__hostel__code"]
    ordering_fields = ["created_at", "bed_no"]
