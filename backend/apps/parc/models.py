from decimal import Decimal
from datetime import date

from django.db import models
from django.utils import timezone
from apps.core.models import SoftDeleteModel, TimeStampedModel


def _next_seq(model_class, champ, prefixe, avec_annee=False):
    if avec_annee:
        base = f"{prefixe}-{timezone.now().year}-"
    else:
        base = f"{prefixe}-"
    dernier = (
        model_class.objects.filter(**{f"{champ}__startswith": base})
        .order_by(f"-{champ}").values_list(champ, flat=True).first()
    )
    try:
        seq = int(dernier.split("-")[-1]) + 1 if dernier else 1
    except (ValueError, IndexError):
        seq = 1
    return f"{base}{seq:04d}" if avec_annee else f"{base}{seq:03d}"


# ── Engin ────────────────────────────────────────────────────────────────────

class Engin(SoftDeleteModel):
    """Machine ou engin du parc EKO (BTP + Location)."""
    TYPE_CHOICES = [
        ("pelleteuse",        "Pelleteuse"),
        ("compacteur",        "Compacteur"),
        ("tractopelle",       "Tractopelle"),
        ("chargeuse",         "Chargeuse"),
        ("niveleuse",         "Niveleuse"),
        ("camion_benne",      "Camion benne"),
        ("betonniere",        "Bétonnière"),
        ("tracteur",          "Tracteur"),
        ("groupe_electro",    "Groupe électrogène"),
        ("autre",             "Autre"),
    ]
    STATUT_CHOICES = [
        ("disponible",     "Disponible"),
        ("en_chantier",    "En chantier"),
        ("en_location",    "En location"),
        ("en_maintenance", "En maintenance"),
        ("hors_service",   "Hors service"),
    ]

    code                  = models.CharField(max_length=20, unique=True, editable=False)  # ENG-001
    nom                   = models.CharField(max_length=200)
    type_engin            = models.CharField(max_length=20, choices=TYPE_CHOICES)
    marque                = models.CharField(max_length=100, blank=True)
    modele                = models.CharField(max_length=100, blank=True)
    immatriculation       = models.CharField(max_length=30, blank=True)
    numero_serie          = models.CharField(max_length=80, blank=True)
    annee_mise_service    = models.PositiveIntegerField(null=True, blank=True)
    heures_compteur       = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    heures_revision       = models.DecimalField(
        max_digits=10, decimal_places=1, default=500,
        help_text="Seuil compteur à partir duquel une révision préventive est due.",
    )
    duree_vie_estimee_h   = models.DecimalField(
        max_digits=10, decimal_places=0, default=10000,
        help_text="Durée de vie estimée en heures pour calculer l'usure.",
    )
    prix_achat            = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tarif_location_jour   = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut                = models.CharField(max_length=20, choices=STATUT_CHOICES, default="disponible")
    site_actuel           = models.ForeignKey(
        "operations.Site", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="engins",
    )
    notes                 = models.TextField(blank=True)

    class Meta:
        verbose_name = "Engin"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.nom}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq(Engin, "code", "ENG")
        super().save(*args, **kwargs)

    @property
    def usure_pct(self):
        if not self.duree_vie_estimee_h:
            return Decimal("0")
        pct = self.heures_compteur / self.duree_vie_estimee_h * 100
        return min(Decimal("100"), round(pct, 1))

    @property
    def heures_avant_revision(self):
        return max(Decimal("0"), self.heures_revision - self.heures_compteur)

    @property
    def en_alerte_maintenance(self):
        # Alerte si on est à ≤ 50h de la prochaine révision OU déjà dépassé
        return self.heures_avant_revision <= 50


# ── Maintenance ──────────────────────────────────────────────────────────────

class Maintenance(TimeStampedModel):
    """Intervention sur un engin (préventive, corrective ou révision périodique)."""
    TYPE_CHOICES = [
        ("preventive", "Préventive"),
        ("corrective", "Corrective"),
        ("revision",   "Révision périodique"),
    ]

    engin                       = models.ForeignKey(Engin, on_delete=models.CASCADE, related_name="maintenances")
    type_maintenance            = models.CharField(max_length=20, choices=TYPE_CHOICES, default="preventive")
    date_intervention           = models.DateField()
    heures_compteur_intervention = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    description                 = models.CharField(max_length=300)
    prochaine_revision_heures   = models.DecimalField(
        max_digits=10, decimal_places=1, null=True, blank=True,
        help_text="Si renseigné, met à jour le seuil de prochaine révision sur l'engin.",
    )
    cout                        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    effectue_par                = models.CharField(max_length=200, blank=True, help_text="Atelier interne ou prestataire")
    notes                       = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Maintenance"
        ordering = ["-date_intervention"]

    def __str__(self):
        return f"{self.engin.code} — {self.get_type_maintenance_display()} ({self.date_intervention})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Si l'intervention fixe un nouveau seuil, met à jour l'engin
        if self.prochaine_revision_heures and self.type_maintenance in ("preventive", "revision"):
            Engin.objects.filter(pk=self.engin_id).update(
                heures_revision=self.prochaine_revision_heures
            )


# ── Contrat de location ──────────────────────────────────────────────────────

class ContratLocation(TimeStampedModel):
    """Location d'un engin à un client (externe) ou affectation à un projet (interne)."""
    STATUT_CHOICES = [
        ("planifie", "Planifié"),
        ("en_cours", "En cours"),
        ("termine",  "Terminé"),
        ("annule",   "Annulé"),
    ]

    numero           = models.CharField(max_length=20, unique=True, editable=False)  # LOC-AAAA-NNNN
    engin            = models.ForeignKey(Engin, on_delete=models.PROTECT, related_name="locations")
    client           = models.ForeignKey(
        "crm.Client", on_delete=models.PROTECT, null=True, blank=True,
        related_name="locations_engin",
        help_text="Renseigné pour une location externe.",
    )
    projet           = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="locations_engin",
        help_text="Renseigné pour une affectation interne.",
    )
    date_debut       = models.DateField()
    date_fin_prevue  = models.DateField()
    date_fin_reelle  = models.DateField(null=True, blank=True)
    tarif_jour       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut           = models.CharField(max_length=20, choices=STATUT_CHOICES, default="planifie")
    notes            = models.TextField(blank=True)

    class Meta:
        verbose_name = "Contrat de location"
        ordering = ["-date_debut", "-numero"]

    def __str__(self):
        return f"{self.numero} — {self.engin.code}"

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = _next_seq(ContratLocation, "numero", "LOC", avec_annee=True)
        if not self.tarif_jour and self.engin_id:
            self.tarif_jour = self.engin.tarif_location_jour
        super().save(*args, **kwargs)

    @property
    def nb_jours(self):
        fin = self.date_fin_reelle or self.date_fin_prevue
        if not fin or not self.date_debut:
            return 0
        return max(0, (fin - self.date_debut).days + 1)

    @property
    def montant_facturable(self):
        return Decimal(self.nb_jours) * (self.tarif_jour or Decimal("0"))

    @property
    def est_externe(self):
        return self.client_id is not None
