from django.db import models, transaction
from django.db.models import F
from apps.core.models import SoftDeleteModel, TimeStampedModel


class Article(SoftDeleteModel):
    CATEGORIE_CHOICES = [
        ("intrant", "Intrant agricole"),
        ("materiau", "Matériau BTP"),
        ("equipement", "Équipement"),
        ("consommable", "Consommable"),
        ("piece", "Pièce détachée"),
    ]
    UNITE_CHOICES = [
        ("kg", "Kilogramme"),
        ("l", "Litre"),
        ("m", "Mètre"),
        ("m2", "Mètre carré"),
        ("m3", "Mètre cube"),
        ("u", "Unité"),
        ("sac", "Sac"),
        ("tonne", "Tonne"),
    ]

    code = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=200)
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES)
    unite = models.CharField(max_length=10, choices=UNITE_CHOICES, default="u")
    stock_actuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seuil_minimum = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fournisseur = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Article"
        ordering = ["categorie", "nom"]

    def __str__(self):
        return f"{self.code} — {self.nom}"

    @property
    def en_alerte(self):
        return self.stock_actuel <= self.seuil_minimum


class MouvementStock(TimeStampedModel):
    TYPE_CHOICES = [
        ("entree", "Entrée"),
        ("sortie", "Sortie"),
    ]

    article = models.ForeignKey(Article, on_delete=models.PROTECT, related_name="mouvements")
    type_mouvement = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    projet = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="mouvements_stock"
    )
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Mouvement de stock"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.get_type_mouvement_display()} — {self.article.nom} ({self.quantite} {self.article.unite})"

    def save(self, *args, **kwargs):
        if self.pk is None:
            delta = self.quantite if self.type_mouvement == "entree" else -self.quantite
            with transaction.atomic():
                Article.objects.filter(pk=self.article_id).update(
                    stock_actuel=F("stock_actuel") + delta
                )
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)
