from rest_framework import serializers
from .models import Employe, PresenceJournaliere


class EmployeSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model = Employe
        fields = [
            "id", "code", "nom", "prenom", "nom_complet", "type_contrat",
            "poste", "telephone", "statut", "date_entree",
            "salaire_mensuel", "taux_journalier",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PresenceJournaliereSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)

    class Meta:
        model = PresenceJournaliere
        fields = [
            "id", "employe", "employe_nom", "date", "present",
            "heures_travaillees", "montant_du", "projet_ref", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "montant_du", "created_at", "updated_at"]
