from django.urls import path
from .views import EntrepriseConfigView, TestFNEView

urlpatterns = [
    path("entreprise/",      EntrepriseConfigView.as_view(), name="entreprise-config"),
    path("entreprise/test-fne/", TestFNEView.as_view(),      name="entreprise-test-fne"),
]
