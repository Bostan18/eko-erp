from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.core.models import SoftDeleteModel, TimeStampedModel

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


# ── Opportunité (pipeline commercial) ───────────────────────────────────────────

class Opportunite(TimeStampedModel):
    PHASE_CHOICES = [
        ("prospection",   "Prospection"),
        ("qualification", "Qualification"),
        ("proposition",   "Proposition"),
        ("negociation",   "Négociation"),
        ("gagnee",        "Gagnée"),
        ("perdue",        "Perdue"),
    ]
    # Probabilité indicative par défaut selon la phase (modifiable).
    PROBA_DEFAUT = {
        "prospection": 10, "qualification": 30, "proposition": 50,
        "negociation": 70, "gagnee": 100, "perdue": 0,
    }

    titre               = models.CharField(max_length=200)
    client              = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="opportunites")
    phase               = models.CharField(max_length=15, choices=PHASE_CHOICES, default="prospection")
    probabilite         = models.PositiveSmallIntegerField(default=10, help_text="0 à 100 %")
    valeur_estimee      = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    centre_cout         = models.ForeignKey("core.CentreCout", null=True, blank=True,
                            on_delete=models.SET_NULL, related_name="opportunites")
    date_cloture_prevue = models.DateField(null=True, blank=True)
    notes               = models.TextField(blank=True)

    class Meta:
        verbose_name = "Opportunité"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.titre} — {self.client.nom}"

    @property
    def valeur_ponderee(self):
        return (self.valeur_estimee * self.probabilite / 100).quantize(Decimal("0.01"))

    @property
    def est_ouverte(self):
        return self.phase not in ("gagnee", "perdue")


# ── Contrat ─────────────────────────────────────────────────────────────────────

class Contrat(SoftDeleteModel):
    TYPE_CHOICES = [
        ("prestation",  "Prestation de services"),
        ("location",    "Location"),
        ("maintenance", "Maintenance / Entretien"),
        ("cadre",       "Contrat-cadre"),
        ("autre",       "Autre"),
    ]
    STATUT_CHOICES = [
        ("brouillon", "Brouillon"),
        ("actif",     "Actif"),
        ("suspendu",  "Suspendu"),
        ("expire",    "Expiré"),
        ("resilie",   "Résilié"),
    ]

    numero              = models.CharField(max_length=30, unique=True, editable=False)  # CTR-YYYY-NNNN
    client              = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="contrats")
    objet               = models.CharField(max_length=300)
    type_contrat        = models.CharField(max_length=15, choices=TYPE_CHOICES, default="prestation")
    montant             = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    centre_cout         = models.ForeignKey("core.CentreCout", null=True, blank=True,
                            on_delete=models.SET_NULL, related_name="contrats")
    date_debut          = models.DateField()
    date_fin            = models.DateField(null=True, blank=True)
    reconduction_tacite = models.BooleanField(default=False)
    statut              = models.CharField(max_length=15, choices=STATUT_CHOICES, default="brouillon")
    notes               = models.TextField(blank=True)

    class Meta:
        verbose_name = "Contrat"
        ordering = ["-date_debut", "-created_at"]

    def __str__(self):
        return f"{self.numero} — {self.client.nom}"

    def save(self, *args, **kwargs):
        if not self.numero:
            annee = timezone.now().year
            base = f"CTR-{annee}-"
            dernier = (
                Contrat.objects.filter(numero__startswith=base)
                .order_by("-numero").values_list("numero", flat=True).first()
            )
            try:
                seq = int(dernier.split("-")[-1]) + 1 if dernier else 1
            except (ValueError, IndexError):
                seq = 1
            self.numero = f"{base}{seq:04d}"
        super().save(*args, **kwargs)
