from rest_framework import serializers
from .models import Projet, IntervenantProjet, TacheProjet, AffectationTache, RealisationTache


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


class RealisationTacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealisationTache
        fields = [
            "id", "affectation", "date", "quantite_realisee",
            "montant_calcule", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "montant_calcule", "created_at", "updated_at"]


class AffectationTacheSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)
    total_realise = serializers.ReadOnlyField()
    total_montant = serializers.ReadOnlyField()
    progression_pct = serializers.ReadOnlyField()
    realisations = RealisationTacheSerializer(many=True, read_only=True)

    class Meta:
        model = AffectationTache
        fields = [
            "id", "tache", "employe", "employe_nom",
            "date_affectation", "objectif_individuel",
            "total_realise", "total_montant", "progression_pct",
            "realisations", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TacheProjetSerializer(serializers.ModelSerializer):
    total_realise = serializers.ReadOnlyField()
    progression_pct = serializers.ReadOnlyField()
    affectations = AffectationTacheSerializer(many=True, read_only=True)

    class Meta:
        model = TacheProjet
        fields = [
            "id", "projet", "nom", "description", "type_objectif", "unite_label",
            "objectif_cible", "tarif_unitaire", "bonus_objectif_pct",
            "date_debut", "date_fin_prevue", "statut",
            "total_realise", "progression_pct", "affectations",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
