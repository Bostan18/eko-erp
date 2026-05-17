from rest_framework import serializers
from .models import Devis, LigneDevis, Facture, LigneFacture, Paiement, Charge


# ── Devis ─────────────────────────────────────────────────────────────────────

class LigneDevisSerializer(serializers.ModelSerializer):
    total_ht    = serializers.ReadOnlyField()
    montant_tva = serializers.ReadOnlyField()
    montant_ttc = serializers.ReadOnlyField()

    class Meta:
        model  = LigneDevis
        fields = [
            "id", "devis", "designation", "quantite", "prix_unitaire",
            "remise_pct", "taux_tva", "total_ht", "montant_tva", "montant_ttc",
            "created_at",
        ]
        read_only_fields = ["id", "total_ht", "montant_tva", "montant_ttc", "created_at"]


class DevisSerializer(serializers.ModelSerializer):
    client_nom           = serializers.CharField(source="client.nom",  read_only=True)
    projet_nom           = serializers.CharField(source="projet.nom",  read_only=True, default="")
    total_ht             = serializers.ReadOnlyField()
    total_tva            = serializers.ReadOnlyField()
    total_ttc            = serializers.ReadOnlyField()
    lignes               = LigneDevisSerializer(many=True, read_only=True)
    facture_liee_id      = serializers.SerializerMethodField()
    facture_liee_numero  = serializers.SerializerMethodField()

    class Meta:
        model  = Devis
        fields = [
            "id", "numero", "client", "client_nom", "projet", "projet_nom",
            "statut", "date_validite", "remise_globale_pct", "notes",
            "total_ht", "total_tva", "total_ttc", "lignes",
            "facture_liee_id", "facture_liee_numero",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "numero", "total_ht", "total_tva", "total_ttc",
            "facture_liee_id", "facture_liee_numero",
            "created_at", "updated_at",
        ]

    def _facture_liee(self, obj):
        try:
            return obj.facture_liee
        except Facture.DoesNotExist:
            return None

    def get_facture_liee_id(self, obj):
        f = self._facture_liee(obj)
        return f.id if f else None

    def get_facture_liee_numero(self, obj):
        f = self._facture_liee(obj)
        return f.numero_local if f else None


# ── Facture ───────────────────────────────────────────────────────────────────

class LigneFactureSerializer(serializers.ModelSerializer):
    total_ht    = serializers.ReadOnlyField()
    montant_tva = serializers.ReadOnlyField()
    montant_ttc = serializers.ReadOnlyField()

    class Meta:
        model  = LigneFacture
        fields = [
            "id", "facture", "fne_item_id", "designation", "quantite",
            "prix_unitaire", "remise_pct", "taux_tva",
            "total_ht", "montant_tva", "montant_ttc", "created_at",
        ]
        read_only_fields = ["id", "total_ht", "montant_tva", "montant_ttc", "created_at"]


class FactureSerializer(serializers.ModelSerializer):
    client_nom    = serializers.CharField(source="client.nom",          read_only=True)
    projet_nom    = serializers.CharField(source="projet.nom",          read_only=True, default="")
    devis_numero  = serializers.CharField(source="devis.numero",        read_only=True, default="")
    devis_source  = serializers.SerializerMethodField()
    total_ht      = serializers.ReadOnlyField()
    total_tva     = serializers.ReadOnlyField()
    total_ttc     = serializers.ReadOnlyField()
    solde_restant = serializers.ReadOnlyField()
    est_certifiee = serializers.ReadOnlyField()
    lignes        = LigneFactureSerializer(many=True, read_only=True)

    def get_devis_source(self, obj):
        if obj.devis_id is None:
            return None
        return {"id": obj.devis_id, "numero": obj.devis.numero}

    class Meta:
        model  = Facture
        fields = [
            "id", "numero_local",
            "fne_reference", "fne_token", "fne_balance_sticker",
            "fne_invoice_id", "fne_certifiee_at",
            "client", "client_nom", "devis", "devis_numero", "devis_source",
            "projet", "projet_nom",
            "type_facture", "statut", "date_echeance",
            "mode_reglement", "template_fne",
            "montant_paye", "total_ht", "total_tva", "total_ttc",
            "solde_restant", "est_certifiee", "notes", "lignes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "numero_local",
            "fne_reference", "fne_token", "fne_balance_sticker",
            "fne_invoice_id", "fne_certifiee_at",
            "montant_paye", "total_ht", "total_tva", "total_ttc",
            "solde_restant", "est_certifiee", "created_at", "updated_at",
        ]


# ── Paiement ──────────────────────────────────────────────────────────────────

class PaiementSerializer(serializers.ModelSerializer):
    facture_numero = serializers.CharField(source="facture.numero_local", read_only=True)

    class Meta:
        model  = Paiement
        fields = [
            "id", "facture", "facture_numero", "date", "montant",
            "mode", "reference", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Charge ────────────────────────────────────────────────────────────────────

class ChargeSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source="projet.nom", read_only=True, default="")

    class Meta:
        model  = Charge
        fields = [
            "id", "libelle", "categorie", "montant", "date",
            "projet", "projet_nom", "fournisseur", "reference", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
