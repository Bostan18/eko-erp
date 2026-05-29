from decimal import Decimal

from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Fournisseur, FactureAchat, CompteBancaire, MouvementTresorerie
from .serializers import (
    FournisseurSerializer, FactureAchatSerializer,
    CompteBancaireSerializer, MouvementTresorerieSerializer,
)


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset         = Fournisseur.objects.filter(is_deleted=False)
    serializer_class = FournisseurSerializer
    filterset_fields = ["categorie"]
    search_fields    = ["code", "nom", "ncc"]


class FactureAchatViewSet(viewsets.ModelViewSet):
    queryset         = FactureAchat.objects.select_related("fournisseur", "centre_cout", "projet")
    serializer_class = FactureAchatSerializer
    filterset_fields = ["statut", "fournisseur", "centre_cout", "projet"]
    search_fields    = ["numero", "libelle", "reference", "fournisseur__nom"]


class CompteBancaireViewSet(viewsets.ModelViewSet):
    queryset         = CompteBancaire.objects.all()
    serializer_class = CompteBancaireSerializer
    filterset_fields = ["type_compte", "actif"]


class MouvementTresorerieViewSet(viewsets.ModelViewSet):
    queryset         = MouvementTresorerie.objects.select_related("compte", "facture_achat", "centre_cout")
    serializer_class = MouvementTresorerieSerializer
    filterset_fields = ["compte", "sens", "categorie", "facture_achat", "centre_cout"]
    search_fields    = ["libelle", "reference"]

    @action(detail=False, methods=["get"])
    def kpis(self, request):
        """KPI trésorerie : solde total, entrées/sorties du mois, soldes par compte."""
        today = timezone.now().date()
        comptes = list(CompteBancaire.objects.filter(actif=True))
        solde_total = sum((c.solde_actuel for c in comptes), Decimal("0"))

        mois = MouvementTresorerie.objects.filter(date__month=today.month, date__year=today.year)
        agg = mois.aggregate(
            entrees=Sum("montant", filter=Q(sens="entree")),
            sorties=Sum("montant", filter=Q(sens="sortie")),
        )
        entrees = agg["entrees"] or Decimal("0")
        sorties = agg["sorties"] or Decimal("0")

        return Response({
            "solde_total":    float(solde_total),
            "entrees_mois":   float(entrees),
            "sorties_mois":   float(sorties),
            "flux_net_mois":  float(entrees - sorties),
            "comptes": [
                {"id": c.id, "nom": c.nom, "type_compte": c.type_compte,
                 "solde_actuel": float(c.solde_actuel)}
                for c in comptes
            ],
        })
