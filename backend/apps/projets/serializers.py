from datetime import date

from rest_framework import serializers

from .models import (
    Projet, IntervenantProjet, TacheProjet, AffectationTache, RealisationTache,
    PhotoChantier,
)


# ── Couleurs par type de projet (Sprint 4 — vue Gantt) ────────────────────────
COULEUR_PAR_TYPE = {
    "btp":           "#D85A30",  # coral
    "agriculture":   "#639922",  # green
    "pepiniere":     "#639922",  # green
    "espaces_verts": "#1D9E75",  # teal (développement durable)
    "location":      "#888780",  # gray
}
COULEUR_DEFAUT = "#888780"


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


# ── Vue Gantt (Sprint 4) ──────────────────────────────────────────────────────

class TacheGanttSerializer(serializers.ModelSerializer):
    progression_pct = serializers.ReadOnlyField()

    class Meta:
        model = TacheProjet
        fields = [
            "id", "nom", "date_debut", "date_fin_prevue",
            "statut", "progression_pct",
        ]


class ProjetGanttSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source="client.nom", read_only=True, default="")
    chef_projet_nom = serializers.CharField(source="chef_projet.nom_complet", read_only=True, default="")
    progression_pct = serializers.SerializerMethodField()
    couleur = serializers.SerializerMethodField()
    est_en_retard = serializers.SerializerMethodField()
    taches = serializers.SerializerMethodField()

    class Meta:
        model = Projet
        fields = [
            "id", "code", "nom", "type_projet",
            "client_nom", "chef_projet", "chef_projet_nom",
            "statut", "date_debut", "date_fin_prevue", "date_fin_reelle",
            "progression_pct", "couleur", "est_en_retard", "taches",
        ]

    def get_couleur(self, obj):
        return COULEUR_PAR_TYPE.get(obj.type_projet, COULEUR_DEFAUT)

    def get_taches(self, obj):
        # Prefetched côté view, on garde l'ordre du Meta (created_at)
        taches = [t for t in obj.taches.all() if not t.is_deleted]
        return TacheGanttSerializer(taches, many=True).data

    def get_progression_pct(self, obj):
        taches = [t for t in obj.taches.all() if not t.is_deleted]
        if not taches:
            return 100 if obj.statut == "termine" else 0
        return round(sum(t.progression_pct for t in taches) / len(taches), 1)

    def get_est_en_retard(self, obj):
        if obj.statut != "en_cours":
            return False
        today = date.today()
        if obj.date_fin_prevue and obj.date_fin_prevue < today:
            return True
        # Sous-performance : progression réelle < progression attendue - 10 pts
        if obj.date_debut and obj.date_fin_prevue:
            jours_totaux = (obj.date_fin_prevue - obj.date_debut).days
            if jours_totaux > 0:
                jours_ecoules = (today - obj.date_debut).days
                attendue = max(0, min(100, jours_ecoules / jours_totaux * 100))
                if self.get_progression_pct(obj) < attendue - 10:
                    return True
        return False


# ── Photo de chantier (Sprint PWA) ───────────────────────────────────────────

class PhotoChantierSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    prise_par_username = serializers.CharField(source="prise_par.username", read_only=True)

    class Meta:
        model = PhotoChantier
        fields = [
            "id", "projet", "image", "image_url", "thumbnail_url",
            "latitude", "longitude", "prise_le", "legende",
            "type_photo", "prise_par", "prise_par_username",
            "created_at",
        ]
        read_only_fields = ["id", "image_url", "thumbnail_url", "prise_par", "created_at"]

    def _abs_url(self, field):
        if not field:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(field.url) if request else field.url

    def get_image_url(self, obj):
        return self._abs_url(obj.image)

    def get_thumbnail_url(self, obj):
        return self._abs_url(obj.thumbnail) or self._abs_url(obj.image)
