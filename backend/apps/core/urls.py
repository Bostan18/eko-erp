from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntrepriseConfigView, TestFNEView, DocumentViewSet

router = DefaultRouter()
router.register(r"documents", DocumentViewSet, basename="document")

urlpatterns = [
    path("entreprise/",          EntrepriseConfigView.as_view(), name="entreprise-config"),
    path("entreprise/test-fne/", TestFNEView.as_view(),          name="entreprise-test-fne"),
    path("", include(router.urls)),
]
