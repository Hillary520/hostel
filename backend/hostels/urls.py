from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BedViewSet, HostelViewSet, RoomTypeViewSet, RoomViewSet

router = DefaultRouter()
router.register(r"hostels", HostelViewSet, basename="hostels")
router.register(r"room-types", RoomTypeViewSet, basename="room-types")
router.register(r"rooms", RoomViewSet, basename="rooms")
router.register(r"beds", BedViewSet, basename="beds")

urlpatterns = [
    path("", include(router.urls)),
]
