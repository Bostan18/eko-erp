from django.urls import path
from . import views

urlpatterns = [
    path("kpis/", views.kpis, name="kpis"),
    path("activite-recente/", views.activite_recente, name="activite_recente"),
]
