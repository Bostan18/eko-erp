from django.contrib import admin
from .models import EntrepriseConfig


@admin.register(EntrepriseConfig)
class EntrepriseConfigAdmin(admin.ModelAdmin):
    fieldsets = [
        ("Identité légale", {
            "fields": ["raison_sociale", "adresse", "telephone", "email", "site_web", "logo"],
        }),
        ("Informations fiscales", {
            "fields": ["ncc", "rccm", "regime_imposition"],
        }),
        ("Connexion FNE API", {
            "fields": ["fne_api_url", "fne_client_id", "fne_client_secret",
                       "fne_establishment_id", "fne_point_of_sale_id", "fne_actif"],
        }),
        ("Paramètres facturation", {
            "fields": ["template_fne_defaut", "prefixe_devis", "prefixe_facture",
                       "tva_defaut", "mentions_legales"],
        }),
    ]

    def has_add_permission(self, request):
        return not EntrepriseConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
