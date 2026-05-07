from rest_framework import serializers
from .models import Article, MouvementStock


class ArticleSerializer(serializers.ModelSerializer):
    en_alerte = serializers.ReadOnlyField()

    class Meta:
        model = Article
        fields = [
            "id", "code", "nom", "categorie", "unite",
            "stock_actuel", "seuil_minimum", "prix_unitaire",
            "fournisseur", "description", "en_alerte",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "en_alerte", "created_at", "updated_at"]


class MouvementStockSerializer(serializers.ModelSerializer):
    article_nom = serializers.CharField(source="article.nom", read_only=True)
    projet_nom = serializers.CharField(source="projet.nom", read_only=True, default="")

    class Meta:
        model = MouvementStock
        fields = [
            "id", "article", "article_nom", "type_mouvement", "quantite",
            "date", "projet", "projet_nom", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
