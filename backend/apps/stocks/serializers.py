from rest_framework import serializers
from .models import Article, MouvementStock


class ArticleSerializer(serializers.ModelSerializer):
    en_alerte = serializers.ReadOnlyField()

    class Meta:
        model = Article
        fields = "__all__"


class MouvementStockSerializer(serializers.ModelSerializer):
    article_nom = serializers.CharField(source="article.nom", read_only=True)
    projet_nom = serializers.CharField(source="projet.nom", read_only=True)

    class Meta:
        model = MouvementStock
        fields = "__all__"
