from rest_framework import serializers
from .models import EntrepriseConfig, Document


class EntrepriseConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EntrepriseConfig
        fields = [
            "id", "raison_sociale", "adresse", "telephone", "email", "site_web", "logo",
            "ncc", "rccm", "regime_imposition",
            "fne_api_url", "fne_client_id", "fne_client_secret",
            "fne_establishment_id", "fne_point_of_sale_id", "fne_actif",
            "template_fne_defaut", "prefixe_devis", "prefixe_facture",
            "tva_defaut", "mentions_legales",
        ]
        extra_kwargs = {
            "fne_client_secret": {"write_only": False},
        }


class DocumentSerializer(serializers.ModelSerializer):
    statut = serializers.ReadOnlyField()

    class Meta:
        model  = Document
        fields = [
            "id", "id_doc", "titre", "type_doc",
            "entite_type", "entite_id",
            "date_emission", "date_expiration",
            "fichier_url", "notes", "statut",
        ]
        read_only_fields = ["id", "statut"]
