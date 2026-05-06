from rest_framework import serializers
from .models import Projet, IntervenantProjet


class IntervenantProjetSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)

    class Meta:
        model = IntervenantProjet
        fields = "__all__"


class ProjetSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True)
    chef_projet_nom = serializers.CharField(source="chef_projet.nom_complet", read_only=True)
    intervenants = IntervenantProjetSerializer(many=True, read_only=True)

    class Meta:
        model = Projet
        fields = "__all__"
