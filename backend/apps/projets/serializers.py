from rest_framework import serializers
from .models import Projet, IntervenantProjet


class IntervenantProjetSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)

    class Meta:
        model = IntervenantProjet
        fields = [
            "id", "projet", "employe", "employe_nom",
            "role", "date_debut", "date_fin",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProjetSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True, default="")
    chef_projet_nom = serializers.CharField(source="chef_projet.nom_complet", read_only=True, default="")
    intervenants = IntervenantProjetSerializer(many=True, read_only=True)

    class Meta:
        model = Projet
        fields = [
            "id", "code", "nom", "type_projet", "statut",
            "client", "client_nom", "chef_projet", "chef_projet_nom",
            "localisation", "date_debut", "date_fin_prevue", "date_fin_reelle",
            "budget_estime", "description", "notes", "intervenants",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
