from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from .views import SPAView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("students.urls")),
    path("api/v1/", include("hostels.urls")),
    path("api/v1/", include("bookings.urls")),
    path("api/v1/", include("finance.urls")),
    path("api/v1/", include("operations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|media/).*$", SPAView.as_view(), name="spa-catchall"),
]
