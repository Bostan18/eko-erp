from django.db import models
from apps.core.models import SoftDeleteModel, TimeStampedModel

class Employe(SoftDeleteModel):
    TYPE_CHOICES = [("cdi","CDI Permanent"),("journalier","Journalier"),("moo","MOO"),("stagiaire","Stagiaire")]
    STATUT_CHOICES = [("actif","Actif"),("inactif","Inactif"),("conge","En congé")]

    code = models.CharField(max_length=20, unique=True)  # EMP-001
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    type_contrat = models.CharField(max_length=20, choices=TYPE_CHOICES)
    poste = models.CharField(max_length=150, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="actif")
    date_entree = models.DateField(null=True, blank=True)
    salaire_mensuel = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    taux_journalier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "Employé"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.code} — {self.nom} {self.prenom}"

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class PresenceJournaliere(TimeStampedModel):
    """Pointage journalier — crucial pour les journaliers EKO."""
    employe = models.ForeignKey(Employe, on_delete=models.PROTECT, related_name="presences")
    date = models.DateField()
    present = models.BooleanField(default=True)
    heures_travaillees = models.DecimalField(max_digits=4, decimal_places=1, default=8)
    montant_du = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    projet_ref = models.CharField(max_length=50, blank=True)  # FK souple vers Projet
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Présence journalière"
        unique_together = ["employe", "date"]
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        if self.employe.taux_journalier and self.present:
            self.montant_du = self.employe.taux_journalier
        super().save(*args, **kwargs)
