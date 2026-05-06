from rest_framework import serializers
from .models import Facture, LigneFacture, Paiement, Charge


class LigneFactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneFacture
        fields = "__all__"


class FactureSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True)
    projet_nom = serializers.CharField(source="projet.nom", read_only=True)
    solde_restant = serializers.ReadOnlyField()
    lignes = LigneFactureSerializer(many=True, read_only=True)

    class Meta:
        model = Facture
        fields = "__all__"


class PaiementSerializer(serializers.ModelSerializer):
    facture_numero = serializers.CharField(source="facture.numero", read_only=True)

    class Meta:
        model = Paiement
        fields = "__all__"


class ChargeSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source="projet.nom", read_only=True)

    class Meta:
        model = Charge
        fields = "__all__"
