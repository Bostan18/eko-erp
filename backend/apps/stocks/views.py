from decimal import Decimal

from django.db import models
from django.db.models import Sum, Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Article, MouvementStock, LotBiologique, TraceurRFID, Dechet
from .serializers import (
    ArticleSerializer, MouvementStockSerializer,
    LotBiologiqueSerializer, TraceurRFIDSerializer, DechetSerializer,
)


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.filter(is_deleted=False)
    serializer_class = ArticleSerializer
    filterset_fields = ["categorie", "unite"]
    search_fields = ["code", "nom", "fournisseur"]

    @action(detail=False, methods=["get"])
    def alertes(self, request):
        """Articles dont le stock est sous le seuil minimum."""
        articles = self.get_queryset().filter(
            stock_actuel__lte=models.F("seuil_minimum")
        )
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)


class MouvementStockViewSet(viewsets.ModelViewSet):
    queryset = MouvementStock.objects.select_related("article", "projet")
    serializer_class = MouvementStockSerializer
    filterset_fields = ["type_mouvement", "article", "projet"]
    search_fields = ["article__nom", "notes"]


# ── Sprint 7 ─────────────────────────────────────────────────────────────────

class LotBiologiqueViewSet(viewsets.ModelViewSet):
    queryset         = LotBiologique.objects.filter(is_deleted=False).select_related("article", "site")
    serializer_class = LotBiologiqueSerializer
    filterset_fields = ["article", "site", "etat_sante"]
    search_fields    = ["code", "espece", "article__nom"]

    @action(detail=False, methods=["get"])
    def kpis_sante(self, request):
        """Indicateurs santé des lots biologiques (pour le module Stocks)."""
        qs = self.get_queryset()
        total = qs.count()
        if not total:
            return Response({
                "total": 0, "taux_survie_moyen": 0,
                "en_alerte": 0, "perdus": 0,
                "par_phase": {"semis": 0, "repiquage": 0, "production": 0, "perdu": 0},
            })

        # Agrégats SQL
        agg = qs.aggregate(
            init=Sum("quantite_initiale"),
            actuel=Sum("quantite_actuelle"),
            perdus=Count("id", filter=Q(etat_sante="perdu")),
        )
        init = float(agg["init"] or 0)
        actuel = float(agg["actuel"] or 0)
        taux = round(actuel / init * 100, 1) if init else 0

        par_phase = {"semis": 0, "repiquage": 0, "production": 0, "perdu": 0}
        en_alerte = 0
        for lot in qs:
            par_phase[lot.phase] = par_phase.get(lot.phase, 0) + 1
            if lot.en_alerte:
                en_alerte += 1

        return Response({
            "total":               total,
            "taux_survie_moyen":   taux,
            "en_alerte":           en_alerte,
            "perdus":              agg["perdus"],
            "par_phase":           par_phase,
        })


class TraceurRFIDViewSet(viewsets.ModelViewSet):
    queryset         = TraceurRFID.objects.select_related("article", "site")
    serializer_class = TraceurRFIDSerializer
    filterset_fields = ["statut", "article", "site"]
    search_fields    = ["tag_uid", "article__nom"]


class DechetViewSet(viewsets.ModelViewSet):
    queryset         = Dechet.objects.select_related("origine_projet", "origine_site")
    serializer_class = DechetSerializer
    filterset_fields = ["type_dechet", "mode_traitement", "est_valorise", "origine_projet", "origine_site"]
    search_fields    = ["notes"]

    @action(detail=False, methods=["get"])
    def synthese(self, request):
        """Synthèse pour ESG : volumes par type + taux de valorisation."""
        qs = self.get_queryset()
        total_qte = qs.aggregate(t=Sum("quantite"))["t"] or Decimal("0")
        valorise_qte = qs.filter(est_valorise=True).aggregate(t=Sum("quantite"))["t"] or Decimal("0")
        taux = round(float(valorise_qte) / float(total_qte) * 100, 1) if total_qte else 0
        par_type = list(
            qs.values("type_dechet")
              .annotate(quantite_totale=Sum("quantite"), nb=Count("id"))
              .order_by("-quantite_totale")
        )
        return Response({
            "total_quantite":       float(total_qte),
            "valorise_quantite":    float(valorise_qte),
            "taux_valorisation":    taux,
            "par_type":             par_type,
        })
