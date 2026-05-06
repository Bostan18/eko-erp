from django.contrib import admin
from .models import Client, Devis


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "type_client", "secteur", "statut", "telephone", "created_at"]
    list_filter = ["type_client", "secteur", "statut"]
    search_fields = ["code", "nom", "email", "telephone"]
    ordering = ["-created_at"]


@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    list_display = ["numero", "client", "objet", "montant_ttc", "statut", "date_emission", "date_validite"]
    list_filter = ["statut"]
    search_fields = ["numero", "client__nom", "objet"]
    ordering = ["-date_emission"]
    autocomplete_fields = ["client"]
