from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AllocationViewSet, BookingApplicationViewSet

router = DefaultRouter()
router.register(r"bookings", BookingApplicationViewSet, basename="bookings")
router.register(r"allocations", AllocationViewSet, basename="allocations")

urlpatterns = [
    path("", include(router.urls)),
]
