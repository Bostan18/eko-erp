from django.contrib import admin
from .models import Projet, IntervenantProjet


class IntervenantInline(admin.TabularInline):
    model = IntervenantProjet
    extra = 1
    autocomplete_fields = ["employe"]


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
