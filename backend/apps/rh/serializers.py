from rest_framework import serializers
from .models import Employe, PresenceJournaliere, BulletinPaie, MissionMoo


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
            "paye_le",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "montant_du", "created_at", "updated_at"]


class BulletinPaieSerializer(serializers.ModelSerializer):
    employe_code = serializers.CharField(source="employe.code", read_only=True)
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)
    employe_poste = serializers.CharField(source="employe.poste", read_only=True)

    class Meta:
        model = BulletinPaie
        fields = [
            "id", "employe", "employe_code", "employe_nom", "employe_poste",
            "mois", "brut", "net", "statut", "paye_le", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MissionMooSerializer(serializers.ModelSerializer):
    employe_code = serializers.CharField(source="employe.code", read_only=True)
    employe_nom = serializers.CharField(source="employe.nom_complet", read_only=True)
    projet_nom = serializers.CharField(source="projet.nom", read_only=True, default="")

    class Meta:
        model = MissionMoo
        fields = [
            "id", "employe", "employe_code", "employe_nom",
            "projet", "projet_nom",
            "description", "date_debut", "date_fin",
            "montant_forfaitaire", "paye_le", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
