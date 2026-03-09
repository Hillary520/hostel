from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PaymentInvoiceViewSet, PaymentTransactionViewSet

router = DefaultRouter()
router.register(r"invoices", PaymentInvoiceViewSet, basename="invoices")
router.register(r"payments", PaymentTransactionViewSet, basename="payments")

urlpatterns = [
    path("", include(router.urls)),
]
