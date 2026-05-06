from rest_framework import serializers
from .models import Employe, PresenceJournaliere


class EmployeSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model = Employe
        fields = "__all__"


class PresenceJournaliereSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)

    class Meta:
        model = PresenceJournaliere
        fields = "__all__"
