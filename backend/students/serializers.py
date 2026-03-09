from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserSerializer
from config.constants import ROLE_STUDENT
from .models import StudentProfile

User = get_user_model()


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
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
        user_data = validated_data.pop("user")
        user_data["role"] = ROLE_STUDENT
        user = UserSerializer().create(user_data)
        profile = StudentProfile.objects.create(user=user, **validated_data)
        return profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)
        if user_data:
            serializer = UserSerializer(instance=instance.user, data=user_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(role=ROLE_STUDENT)

        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
