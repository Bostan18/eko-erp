from django.db import models
from django.db.models import Sum
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
    centre_cout = models.ForeignKey("core.CentreCout", null=True, blank=True, on_delete=models.SET_NULL, related_name="projets")
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


class TacheProjet(SoftDeleteModel):
    TYPE_OBJECTIF_CHOICES = [
        ("surface", "Surface (m²)"),
        ("volume", "Volume (m³)"),
        ("unite", "Unité"),
        ("lineaire", "Linéaire (m)"),
        ("forfait", "Forfait"),
    ]
    STATUT_CHOICES = [
        ("a_faire", "À faire"),
        ("en_cours", "En cours"),
        ("terminee", "Terminée"),
        ("annulee", "Annulée"),
    ]

    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name="taches")
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type_objectif = models.CharField(max_length=20, choices=TYPE_OBJECTIF_CHOICES, default="unite")
    unite_label = models.CharField(max_length=50, blank=True, help_text="Ex: m², sacs, ml")
    objectif_cible = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarif_unitaire = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus_objectif_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    date_debut = models.DateField(null=True, blank=True)
    date_fin_prevue = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="a_faire")

    class Meta:
        verbose_name = "Tâche projet"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.projet.code} — {self.nom}"

    @property
    def total_realise(self):
        return self.affectations.aggregate(
            total=Sum("realisations__quantite_realisee")
        )["total"] or 0

    @property
    def progression_pct(self):
        if not self.objectif_cible:
            return 0
        return min(100, round(float(self.total_realise) / float(self.objectif_cible) * 100, 1))


class AffectationTache(TimeStampedModel):
    tache = models.ForeignKey(TacheProjet, on_delete=models.CASCADE, related_name="affectations")
    employe = models.ForeignKey(
        "rh.Employe", on_delete=models.PROTECT, related_name="affectations_taches"
    )
    date_affectation = models.DateField()
    objectif_individuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Affectation tâche"
        unique_together = ["tache", "employe", "date_affectation"]

    def __str__(self):
        return f"{self.employe} → {self.tache.nom} ({self.date_affectation})"

    @property
    def total_realise(self):
        return self.realisations.aggregate(total=Sum("quantite_realisee"))["total"] or 0

    @property
    def total_montant(self):
        return self.realisations.aggregate(total=Sum("montant_calcule"))["total"] or 0

    @property
    def progression_pct(self):
        if not self.objectif_individuel:
            return 0
        return min(100, round(float(self.total_realise) / float(self.objectif_individuel) * 100, 1))


class RealisationTache(TimeStampedModel):
    affectation = models.ForeignKey(AffectationTache, on_delete=models.CASCADE, related_name="realisations")
    date = models.DateField()
    quantite_realisee = models.DecimalField(max_digits=10, decimal_places=2)
    montant_calcule = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Réalisation tâche"
        ordering = ["date"]

    def __str__(self):
        return f"{self.affectation} — {self.date} — {self.quantite_realisee}"

    def save(self, *args, **kwargs):
        self.montant_calcule = self.quantite_realisee * self.affectation.tache.tarif_unitaire
        super().save(*args, **kwargs)
