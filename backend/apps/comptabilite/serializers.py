from rest_framework import serializers
from .models import (
    Devis, LigneDevis, Facture, LigneFacture, Paiement, Charge,
    StickerAchat, StickerMouvement,
)


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
    client_nom     = serializers.CharField(source="client.nom",  read_only=True)
    client_ncc     = serializers.CharField(source="client.ncc",  read_only=True, default="")
    projet_nom     = serializers.CharField(source="projet.nom",  read_only=True, default="")
    devis_numero   = serializers.CharField(source="devis.numero", read_only=True, default="")
    devis_source   = serializers.SerializerMethodField()
    avoirs         = serializers.SerializerMethodField()
    facture_origine_numero = serializers.CharField(source="facture_origine.numero_local", read_only=True, default="")
    centre_cout_display = serializers.CharField(source="get_centre_cout_display", read_only=True, default="")
    total_ht       = serializers.ReadOnlyField()
    total_tva      = serializers.ReadOnlyField()
    total_ttc      = serializers.ReadOnlyField()
    solde_restant  = serializers.ReadOnlyField()
    est_certifiee  = serializers.ReadOnlyField()
    est_verrouillee = serializers.ReadOnlyField()
    fne_qr         = serializers.SerializerMethodField()
    lignes         = LigneFactureSerializer(many=True, read_only=True)

    def get_devis_source(self, obj):
        if obj.devis_id is None:
            return None
        return {"id": obj.devis_id, "numero": obj.devis.numero}

    def get_fne_qr(self, obj):
        """QR code (base64 PNG) — uniquement sur le détail (retrieve), pas en liste."""
        view = self.context.get("view")
        if not obj.fne_token or (view is not None and getattr(view, "action", None) == "list"):
            return None
        from .utils.pdf_generator import _generer_qr_base64
        return _generer_qr_base64(obj.fne_token)

    def get_avoirs(self, obj):
        """Avoirs émis sur cette facture (résumé) — vide en liste."""
        view = self.context.get("view")
        if view is not None and getattr(view, "action", None) == "list":
            return []
        return [
            {
                "id": a.id,
                "numero_local": a.numero_local,
                "fne_reference": a.fne_reference,
                "statut": a.statut,
                "total_ttc": a.total_ttc,
                "created_at": a.created_at,
            }
            for a in obj.avoirs.all()
        ]

    class Meta:
        model  = Facture
        fields = [
            "id", "numero_local",
            "fne_reference", "fne_token", "fne_qr", "fne_balance_sticker",
            "fne_invoice_id", "fne_certifiee_at",
            "client", "client_nom", "client_ncc", "devis", "devis_numero", "devis_source",
            "projet", "projet_nom", "centre_cout", "centre_cout_display",
            "facture_origine", "facture_origine_numero", "avoirs",
            "type_facture", "statut", "date_echeance",
            "mode_reglement", "template_fne",
            "montant_paye", "total_ht", "total_tva", "total_ttc",
            "solde_restant", "est_certifiee", "est_verrouillee", "notes", "lignes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "numero_local", "facture_origine",
            "fne_reference", "fne_token", "fne_qr", "fne_balance_sticker",
            "fne_invoice_id", "fne_certifiee_at",
            "montant_paye", "total_ht", "total_tva", "total_ttc",
            "solde_restant", "est_certifiee", "est_verrouillee", "created_at", "updated_at",
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


# ── Stickers FNE ────────────────────────────────────────────────────────────────

class StickerMouvementSerializer(serializers.ModelSerializer):
    type_display    = serializers.CharField(source="get_type_mouvement_display", read_only=True)
    facture_numero  = serializers.CharField(source="facture.numero_local", read_only=True, default="")

    class Meta:
        model  = StickerMouvement
        fields = [
            "id", "type_mouvement", "type_display", "quantite", "solde_apres",
            "facture", "facture_numero", "achat", "notes", "created_at",
        ]
        read_only_fields = fields


class StickerAchatSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StickerAchat
        fields = [
            "id", "date", "quantite", "montant", "mode_paiement",
            "reference", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
