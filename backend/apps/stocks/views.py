from django.db import models
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Article, MouvementStock
from .serializers import ArticleSerializer, MouvementStockSerializer


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
