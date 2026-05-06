from django.db import models
from apps.core.models import SoftDeleteModel, TimeStampedModel


class Projet(SoftDeleteModel):
    TYPE_CHOICES = [
        ("btp", "BTP"),
        ("agriculture", "Agriculture"),
        ("pepiniere", "Pépinière"),
        ("location", "Location"),
        ("espaces_verts", "Espaces verts"),
    ]
    STATUT_CHOICES = [
        ("planifie", "Planifié"),
        ("en_cours", "En cours"),
        ("suspendu", "Suspendu"),
        ("termine", "Terminé"),
        ("annule", "Annulé"),
    ]

    code = models.CharField(max_length=20, unique=True)  # PRJ-001
    nom = models.CharField(max_length=200)
    type_projet = models.CharField(max_length=20, choices=TYPE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="planifie")
    client = models.ForeignKey(
        "crm.Client", on_delete=models.PROTECT, related_name="projets", null=True, blank=True
    )
    chef_projet = models.ForeignKey(
        "rh.Employe", on_delete=models.SET_NULL, null=True, blank=True, related_name="projets_diriges"
    )
    localisation = models.CharField(max_length=300, blank=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin_prevue = models.DateField(null=True, blank=True)
    date_fin_reelle = models.DateField(null=True, blank=True)
    budget_estime = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Projet"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} — {self.nom}"


class IntervenantProjet(TimeStampedModel):
    """Affectation d'un employé à un projet."""
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name="intervenants")
    employe = models.ForeignKey(
        "rh.Employe", on_delete=models.PROTECT, related_name="affectations"
    )
    role = models.CharField(max_length=150, blank=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Intervenant projet"
        unique_together = ["projet", "employe"]

    def __str__(self):
        return f"{self.employe} → {self.projet.code}"
