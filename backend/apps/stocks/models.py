from decimal import Decimal
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone
from apps.core.models import SoftDeleteModel, TimeStampedModel


def _next_seq(model_class, champ, prefixe):
    """Génère {prefixe}-{NNN} pour `champ`."""
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


class Article(SoftDeleteModel):
    CATEGORIE_CHOICES = [
        ("intrant", "Intrant agricole"),
        ("materiau", "Matériau BTP"),
        ("equipement", "Équipement"),
        ("consommable", "Consommable"),
        ("piece", "Pièce détachée"),
    ]
    UNITE_CHOICES = [
        ("kg", "Kilogramme"),
        ("l", "Litre"),
        ("m", "Mètre"),
        ("m2", "Mètre carré"),
        ("m3", "Mètre cube"),
        ("u", "Unité"),
        ("sac", "Sac"),
        ("tonne", "Tonne"),
    ]

    code = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=200)
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES)
    unite = models.CharField(max_length=10, choices=UNITE_CHOICES, default="u")
    stock_actuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seuil_minimum = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fournisseur = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Article"
        ordering = ["categorie", "nom"]

    def __str__(self):
        return f"{self.code} — {self.nom}"

    @property
    def en_alerte(self):
        return self.stock_actuel <= self.seuil_minimum


class MouvementStock(TimeStampedModel):
    TYPE_CHOICES = [
        ("entree", "Entrée"),
        ("sortie", "Sortie"),
    ]

    article = models.ForeignKey(Article, on_delete=models.PROTECT, related_name="mouvements")
    type_mouvement = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    projet = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="mouvements_stock"
    )
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Mouvement de stock"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.get_type_mouvement_display()} — {self.article.nom} ({self.quantite} {self.article.unite})"

    def save(self, *args, **kwargs):
        if self.pk is None:
            delta = self.quantite if self.type_mouvement == "entree" else -self.quantite
            with transaction.atomic():
                Article.objects.filter(pk=self.article_id).update(
                    stock_actuel=F("stock_actuel") + delta
                )
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)


# ── Sprint 7 : stocks métier ─────────────────────────────────────────────────

class LotBiologique(SoftDeleteModel):
    """Cohorte de plants suivie de semis → repiquage → production (pépinière/agri)."""
    ETAT_CHOICES = [
        ("excellent", "Excellent"),
        ("bon",       "Bon"),
        ("moyen",     "Moyen"),
        ("critique",  "Critique"),
        ("perdu",     "Perdu"),
    ]

    code               = models.CharField(max_length=20, unique=True, editable=False)  # LOT-001
    article            = models.ForeignKey(
        Article, on_delete=models.PROTECT, related_name="lots_biologiques",
        help_text="Intrant / variété concerné.",
    )
    espece             = models.CharField(max_length=120, help_text="Ex: Anacardier, Hévéa, Tomate")
    site               = models.ForeignKey(
        "operations.Site", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="lots_biologiques",
    )
    date_semis         = models.DateField()
    date_repiquage     = models.DateField(null=True, blank=True)
    quantite_initiale  = models.DecimalField(max_digits=10, decimal_places=2)
    quantite_actuelle  = models.DecimalField(max_digits=10, decimal_places=2)
    etat_sante         = models.CharField(max_length=20, choices=ETAT_CHOICES, default="bon")
    notes              = models.TextField(blank=True)

    class Meta:
        verbose_name = "Lot biologique"
        ordering = ["-date_semis"]

    def __str__(self):
        return f"{self.code} — {self.espece}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq(LotBiologique, "code", "LOT")
        if self.quantite_actuelle is None:
            self.quantite_actuelle = self.quantite_initiale
        super().save(*args, **kwargs)

    @property
    def taux_survie(self):
        if not self.quantite_initiale:
            return Decimal("0")
        return round(self.quantite_actuelle / self.quantite_initiale * 100, 1)

    @property
    def phase(self):
        if self.etat_sante == "perdu":
            return "perdu"
        if not self.date_repiquage:
            return "semis"
        # > 90 jours après repiquage : production
        delta = (timezone.now().date() - self.date_repiquage).days
        return "production" if delta > 90 else "repiquage"

    @property
    def en_alerte(self):
        if self.etat_sante in ("critique", "moyen"):
            return True
        return self.taux_survie < 70


class TraceurRFID(TimeStampedModel):
    """Tag RFID rattaché à un article BTP (matériau ou équipement) pour traçabilité."""
    STATUT_CHOICES = [
        ("en_stock", "En stock"),
        ("sorti",    "Sorti / sur site"),
        ("perdu",    "Perdu / volé"),
        ("retire",   "Retiré du service"),
    ]

    tag_uid    = models.CharField(max_length=64, unique=True, help_text="UID du tag RFID/NFC")
    article    = models.ForeignKey(
        Article, on_delete=models.PROTECT, related_name="traceurs_rfid",
        limit_choices_to={"categorie__in": ["materiau", "equipement"]},
    )
    site       = models.ForeignKey(
        "operations.Site", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="traceurs_rfid",
    )
    quantite   = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    statut     = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_stock")
    date_pose  = models.DateField()
    notes      = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Traceur RFID"
        ordering = ["tag_uid"]

    def __str__(self):
        return f"{self.tag_uid} — {self.article.nom}"

    @property
    def est_disponible(self):
        return self.statut == "en_stock"


class Dechet(TimeStampedModel):
    """Déchet généré sur un site/projet — alimente les indicateurs ESG (Sprint 9)."""
    TYPE_CHOICES = [
        ("organique",    "Déchet organique / vert"),
        ("plastique",    "Plastique / emballage"),
        ("gravats",      "Béton & gravats"),
        ("metal",        "Métal / ferraille"),
        ("huile",        "Huile usée / hydrocarbure"),
        ("bois",         "Bois & palettes"),
        ("autre",        "Autre"),
    ]
    UNITE_CHOICES = [
        ("kg",    "Kilogramme"),
        ("tonne", "Tonne"),
        ("m3",    "Mètre cube"),
        ("sac",   "Sac"),
        ("u",     "Unité"),
    ]
    TRAITEMENT_CHOICES = [
        ("compost",       "Compostage"),
        ("recyclage",     "Recyclage"),
        ("reutilisation", "Réutilisation"),
        ("valorisation",  "Valorisation énergétique"),
        ("decharge",      "Mise en décharge"),
        ("autre",         "Autre"),
    ]

    type_dechet      = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantite         = models.DecimalField(max_digits=10, decimal_places=2)
    unite            = models.CharField(max_length=10, choices=UNITE_CHOICES, default="kg")
    date             = models.DateField()
    origine_projet   = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="dechets",
    )
    origine_site     = models.ForeignKey(
        "operations.Site", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="dechets",
    )
    mode_traitement  = models.CharField(max_length=20, choices=TRAITEMENT_CHOICES, default="decharge")
    est_valorise     = models.BooleanField(
        default=False,
        help_text="True si recyclage / réutilisation / valorisation / compostage.",
    )
    notes            = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Déchet"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.get_type_dechet_display()} — {self.quantite} {self.unite}"

    def save(self, *args, **kwargs):
        self.est_valorise = self.mode_traitement in (
            "compost", "recyclage", "reutilisation", "valorisation",
        )
        super().save(*args, **kwargs)
