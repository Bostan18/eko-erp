from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.core.models import SoftDeleteModel, TimeStampedModel


def _next_seq(model_class, champ, prefixe, avec_annee=True):
    """Génère {prefixe}-{YYYY}-{NNNN} (ou {prefixe}-{NNNN}) pour `champ`."""
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


# ── Fournisseur ─────────────────────────────────────────────────────────────────

class Fournisseur(SoftDeleteModel):
    CATEGORIE_CHOICES = [
        ("materiaux",      "Matériaux & fournitures"),
        ("materiel",       "Matériel & équipement"),
        ("sous_traitance", "Sous-traitance"),
        ("services",       "Services"),
        ("transport",      "Transport & carburant"),
        ("autre",          "Autre"),
    ]

    code      = models.CharField(max_length=20, unique=True, editable=False)  # FOU-001
    nom       = models.CharField(max_length=200)
    ncc       = models.CharField(max_length=50, blank=True, verbose_name="N° Compte Contribuable")
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default="materiaux")
    telephone = models.CharField(max_length=20, blank=True)
    email     = models.EmailField(blank=True)
    localite  = models.CharField(max_length=200, blank=True)
    notes     = models.TextField(blank=True)

    class Meta:
        verbose_name = "Fournisseur"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.code} — {self.nom}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq(Fournisseur, "code", "FOU", avec_annee=False)
        super().save(*args, **kwargs)


# ── Facture d'achat ───────────────────────────────────────────────────────────

class FactureAchat(TimeStampedModel):
    STATUT_CHOICES = [
        ("brouillon", "Brouillon"),
        ("validee",   "Validée"),
        ("payee",     "Payée"),
        ("annulee",   "Annulée"),
    ]

    numero        = models.CharField(max_length=30, unique=True, editable=False)  # FA-YYYY-NNNN
    fournisseur   = models.ForeignKey(Fournisseur, on_delete=models.PROTECT, related_name="factures_achat")
    reference     = models.CharField(max_length=100, blank=True, help_text="N° de pièce du fournisseur")
    libelle       = models.CharField(max_length=300)
    date          = models.DateField()
    date_echeance = models.DateField(null=True, blank=True)

    montant_ht = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    taux_tva   = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))

    centre_cout = models.ForeignKey("core.CentreCout", null=True, blank=True,
                    on_delete=models.SET_NULL, related_name="factures_achat")
    projet      = models.ForeignKey("projets.Projet", null=True, blank=True,
                    on_delete=models.SET_NULL, related_name="factures_achat")

    statut       = models.CharField(max_length=15, choices=STATUT_CHOICES, default="brouillon")
    montant_paye = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    notes        = models.TextField(blank=True)

    class Meta:
        verbose_name = "Facture d'achat"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.numero} — {self.fournisseur.nom}"

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = _next_seq(FactureAchat, "numero", "FA")
        super().save(*args, **kwargs)

    @property
    def montant_tva(self):
        return (self.montant_ht * self.taux_tva / 100).quantize(Decimal("0.01"))

    @property
    def total_ttc(self):
        return self.montant_ht + self.montant_tva

    @property
    def solde_restant(self):
        return self.total_ttc - self.montant_paye

    def recalculer_paiement(self):
        """Recalcule montant_paye depuis les décaissements liés et ajuste le statut."""
        total = self.decaissements.aggregate(s=models.Sum("montant"))["s"] or Decimal("0")
        self.montant_paye = total
        if self.statut != "annulee":
            if total >= self.total_ttc and self.total_ttc > 0:
                self.statut = "payee"
            elif self.statut == "payee":
                self.statut = "validee"
        self.save(update_fields=["montant_paye", "statut"])


# ── Trésorerie ──────────────────────────────────────────────────────────────────

class CompteBancaire(TimeStampedModel):
    TYPE_CHOICES = [
        ("banque",       "Compte bancaire"),
        ("caisse",       "Caisse"),
        ("mobile_money", "Mobile Money"),
    ]

    nom            = models.CharField(max_length=120)
    banque         = models.CharField(max_length=120, blank=True)
    numero_compte  = models.CharField(max_length=60, blank=True)
    type_compte    = models.CharField(max_length=15, choices=TYPE_CHOICES, default="banque")
    solde_initial  = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    actif          = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Compte de trésorerie"
        ordering = ["nom"]

    def __str__(self):
        return self.nom

    @property
    def solde_actuel(self):
        agg = self.mouvements.aggregate(
            e=models.Sum("montant", filter=models.Q(sens="entree")),
            s=models.Sum("montant", filter=models.Q(sens="sortie")),
        )
        entrees = agg["e"] or Decimal("0")
        sorties = agg["s"] or Decimal("0")
        return self.solde_initial + entrees - sorties


class MouvementTresorerie(TimeStampedModel):
    SENS_CHOICES = [
        ("entree", "Encaissement"),
        ("sortie", "Décaissement"),
    ]
    CATEGORIE_CHOICES = [
        ("vente",   "Vente / client"),
        ("achat",   "Achat / fournisseur"),
        ("salaire", "Salaires & paie"),
        ("charge",  "Charge / frais"),
        ("impot",   "Impôts & taxes"),
        ("transfert", "Transfert interne"),
        ("autre",   "Autre"),
    ]
    MODE_CHOICES = [
        ("especes",  "Espèces"),
        ("virement", "Virement"),
        ("cheque",   "Chèque"),
        ("mobile",   "Mobile Money"),
    ]

    compte    = models.ForeignKey(CompteBancaire, on_delete=models.PROTECT, related_name="mouvements")
    date      = models.DateField()
    sens      = models.CharField(max_length=10, choices=SENS_CHOICES)
    montant   = models.DecimalField(max_digits=15, decimal_places=2)
    categorie = models.CharField(max_length=15, choices=CATEGORIE_CHOICES, default="autre")
    libelle   = models.CharField(max_length=300)
    mode      = models.CharField(max_length=15, choices=MODE_CHOICES, default="virement")
    reference = models.CharField(max_length=100, blank=True)

    facture_achat = models.ForeignKey(FactureAchat, null=True, blank=True,
                      on_delete=models.SET_NULL, related_name="decaissements",
                      help_text="Facture d'achat réglée par ce décaissement")
    centre_cout   = models.ForeignKey("core.CentreCout", null=True, blank=True,
                      on_delete=models.SET_NULL, related_name="mouvements_tresorerie")
    notes         = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Mouvement de trésorerie"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        signe = "+" if self.sens == "entree" else "−"
        return f"{signe}{self.montant} — {self.libelle}"

    @property
    def montant_signe(self):
        return self.montant if self.sens == "entree" else -self.montant

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.facture_achat_id:
            self.facture_achat.recalculer_paiement()
