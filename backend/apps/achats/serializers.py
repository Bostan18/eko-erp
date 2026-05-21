from rest_framework import serializers
from .models import Fournisseur, FactureAchat, CompteBancaire, MouvementTresorerie


class FournisseurSerializer(serializers.ModelSerializer):
    categorie_display = serializers.CharField(source="get_categorie_display", read_only=True)
    nb_factures       = serializers.IntegerField(source="factures_achat.count", read_only=True)

    class Meta:
        model  = Fournisseur
        fields = [
            "id", "code", "nom", "ncc", "categorie", "categorie_display",
            "telephone", "email", "localite", "notes", "nb_factures",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]


class FactureAchatSerializer(serializers.ModelSerializer):
    fournisseur_nom     = serializers.CharField(source="fournisseur.nom", read_only=True)
    centre_cout_display = serializers.CharField(source="centre_cout.nom", read_only=True, default="")
    projet_nom          = serializers.CharField(source="projet.nom", read_only=True, default="")
    montant_tva         = serializers.ReadOnlyField()
    total_ttc           = serializers.ReadOnlyField()
    solde_restant       = serializers.ReadOnlyField()

    class Meta:
        model  = FactureAchat
        fields = [
            "id", "numero", "fournisseur", "fournisseur_nom", "reference", "libelle",
            "date", "date_echeance", "montant_ht", "taux_tva", "montant_tva", "total_ttc",
            "centre_cout", "centre_cout_display", "projet", "projet_nom",
            "statut", "montant_paye", "solde_restant", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "numero", "montant_tva", "total_ttc", "solde_restant",
            "montant_paye", "created_at", "updated_at",
        ]


class CompteBancaireSerializer(serializers.ModelSerializer):
    type_compte_display = serializers.CharField(source="get_type_compte_display", read_only=True)
    solde_actuel        = serializers.ReadOnlyField()

    class Meta:
        model  = CompteBancaire
        fields = [
            "id", "nom", "banque", "numero_compte", "type_compte", "type_compte_display",
            "solde_initial", "solde_actuel", "actif", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "solde_actuel", "created_at", "updated_at"]


class MouvementTresorerieSerializer(serializers.ModelSerializer):
    compte_nom          = serializers.CharField(source="compte.nom", read_only=True)
    sens_display        = serializers.CharField(source="get_sens_display", read_only=True)
    categorie_display   = serializers.CharField(source="get_categorie_display", read_only=True)
    facture_achat_numero = serializers.CharField(source="facture_achat.numero", read_only=True, default="")
    centre_cout_display  = serializers.CharField(source="centre_cout.nom", read_only=True, default="")
    montant_signe        = serializers.ReadOnlyField()

    class Meta:
        model  = MouvementTresorerie
        fields = [
            "id", "compte", "compte_nom", "date", "sens", "sens_display",
            "montant", "montant_signe", "categorie", "categorie_display",
            "libelle", "mode", "reference",
            "facture_achat", "facture_achat_numero", "centre_cout", "centre_cout_display",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "montant_signe", "created_at", "updated_at"]
