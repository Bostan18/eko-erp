from rest_framework import serializers
from .models import Client, Devis

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"

class DevisSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True)
    class Meta:
        model = Devis
        fields = "__all__"
