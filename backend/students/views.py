from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminOrManager
from .models import StudentProfile
from .serializers import StudentProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related("user").all().order_by("-created_at")
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["registration_status", "year_of_study", "program"]
    search_fields = ["student_no", "user__full_name", "user__email", "program"]
    ordering_fields = ["created_at", "student_no", "year_of_study"]
