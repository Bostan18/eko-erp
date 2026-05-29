from rest_framework import serializers
from .models import Engin, Maintenance, ContratLocation


class EnginSerializer(serializers.ModelSerializer):
    type_engin_display       = serializers.CharField(source="get_type_engin_display", read_only=True)
    statut_display           = serializers.CharField(source="get_statut_display", read_only=True)
    site_nom                 = serializers.CharField(source="site_actuel.nom", read_only=True, default="")
    site_code                = serializers.CharField(source="site_actuel.code", read_only=True, default="")
    usure_pct                = serializers.ReadOnlyField()
    heures_avant_revision    = serializers.ReadOnlyField()
    en_alerte_maintenance    = serializers.ReadOnlyField()

    class Meta:
        model  = Engin
        fields = [
            "id", "code", "nom", "type_engin", "type_engin_display",
            "marque", "modele", "immatriculation", "numero_serie",
            "annee_mise_service",
            "heures_compteur", "heures_revision", "duree_vie_estimee_h",
            "prix_achat", "tarif_location_jour",
            "statut", "statut_display",
            "site_actuel", "site_nom", "site_code",
            "usure_pct", "heures_avant_revision", "en_alerte_maintenance",
            "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "code", "usure_pct", "heures_avant_revision", "en_alerte_maintenance",
            "created_at", "updated_at",
        ]


class MaintenanceSerializer(serializers.ModelSerializer):
    engin_code              = serializers.CharField(source="engin.code", read_only=True)
    engin_nom               = serializers.CharField(source="engin.nom", read_only=True)
    type_maintenance_display = serializers.CharField(source="get_type_maintenance_display", read_only=True)

    class Meta:
        model  = Maintenance
        fields = [
            "id", "engin", "engin_code", "engin_nom",
            "type_maintenance", "type_maintenance_display",
            "date_intervention", "heures_compteur_intervention",
            "description", "prochaine_revision_heures",
            "cout", "effectue_par", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ContratLocationSerializer(serializers.ModelSerializer):
    engin_code         = serializers.CharField(source="engin.code", read_only=True)
    engin_nom          = serializers.CharField(source="engin.nom", read_only=True)
    client_nom         = serializers.CharField(source="client.nom", read_only=True, default="")
    projet_nom         = serializers.CharField(source="projet.nom", read_only=True, default="")
    statut_display     = serializers.CharField(source="get_statut_display", read_only=True)
    nb_jours           = serializers.ReadOnlyField()
    montant_facturable = serializers.ReadOnlyField()
    est_externe        = serializers.ReadOnlyField()

    class Meta:
        model  = ContratLocation
        fields = [
            "id", "numero",
            "engin", "engin_code", "engin_nom",
            "client", "client_nom", "projet", "projet_nom",
            "date_debut", "date_fin_prevue", "date_fin_reelle",
            "tarif_jour", "statut", "statut_display",
            "nb_jours", "montant_facturable", "est_externe",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "numero", "nb_jours", "montant_facturable", "est_externe",
            "created_at", "updated_at",
        ]
