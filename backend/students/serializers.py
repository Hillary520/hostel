from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserSerializer
from config.constants import ROLE_STUDENT
from .models import StudentProfile

User = get_user_model()


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(required=False)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, required=False, source="user")

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "user_id",
            "student_no",
            "program",
            "year_of_study",
            "guardian_name",
            "guardian_phone",
            "registration_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        user_data = validated_data.pop("user", None)
        if user_data is None:
            raise serializers.ValidationError({"user": "user or user_id is required"})

        if isinstance(user_data, User):
            if hasattr(user_data, "student_profile"):
                raise serializers.ValidationError({"user_id": "user already has a student profile"})
            if user_data.role != ROLE_STUDENT:
                user_data.role = ROLE_STUDENT
                user_data.save(update_fields=["role"])
            profile = StudentProfile.objects.create(user=user_data, **validated_data)
            return profile

        user_data["role"] = ROLE_STUDENT
        user = UserSerializer().create(user_data)
        profile = StudentProfile.objects.create(user=user, **validated_data)
        return profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)
        if isinstance(user_data, dict):
            serializer = UserSerializer(instance=instance.user, data=user_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(role=ROLE_STUDENT)

        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
