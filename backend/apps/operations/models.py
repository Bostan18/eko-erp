from django.db import models
from django.utils import timezone
from apps.core.models import SoftDeleteModel


def _next_seq(model_class, champ, prefixe):
    """Génère {prefixe}-{NNN} pour `champ` (séquence simple sans année)."""
    base = f"{prefixe}-"
    dernier = (
        model_class.objects.filter(**{f"{champ}__startswith": base})
        .order_by(f"-{champ}").values_list(champ, flat=True).first()
    )
    try:
        seq = int(dernier.split("-")[-1]) + 1 if dernier else 1
    except (ValueError, IndexError):
        seq = 1
    return f"{base}{seq:03d}"


# ── Site ─────────────────────────────────────────────────────────────────────

class Site(SoftDeleteModel):
    """Lieu physique d'intervention, rattaché ou non à un projet."""
    TYPE_CHOICES = [
        ("chantier",      "Chantier BTP"),
        ("parcelle",      "Parcelle agricole"),
        ("pepiniere",     "Pépinière"),
        ("espace_vert",   "Espace vert"),
        ("depot",         "Dépôt / parc engins"),
        ("autre",         "Autre"),
    ]

    code         = models.CharField(max_length=20, unique=True, editable=False)  # SIT-001
    nom          = models.CharField(max_length=200)
    type_site    = models.CharField(max_length=20, choices=TYPE_CHOICES, default="chantier")
    projet       = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="sites",
    )
    responsable  = models.ForeignKey(
        "rh.Employe", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="sites_geres",
    )
    localisation = models.CharField(max_length=300, blank=True)
    actif        = models.BooleanField(default=True)
    notes        = models.TextField(blank=True)

    class Meta:
        verbose_name = "Site"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.nom}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq(Site, "code", "SIT")
        super().save(*args, **kwargs)


# ── Référentiel des tâches ─────────────────────────────────────────────────────

class TacheCatalogue(SoftDeleteModel):
    """Modèle de tâche réutilisable : type d'objectif, unité, tarif de référence."""
    TYPE_OBJECTIF_CHOICES = [
        ("surface",  "Surface (m²)"),
        ("volume",   "Volume (m³)"),
        ("unite",    "Unité"),
        ("lineaire", "Linéaire (m)"),
        ("forfait",  "Forfait"),
    ]

    code            = models.CharField(max_length=20, unique=True, editable=False)  # TAC-001
    libelle         = models.CharField(max_length=200)
    activite        = models.ForeignKey(
        "core.CentreCout", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="taches_catalogue",
    )
    type_objectif   = models.CharField(max_length=20, choices=TYPE_OBJECTIF_CHOICES, default="unite")
    unite_label     = models.CharField(max_length=50, blank=True, help_text="Ex: m², sacs, ml")
    tarif_reference = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actif           = models.BooleanField(default=True)
    notes           = models.TextField(blank=True)

    class Meta:
        verbose_name = "Tâche de catalogue"
        verbose_name_plural = "Tâches de catalogue"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.libelle}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq(TacheCatalogue, "code", "TAC")
        super().save(*args, **kwargs)
