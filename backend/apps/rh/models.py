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
    site = models.ForeignKey(
        "operations.Site", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="presences",
    )
    notes = models.CharField(max_length=300, blank=True)
    paye_le = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Présence journalière"
        unique_together = ["employe", "date"]
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        if self.employe.taux_journalier and self.present:
            self.montant_du = self.employe.taux_journalier
        super().save(*args, **kwargs)


class BulletinPaie(TimeStampedModel):
    """Bulletin mensuel pour les CDI. MVP : brut = net (pas de retenues)."""
    STATUT_CHOICES = [("genere", "Généré"), ("paye", "Payé")]

    employe = models.ForeignKey(Employe, on_delete=models.PROTECT, related_name="bulletins")
    mois = models.DateField(help_text="1er jour du mois concerné (ex: 2026-05-01)")
    brut = models.DecimalField(max_digits=12, decimal_places=2)
    net = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="genere")
    paye_le = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Bulletin de paie"
        unique_together = ["employe", "mois"]
        ordering = ["-mois", "employe__nom"]

    def __str__(self):
        return f"{self.employe.code} — {self.mois.strftime('%Y-%m')}"


class MissionMoo(TimeStampedModel):
    """Mission ponctuelle d'un employé MOO, payée au forfait."""
    employe = models.ForeignKey(
        Employe, on_delete=models.PROTECT, related_name="missions_moo",
        limit_choices_to={"type_contrat": "moo"},
    )
    projet = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="missions_moo",
    )
    description = models.CharField(max_length=300)
    date_debut = models.DateField()
    date_fin = models.DateField()
    montant_forfaitaire = models.DecimalField(max_digits=12, decimal_places=2)
    paye_le = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Mission MOO"
        ordering = ["-date_debut"]

    def __str__(self):
        return f"{self.employe.code} — {self.description[:30]}"
