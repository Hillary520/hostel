from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.views.generic import TemplateView


class SPAView(TemplateView):
    template_name = "index.html"

    def get(self, request, *args, **kwargs):
        template_path = Path(settings.ROOT_DIR) / "frontend" / "dist" / "index.html"
        if not template_path.exists():
            return HttpResponse(
                "Frontend build not found. Run `npm run build` in /frontend and retry.",
                status=404,
                content_type="text/plain",
            )
        return super().get(request, *args, **kwargs)
