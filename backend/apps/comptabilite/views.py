from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Facture, LigneFacture, Paiement, Charge
from .serializers import FactureSerializer, LigneFactureSerializer, PaiementSerializer, ChargeSerializer


class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.filter(is_deleted=False).select_related("client", "projet")
    serializer_class = FactureSerializer
    filterset_fields = ["statut", "client", "projet"]
    search_fields = ["numero", "client__nom"]

    @action(detail=False, methods=["get"])
    def en_retard(self, request):
        """Factures dont l'échéance est dépassée et non payées."""
        from django.utils import timezone
        factures = self.get_queryset().filter(
            date_echeance__lt=timezone.now().date(),
            statut__in=["envoyee", "partiellement_payee"]
        )
        return Response(self.get_serializer(factures, many=True).data)


class LigneFactureViewSet(viewsets.ModelViewSet):
    queryset = LigneFacture.objects.select_related("facture")
    serializer_class = LigneFactureSerializer
    filterset_fields = ["facture"]


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related("facture")
    serializer_class = PaiementSerializer
    filterset_fields = ["facture", "mode"]
    search_fields = ["facture__numero", "reference"]


class ChargeViewSet(viewsets.ModelViewSet):
    queryset = Charge.objects.filter(is_deleted=False).select_related("projet")
    serializer_class = ChargeSerializer
    filterset_fields = ["categorie", "projet"]
    search_fields = ["libelle", "fournisseur", "reference"]
