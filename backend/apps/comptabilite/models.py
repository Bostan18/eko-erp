from django.db import models
from apps.core.models import SoftDeleteModel, TimeStampedModel


class Facture(SoftDeleteModel):
    STATUT_CHOICES = [
        ("brouillon",  "Brouillon"),
        ("envoyee",    "Envoyée"),
        ("partiellement_payee", "Partiellement payée"),
        ("payee",      "Payée"),
        ("en_retard",  "En retard"),
        ("annulee",    "Annulée"),
    ]

    numero = models.CharField(max_length=30, unique=True)  # FAC-001
    client = models.ForeignKey(
        "crm.Client", on_delete=models.PROTECT, related_name="factures"
    )
    projet = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="factures"
    )
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default="brouillon")
    date_emission = models.DateField()
    date_echeance = models.DateField()
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    montant_ht = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_paye = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Facture"
        ordering = ["-date_emission"]

    def __str__(self):
        return f"{self.numero} — {self.client.nom}"

    @property
    def solde_restant(self):
        return self.montant_ttc - self.montant_paye

    def recalculer_totaux(self):
        lignes = self.lignes.all()
        self.montant_ht = sum(l.montant_ht for l in lignes)
        self.montant_tva = self.montant_ht * self.taux_tva / 100
        self.montant_ttc = self.montant_ht + self.montant_tva
        self.save()


class LigneFacture(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name="lignes")
    designation = models.CharField(max_length=300)
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    montant_ht = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Ligne de facture"

    def __str__(self):
        return f"{self.designation} ({self.quantite} × {self.prix_unitaire})"

    def save(self, *args, **kwargs):
        self.montant_ht = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)


class Paiement(TimeStampedModel):
    MODE_CHOICES = [
        ("especes",  "Espèces"),
        ("virement", "Virement"),
        ("cheque",   "Chèque"),
        ("mobile",   "Mobile Money"),
    ]

    facture = models.ForeignKey(Facture, on_delete=models.PROTECT, related_name="paiements")
    date = models.DateField()
    montant = models.DecimalField(max_digits=15, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="virement")
    reference = models.CharField(max_length=100, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Paiement"
        ordering = ["-date"]

    def __str__(self):
        return f"Paiement {self.montant} F — {self.facture.numero}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        facture = self.facture
        total_paye = sum(p.montant for p in facture.paiements.all())
        facture.montant_paye = total_paye
        if total_paye >= facture.montant_ttc:
            facture.statut = "payee"
        elif total_paye > 0:
            facture.statut = "partiellement_payee"
        facture.save()


class Charge(SoftDeleteModel):
    CATEGORIE_CHOICES = [
        ("salaire",       "Salaires & charges sociales"),
        ("materiel",      "Matériel & équipement"),
        ("carburant",     "Carburant & transport"),
        ("sous_traitance","Sous-traitance"),
        ("location",      "Location engins"),
        ("fourniture",    "Fournitures"),
        ("autre",         "Autre"),
    ]

    libelle = models.CharField(max_length=300)
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES)
    montant = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    projet = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="charges"
    )
    fournisseur = models.CharField(max_length=200, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Charge"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.libelle} — {self.montant} F ({self.date})"
