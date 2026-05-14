from django.contrib import admin
from .models import Devis, LigneDevis, Facture, LigneFacture, Paiement, Charge


# ── Devis ─────────────────────────────────────────────────────────────────────

class LigneDevisInline(admin.TabularInline):
    model  = LigneDevis
    extra  = 1
    fields = ["designation", "quantite", "prix_unitaire", "remise_pct", "taux_tva"]


@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    list_display        = ["numero", "client", "projet", "statut", "date_validite", "created_at"]
    list_filter         = ["statut"]
    search_fields       = ["numero", "client__nom"]
    ordering            = ["-created_at"]
    autocomplete_fields = ["client", "projet"]
    readonly_fields     = ["numero", "created_at", "updated_at"]
    inlines             = [LigneDevisInline]

    @admin.display(description="Total TTC")
    def total_ttc_display(self, obj):
        return f"{obj.total_ttc:,.0f} F"


# ── Facture ───────────────────────────────────────────────────────────────────

class LigneFactureInline(admin.TabularInline):
    model           = LigneFacture
    extra           = 1
    fields          = ["designation", "quantite", "prix_unitaire", "remise_pct", "taux_tva", "total_ht", "montant_ttc"]
    readonly_fields = ["total_ht", "montant_ttc"]


class PaiementInline(admin.TabularInline):
    model  = Paiement
    extra  = 0
    fields = ["date", "montant", "mode", "reference"]


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display        = ["numero_local", "fne_reference", "client", "type_facture", "statut", "total_ttc_display", "fne_certifiee_at", "date_echeance"]
    list_filter         = ["statut", "type_facture", "template_fne"]
    search_fields       = ["numero_local", "fne_reference", "client__nom"]
    ordering            = ["-created_at"]
    autocomplete_fields = ["client", "projet"]
    readonly_fields     = [
        "numero_local",
        "fne_reference", "fne_token", "fne_balance_sticker", "fne_invoice_id", "fne_certifiee_at",
        "montant_paye", "total_ht", "total_tva", "total_ttc", "solde_restant", "est_certifiee",
        "created_at", "updated_at",
    ]
    inlines             = [LigneFactureInline, PaiementInline]

    @admin.display(description="Total TTC")
    def total_ttc_display(self, obj):
        return f"{obj.total_ttc:,.0f} F"


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display  = ["facture", "date", "montant", "mode", "reference"]
    list_filter   = ["mode"]
    search_fields = ["facture__numero_local", "reference"]
    ordering      = ["-date"]


@admin.register(Charge)
class ChargeAdmin(admin.ModelAdmin):
    list_display        = ["libelle", "categorie", "montant", "date", "projet", "fournisseur"]
    list_filter         = ["categorie", "projet"]
    search_fields       = ["libelle", "fournisseur", "reference"]
    ordering            = ["-date"]
    autocomplete_fields = ["projet"]
    date_hierarchy      = "date"
