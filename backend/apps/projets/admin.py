from django.contrib import admin
from .models import Projet, IntervenantProjet, TacheProjet, AffectationTache, RealisationTache


class IntervenantInline(admin.TabularInline):
    model = IntervenantProjet
    extra = 1
    autocomplete_fields = ["employe"]


class AffectationTacheInline(admin.TabularInline):
    model = AffectationTache
    extra = 1
    autocomplete_fields = ["employe"]
    fields = ["employe", "date_affectation", "objectif_individuel"]
    readonly_fields = []


class RealisationTacheInline(admin.TabularInline):
    model = RealisationTache
    extra = 0
    fields = ["date", "quantite_realisee", "montant_calcule", "notes"]
    readonly_fields = ["montant_calcule"]


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "type_projet", "statut", "client", "chef_projet", "date_debut", "date_fin_prevue", "budget_estime"]
    list_filter = ["type_projet", "statut"]
    search_fields = ["code", "nom", "localisation"]
    ordering = ["-created_at"]
    autocomplete_fields = ["client", "chef_projet"]
    inlines = [IntervenantInline]
    date_hierarchy = "date_debut"


@admin.register(IntervenantProjet)
class IntervenantProjetAdmin(admin.ModelAdmin):
    list_display = ["employe", "projet", "role", "date_debut", "date_fin"]
    list_filter = ["projet"]
    search_fields = ["employe__nom", "employe__prenom", "projet__code"]
    autocomplete_fields = ["employe", "projet"]


@admin.register(TacheProjet)
class TacheProjetAdmin(admin.ModelAdmin):
    list_display = ["nom", "projet", "type_objectif", "statut", "objectif_cible", "tarif_unitaire", "date_debut", "date_fin_prevue"]
    list_filter = ["statut", "type_objectif", "projet"]
    search_fields = ["nom", "description", "projet__code"]
    autocomplete_fields = ["projet"]
    inlines = [AffectationTacheInline]


@admin.register(AffectationTache)
class AffectationTacheAdmin(admin.ModelAdmin):
    list_display = ["employe", "tache", "date_affectation", "objectif_individuel"]
    list_filter = ["tache__projet", "date_affectation"]
    search_fields = ["employe__nom", "employe__prenom", "tache__nom"]
    autocomplete_fields = ["employe", "tache"]
    inlines = [RealisationTacheInline]


@admin.register(RealisationTache)
class RealisationTacheAdmin(admin.ModelAdmin):
    list_display = ["affectation", "date", "quantite_realisee", "montant_calcule"]
    list_filter = ["date"]
    search_fields = ["affectation__employe__nom", "affectation__tache__nom"]
    readonly_fields = ["montant_calcule"]
