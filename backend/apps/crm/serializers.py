from rest_framework import serializers
from .models import Client, Devis, Opportunite, Contrat


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id", "code", "nom", "ncc", "type_client", "secteur", "statut",
            "telephone", "email", "localite", "notes", "date_premier_contact",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class OpportuniteSerializer(serializers.ModelSerializer):
    client_nom          = serializers.CharField(source="client.nom", read_only=True)
    phase_display       = serializers.CharField(source="get_phase_display", read_only=True)
    centre_cout_display = serializers.CharField(source="centre_cout.nom", read_only=True, default="")
    valeur_ponderee     = serializers.ReadOnlyField()
    est_ouverte         = serializers.ReadOnlyField()

    class Meta:
        model  = Opportunite
        fields = [
            "id", "titre", "client", "client_nom", "phase", "phase_display",
            "probabilite", "valeur_estimee", "valeur_ponderee",
            "centre_cout", "centre_cout_display", "date_cloture_prevue",
            "est_ouverte", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "valeur_ponderee", "est_ouverte", "created_at", "updated_at"]


class ContratSerializer(serializers.ModelSerializer):
    client_nom          = serializers.CharField(source="client.nom", read_only=True)
    type_display        = serializers.CharField(source="get_type_contrat_display", read_only=True)
    statut_display      = serializers.CharField(source="get_statut_display", read_only=True)
    centre_cout_display = serializers.CharField(source="centre_cout.nom", read_only=True, default="")

    class Meta:
        model  = Contrat
        fields = [
            "id", "numero", "client", "client_nom", "objet",
            "type_contrat", "type_display", "montant",
            "centre_cout", "centre_cout_display",
            "date_debut", "date_fin", "reconduction_tacite",
            "statut", "statut_display", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "numero", "created_at", "updated_at"]


class DevisSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True)

    class Meta:
        model = Devis
        fields = [
            "id", "numero", "client", "client_nom", "objet",
            "montant_ht", "taux_tva", "montant_ttc", "statut",
            "date_emission", "date_validite", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
