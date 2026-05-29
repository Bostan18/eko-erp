from rest_framework import serializers
from .models import Article, MouvementStock, LotBiologique, TraceurRFID, Dechet


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


# ── Sprint 7 ─────────────────────────────────────────────────────────────────

class LotBiologiqueSerializer(serializers.ModelSerializer):
    article_nom        = serializers.CharField(source="article.nom", read_only=True)
    site_nom           = serializers.CharField(source="site.nom", read_only=True, default="")
    site_code          = serializers.CharField(source="site.code", read_only=True, default="")
    etat_sante_display = serializers.CharField(source="get_etat_sante_display", read_only=True)
    taux_survie        = serializers.ReadOnlyField()
    phase              = serializers.ReadOnlyField()
    en_alerte          = serializers.ReadOnlyField()

    class Meta:
        model  = LotBiologique
        fields = [
            "id", "code", "article", "article_nom", "espece",
            "site", "site_nom", "site_code",
            "date_semis", "date_repiquage",
            "quantite_initiale", "quantite_actuelle",
            "etat_sante", "etat_sante_display",
            "taux_survie", "phase", "en_alerte", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "code", "taux_survie", "phase", "en_alerte",
            "created_at", "updated_at",
        ]


class TraceurRFIDSerializer(serializers.ModelSerializer):
    article_nom     = serializers.CharField(source="article.nom", read_only=True)
    article_code    = serializers.CharField(source="article.code", read_only=True)
    site_nom        = serializers.CharField(source="site.nom", read_only=True, default="")
    site_code       = serializers.CharField(source="site.code", read_only=True, default="")
    statut_display  = serializers.CharField(source="get_statut_display", read_only=True)
    est_disponible  = serializers.ReadOnlyField()

    class Meta:
        model  = TraceurRFID
        fields = [
            "id", "tag_uid",
            "article", "article_nom", "article_code",
            "site", "site_nom", "site_code",
            "quantite", "statut", "statut_display", "est_disponible",
            "date_pose", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "est_disponible", "created_at", "updated_at"]


class DechetSerializer(serializers.ModelSerializer):
    type_dechet_display     = serializers.CharField(source="get_type_dechet_display", read_only=True)
    unite_display           = serializers.CharField(source="get_unite_display", read_only=True)
    mode_traitement_display = serializers.CharField(source="get_mode_traitement_display", read_only=True)
    projet_nom              = serializers.CharField(source="origine_projet.nom", read_only=True, default="")
    site_nom                = serializers.CharField(source="origine_site.nom", read_only=True, default="")

    class Meta:
        model  = Dechet
        fields = [
            "id", "type_dechet", "type_dechet_display",
            "quantite", "unite", "unite_display", "date",
            "origine_projet", "projet_nom",
            "origine_site", "site_nom",
            "mode_traitement", "mode_traitement_display",
            "est_valorise", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "est_valorise", "created_at", "updated_at"]
