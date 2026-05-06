from django.contrib import admin
from .models import Facture, LigneFacture, Paiement, Charge


class LigneFactureInline(admin.TabularInline):
    model = LigneFacture
    extra = 1
    fields = ["designation", "quantite", "prix_unitaire", "montant_ht"]
    readonly_fields = ["montant_ht"]


class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0
    fields = ["date", "montant", "mode", "reference"]


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ["numero", "client", "projet", "statut", "montant_ttc", "montant_paye", "solde_restant", "date_echeance"]
    list_filter = ["statut"]
    search_fields = ["numero", "client__nom"]
    ordering = ["-date_emission"]
    autocomplete_fields = ["client", "projet"]
    inlines = [LigneFactureInline, PaiementInline]
    date_hierarchy = "date_emission"
    readonly_fields = ["montant_ht", "montant_tva", "montant_ttc", "montant_paye", "solde_restant"]

    @admin.display(description="Solde restant")
    def solde_restant(self, obj):
        return f"{obj.solde_restant:,.0f} F"


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ["facture", "date", "montant", "mode", "reference"]
    list_filter = ["mode"]
    search_fields = ["facture__numero", "reference"]
    ordering = ["-date"]
    autocomplete_fields = ["facture"]


@admin.register(Charge)
class ChargeAdmin(admin.ModelAdmin):
    list_display = ["libelle", "categorie", "montant", "date", "projet", "fournisseur"]
    list_filter = ["categorie", "projet"]
    search_fields = ["libelle", "fournisseur", "reference"]
    ordering = ["-date"]
    autocomplete_fields = ["projet"]
    date_hierarchy = "date"
