from rest_framework.permissions import BasePermission

from config.constants import ROLE_ADMIN, ROLE_MANAGER, ROLE_STUDENT


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == ROLE_ADMIN)


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in {ROLE_ADMIN, ROLE_MANAGER}


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == ROLE_STUDENT)
