from rest_framework import serializers

from .models import Allocation, BookingApplication


class BookingApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingApplication
        fields = [
            "id",
            "student",
            "academic_term",
            "preferred_hostel",
            "preferred_room_type",
            "status",
            "submitted_at",
            "reviewed_by",
            "reviewed_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "submitted_at", "reviewed_by", "reviewed_at", "created_at", "updated_at"]
        extra_kwargs = {
            "student": {"required": False},
        }


class AllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allocation
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "status", "check_in_at", "checkout_at"]
