from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StudentProfileViewSet

router = DefaultRouter()
router.register(r"students", StudentProfileViewSet, basename="students")

urlpatterns = [
    path("", include(router.urls)),
]
