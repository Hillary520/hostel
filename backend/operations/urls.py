from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DefaultersReportView,
    FinanceReportView,
    MaintenanceTicketViewSet,
    OccupancyReportView,
    SystemSettingViewSet,
    VisitorLogViewSet,
)

router = DefaultRouter()
router.register(r"visitors", VisitorLogViewSet, basename="visitors")
router.register(r"maintenance-tickets", MaintenanceTicketViewSet, basename="maintenance-tickets")
router.register(r"settings", SystemSettingViewSet, basename="settings")

urlpatterns = [
    path("", include(router.urls)),
    path("reports/occupancy", OccupancyReportView.as_view(), name="report-occupancy"),
    path("reports/finance", FinanceReportView.as_view(), name="report-finance"),
    path("reports/defaulters", DefaultersReportView.as_view(), name="report-defaulters"),
]
