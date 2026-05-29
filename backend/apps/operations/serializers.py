from rest_framework import serializers
from .models import Site, TacheCatalogue


class SiteSerializer(serializers.ModelSerializer):
    type_site_display = serializers.CharField(source="get_type_site_display", read_only=True)
    projet_nom        = serializers.CharField(source="projet.nom", read_only=True, default="")
    projet_code       = serializers.CharField(source="projet.code", read_only=True, default="")
    responsable_nom   = serializers.CharField(source="responsable.nom_complet", read_only=True, default="")

    class Meta:
        model  = Site
        fields = [
            "id", "code", "nom", "type_site", "type_site_display",
            "projet", "projet_nom", "projet_code",
            "responsable", "responsable_nom",
            "localisation", "actif", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]


class TacheCatalogueSerializer(serializers.ModelSerializer):
    type_objectif_display = serializers.CharField(source="get_type_objectif_display", read_only=True)
    activite_display      = serializers.CharField(source="activite.nom", read_only=True, default="")
    activite_couleur      = serializers.CharField(source="activite.couleur", read_only=True, default="")

    class Meta:
        model  = TacheCatalogue
        fields = [
            "id", "code", "libelle",
            "activite", "activite_display", "activite_couleur",
            "type_objectif", "type_objectif_display",
            "unite_label", "tarif_reference", "actif", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]
