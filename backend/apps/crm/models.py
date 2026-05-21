from django.db import models
from apps.core.models import SoftDeleteModel

class Client(SoftDeleteModel):
    TYPE_CHOICES = [("client","Client"),("prospect","Prospect"),("partenaire","Partenaire")]
    SECTEUR_CHOICES = [("agriculture","Agriculture"),("btp","BTP"),("collectivite","Collectivité"),("prive","Privé")]
    STATUT_CHOICES = [("actif","Actif"),("inactif","Inactif"),("negociation","En négociation")]

    code = models.CharField(max_length=20, unique=True)  # CLI-001
    nom = models.CharField(max_length=200)
    ncc = models.CharField(max_length=50, blank=True, verbose_name="N° Compte Contribuable",
                           help_text="NCC du client — requis pour la facturation FNE B2B/B2G")
    type_client = models.CharField(max_length=20, choices=TYPE_CHOICES, default="prospect")
    secteur = models.CharField(max_length=20, choices=SECTEUR_CHOICES, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="actif")
    telephone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    localite = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    date_premier_contact = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Client"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} — {self.nom}"


class Devis(SoftDeleteModel):
    STATUT_CHOICES = [("brouillon","Brouillon"),("envoye","Envoyé"),("accepte","Accepté"),("refuse","Refusé"),("expire","Expiré")]

    numero = models.CharField(max_length=30, unique=True)
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="devis")
    objet = models.CharField(max_length=300)
    montant_ht = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    montant_ttc = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="brouillon")
    date_emission = models.DateField()
    date_validite = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Devis"
        ordering = ["-date_emission"]

    def __str__(self):
        return f"{self.numero} — {self.client.nom}"
