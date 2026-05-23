from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("rapports", views.RapportViewSet)

urlpatterns = [
    path("kpis/", views.kpis, name="kpis"),
    path("activite-recente/", views.activite_recente, name="activite_recente"),
    path("bilan-carbone/", views.bilan_carbone, name="bilan_carbone"),
    path("esg/", views.esg, name="esg"),
    path("", include(router.urls)),
]
