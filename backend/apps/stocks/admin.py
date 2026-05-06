from django.contrib import admin
from .models import Article, MouvementStock


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "categorie", "unite", "stock_actuel", "seuil_minimum", "prix_unitaire", "en_alerte"]
    list_filter = ["categorie", "unite"]
    search_fields = ["code", "nom", "fournisseur"]
    ordering = ["categorie", "nom"]

    @admin.display(boolean=True, description="Alerte stock")
    def en_alerte(self, obj):
        return obj.en_alerte


@admin.register(MouvementStock)
class MouvementStockAdmin(admin.ModelAdmin):
    list_display = ["article", "type_mouvement", "quantite", "date", "projet", "notes"]
    list_filter = ["type_mouvement", "date"]
    search_fields = ["article__nom", "notes"]
    ordering = ["-date"]
    autocomplete_fields = ["article", "projet"]
    date_hierarchy = "date"
