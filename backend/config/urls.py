from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_root(request):
    base = request.build_absolute_uri("/")[:-1]
    return JsonResponse({
        "name": "EKO ERP API",
        "version": "1.0",
        "admin": f"{base}/admin/",
        "auth": {
            "obtenir_token": f"{base}/api/token/",
            "rafraichir_token": f"{base}/api/token/refresh/",
            "me": f"{base}/api/auth/me/",
            "users": f"{base}/api/auth/users/",
            "roles": f"{base}/api/auth/roles/",
        },
        "modules": {
            "core": f"{base}/api/core/",
            "crm": f"{base}/api/crm/",
            "projets": f"{base}/api/projets/",
            "comptabilite": f"{base}/api/comptabilite/",
            "achats": f"{base}/api/achats/",
            "stocks": f"{base}/api/stocks/",
            "rh": f"{base}/api/rh/",
            "operations": f"{base}/api/operations/",
            "parc": f"{base}/api/parc/",
            "reporting": f"{base}/api/reporting/",
        },
    }, json_dumps_params={"indent": 2, "ensure_ascii": False})


urlpatterns = [
    path("", api_root, name="api_root"),
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/core/", include("apps.core.urls")),
    path("api/crm/", include("apps.crm.urls")),
    path("api/projets/", include("apps.projets.urls")),
    path("api/comptabilite/", include("apps.comptabilite.urls")),
    path("api/achats/", include("apps.achats.urls")),
    path("api/stocks/", include("apps.stocks.urls")),
    path("api/rh/", include("apps.rh.urls")),
    path("api/operations/", include("apps.operations.urls")),
    path("api/parc/", include("apps.parc.urls")),
    path("api/reporting/", include("apps.reporting.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
