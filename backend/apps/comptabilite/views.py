from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Facture, LigneFacture, Paiement, Charge
from .serializers import FactureSerializer, LigneFactureSerializer, PaiementSerializer, ChargeSerializer
from .exports import facture_excel, facture_pdf, charges_excel


class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.filter(is_deleted=False).select_related("client", "projet")
    serializer_class = FactureSerializer
    filterset_fields = ["statut", "client", "projet"]
    search_fields = ["numero", "client__nom"]

    @action(detail=False, methods=["get"])
    def en_retard(self, request):
        from django.utils import timezone
        factures = self.get_queryset().filter(
            date_echeance__lt=timezone.now().date(),
            statut__in=["envoyee", "partiellement_payee"]
        )
        return Response(self.get_serializer(factures, many=True).data)

    @action(detail=True, methods=["get"])
    def export_excel(self, request, pk=None):
        facture = self.get_object()
        buffer = facture_excel(facture)
        response = HttpResponse(
            buffer,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="facture_{facture.numero}.xlsx"'
        return response

    @action(detail=True, methods=["get"])
    def export_pdf(self, request, pk=None):
        facture = self.get_object()
        buffer = facture_pdf(facture)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="facture_{facture.numero}.pdf"'
        return response


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

    @action(detail=False, methods=["get"])
    def export_excel(self, request):
        qs = self.filter_queryset(self.get_queryset())
        mois  = request.query_params.get("mois", "")
        annee = request.query_params.get("annee", "")
        if mois and annee:
            qs = qs.filter(date__month=mois, date__year=annee)
            titre = f"Charges — {mois}/{annee}"
        else:
            titre = "Charges — Export complet"
        buffer = charges_excel(qs, titre)
        response = HttpResponse(
            buffer,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="charges.xlsx"'
        return response
