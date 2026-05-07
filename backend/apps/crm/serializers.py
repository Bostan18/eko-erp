from rest_framework import serializers
from .models import Client, Devis


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id", "code", "nom", "type_client", "secteur", "statut",
            "telephone", "email", "localite", "notes", "date_premier_contact",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


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
