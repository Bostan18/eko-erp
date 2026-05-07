from rest_framework import serializers
from .models import Facture, LigneFacture, Paiement, Charge


class LigneFactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneFacture
        fields = ["id", "facture", "designation", "quantite", "prix_unitaire", "montant_ht"]
        read_only_fields = ["id", "montant_ht"]


class FactureSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True)
    projet_nom = serializers.CharField(source="projet.nom", read_only=True, default="")
    solde_restant = serializers.ReadOnlyField()
    lignes = LigneFactureSerializer(many=True, read_only=True)

    class Meta:
        model = Facture
        fields = [
            "id", "numero", "client", "client_nom", "projet", "projet_nom",
            "statut", "date_emission", "date_echeance", "taux_tva",
            "montant_ht", "montant_tva", "montant_ttc", "montant_paye",
            "solde_restant", "notes", "lignes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "montant_tva", "montant_ttc", "montant_paye",
            "solde_restant", "created_at", "updated_at",
        ]


class PaiementSerializer(serializers.ModelSerializer):
    facture_numero = serializers.CharField(source="facture.numero", read_only=True)

    class Meta:
        model = Paiement
        fields = [
            "id", "facture", "facture_numero", "date", "montant",
            "mode", "reference", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChargeSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source="projet.nom", read_only=True, default="")

    class Meta:
        model = Charge
        fields = [
            "id", "libelle", "categorie", "montant", "date",
            "projet", "projet_nom", "fournisseur", "reference", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
