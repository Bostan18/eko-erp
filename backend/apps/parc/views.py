from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Engin, Maintenance, ContratLocation
from .serializers import EnginSerializer, MaintenanceSerializer, ContratLocationSerializer


class EnginViewSet(viewsets.ModelViewSet):
    queryset         = Engin.objects.filter(is_deleted=False).select_related("site_actuel")
    serializer_class = EnginSerializer
    filterset_fields = ["type_engin", "statut", "site_actuel"]
    search_fields    = ["code", "nom", "marque", "modele", "immatriculation", "numero_serie"]

    @action(detail=False, methods=["get"])
    def kpis(self, request):
        """KPI parc : disponibilité, maintenance, valeur, alertes."""
        qs = self.get_queryset()
        agg = qs.aggregate(
            disponibles=Count("id", filter=Q(statut="disponible")),
            en_chantier=Count("id", filter=Q(statut="en_chantier")),
            en_location=Count("id", filter=Q(statut="en_location")),
            en_maintenance=Count("id", filter=Q(statut="en_maintenance")),
            hors_service=Count("id", filter=Q(statut="hors_service")),
            valeur_parc=Sum("prix_achat"),
        )
        en_alerte = sum(1 for e in qs if e.en_alerte_maintenance)
        return Response({
            "total":          qs.count(),
            "disponibles":    agg["disponibles"],
            "en_chantier":    agg["en_chantier"],
            "en_location":    agg["en_location"],
            "en_maintenance": agg["en_maintenance"],
            "hors_service":   agg["hors_service"],
            "en_alerte":      en_alerte,
            "valeur_parc":    float(agg["valeur_parc"] or 0),
        })


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset         = Maintenance.objects.select_related("engin")
    serializer_class = MaintenanceSerializer
    filterset_fields = ["engin", "type_maintenance"]
    search_fields    = ["description", "effectue_par"]


class ContratLocationViewSet(viewsets.ModelViewSet):
    queryset         = ContratLocation.objects.select_related("engin", "client", "projet")
    serializer_class = ContratLocationSerializer
    filterset_fields = ["engin", "client", "projet", "statut"]
    search_fields    = ["numero", "notes"]
