from django.contrib import admin
from .models import Employe, PresenceJournaliere


@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "prenom", "type_contrat", "poste", "statut", "taux_journalier", "salaire_mensuel"]
    list_filter = ["type_contrat", "statut"]
    search_fields = ["code", "nom", "prenom", "poste"]
    ordering = ["nom", "prenom"]


@admin.register(PresenceJournaliere)
class PresenceJournaliereAdmin(admin.ModelAdmin):
    list_display = ["employe", "date", "present", "heures_travaillees", "montant_du", "projet_ref"]
    list_filter = ["present", "date"]
    search_fields = ["employe__nom", "employe__prenom", "projet_ref"]
    ordering = ["-date"]
    autocomplete_fields = ["employe"]
    date_hierarchy = "date"
