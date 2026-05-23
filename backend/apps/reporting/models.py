from django.db import models
from apps.core.models import TimeStampedModel


class Rapport(TimeStampedModel):
    """Rapport BI généré et conservé pour l'historique."""
    TYPE_CHOICES = [
        ("bilan_carbone", "Bilan Carbone"),
        ("esg",           "Rapport ESG"),
        ("operations",    "Synthèse opérationnelle"),
    ]

    titre           = models.CharField(max_length=200)
    type_rapport    = models.CharField(max_length=20, choices=TYPE_CHOICES)
    periode_debut   = models.DateField()
    periode_fin     = models.DateField()
    genere_par      = models.CharField(max_length=150, blank=True)
    notes           = models.TextField(blank=True)

    class Meta:
        verbose_name = "Rapport BI"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_rapport_display()} — {self.titre}"
