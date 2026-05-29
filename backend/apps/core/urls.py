from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntrepriseConfigView, TestFNEView, DocumentViewSet, CentreCoutViewSet

router = DefaultRouter()
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"centres-cout", CentreCoutViewSet, basename="centre-cout")

urlpatterns = [
    path("entreprise/",          EntrepriseConfigView.as_view(), name="entreprise-config"),
    path("entreprise/test-fne/", TestFNEView.as_view(),          name="entreprise-test-fne"),
    path("", include(router.urls)),
]
