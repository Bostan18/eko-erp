from django.db import models


class TimeStampedModel(models.Model):
    """Modèle de base avec timestamps automatiques."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(TimeStampedModel):
    """Modèle avec suppression logique."""
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class EntrepriseConfig(models.Model):
    """Singleton — une seule ligne. Accès via EntrepriseConfig.get()"""

    # Identité légale (mentions obligatoires FNE Art.6)
    raison_sociale    = models.CharField(max_length=200, default="EKO SARL")
    adresse           = models.TextField(blank=True)
    telephone         = models.CharField(max_length=30, blank=True)
    email             = models.EmailField(blank=True)
    site_web          = models.URLField(blank=True)
    logo              = models.ImageField(upload_to="entreprise/", blank=True)

    # Identifiants fiscaux CI
    ncc               = models.CharField(max_length=50, blank=True, verbose_name="N° Compte Contribuable")
    rccm              = models.CharField(max_length=50, blank=True, verbose_name="N° RCCM")
    regime_imposition = models.CharField(
        max_length=10,
        choices=[("RNI", "Régime Normal"), ("RSI", "Régime Simplifié"),
                 ("RME", "Micro-Entreprise"), ("RENT", "Entrepreneur")],
        default="RNI",
    )

    # Paramètres FNE API
    fne_api_url          = models.URLField(
        default="http://54.247.95.108/ws",
        help_text="URL env. test DGI. Remplacer par URL prod après validation.",
    )
    fne_client_id        = models.CharField(max_length=200, blank=True)
    fne_client_secret    = models.CharField(max_length=200, blank=True)
    fne_establishment_id = models.CharField(max_length=100, blank=True)
    fne_point_of_sale_id = models.CharField(max_length=100, blank=True)
    fne_actif            = models.BooleanField(
        default=False,
        help_text="Activer seulement après validation DGI",
    )

    # Paramètres facturation
    template_fne_defaut = models.CharField(
        max_length=5,
        choices=[("B2B", "B2B"), ("B2C", "B2C"), ("B2G", "B2G"), ("B2F", "B2F")],
        default="B2B",
    )
    prefixe_devis    = models.CharField(max_length=10, default="DEV")
    prefixe_facture  = models.CharField(max_length=10, default="FAC")
    tva_defaut       = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    mentions_legales = models.TextField(blank=True)

    class Meta:
        verbose_name = "Configuration entreprise"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return self.raison_sociale or "Configuration entreprise"


class CentreCout(TimeStampedModel):
    """Centre de coût analytique transversal (item 15).
    Ventile factures, charges et projets par activité EKO
    (BTP / Pépinière / Location / Plantation)."""

    code    = models.CharField(max_length=20, unique=True)   # slug stable : btp, pepiniere…
    nom     = models.CharField(max_length=100)
    couleur = models.CharField(max_length=7, default="#386641",
                               help_text="Couleur hex pour les graphes de ventilation")
    actif   = models.BooleanField(default=True)
    ordre   = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Centre de coût"
        verbose_name_plural = "Centres de coût"
        ordering = ["ordre", "nom"]

    def __str__(self):
        return self.nom


class Document(SoftDeleteModel):
    """Pièces justificatives métier (permis, médicales, assurances, etc.)."""

    TYPE_CHOICES = [
        ("permis",        "Permis"),
        ("medical",       "Visite médicale"),
        ("assurance",     "Assurance"),
        ("certification", "Certification"),
        ("env_permit",    "Autorisation environnementale"),
        ("cnps",          "CNPS / DGI"),
        ("contrat",       "Contrat"),
        ("autre",         "Autre"),
    ]
    ENTITE_CHOICES = [
        ("site",       "Chantier / Site"),
        ("employe",    "Employé"),
        ("engin",      "Engin / Véhicule"),
        ("projet",     "Projet"),
        ("client",     "Client"),
        ("entreprise", "Entreprise"),
    ]

    id_doc          = models.CharField(max_length=20, unique=True, blank=True)
    titre           = models.CharField(max_length=200)
    type_doc        = models.CharField(max_length=20, choices=TYPE_CHOICES)
    entite_type     = models.CharField(max_length=20, choices=ENTITE_CHOICES, blank=True)
    entite_id       = models.CharField(max_length=40, blank=True)
    date_emission   = models.DateField(null=True, blank=True)
    date_expiration = models.DateField(null=True, blank=True)
    fichier_url     = models.URLField(blank=True)
    notes           = models.TextField(blank=True)

    class Meta:
        ordering = ["-date_expiration", "-id"]

    def save(self, *args, **kwargs):
        if not self.id_doc:
            last = Document.objects.order_by("-id").first()
            n = (last.id + 1) if last else 1
            self.id_doc = f"DOC-{n:03d}"
        super().save(*args, **kwargs)

    @property
    def statut(self):
        from datetime import date
        if not self.date_expiration:
            return "valid"
        days = (self.date_expiration - date.today()).days
        if days < 0:
            return "expired"
        if days < 30:
            return "expiring"
        return "valid"

    def __str__(self):
        return f"{self.id_doc} — {self.titre}"
