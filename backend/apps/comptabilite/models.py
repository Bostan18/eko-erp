from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.core.models import SoftDeleteModel, TimeStampedModel


# ── Helpers numérotation ──────────────────────────────────────────────────────

def _next_numero(model_class, prefixe, annee=None):
    """Génère le prochain numéro de séquence {prefixe}-{YYYY}-{NNNN}."""
    annee = annee or timezone.now().year
    prefix_annee = f"{prefixe}-{annee}-"
    dernier = (
        model_class.objects
        .filter(numero__startswith=prefix_annee)
        .order_by("-numero")
        .values_list("numero", flat=True)
        .first()
    )
    if dernier:
        try:
            seq = int(dernier.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix_annee}{seq:04d}"


def _next_numero_local(prefixe, annee=None):
    """Idem pour Facture (field = numero_local)."""
    from apps.comptabilite.models import Facture  # éviter import circulaire
    annee = annee or timezone.now().year
    prefix_annee = f"{prefixe}-{annee}-"
    dernier = (
        Facture.objects
        .filter(numero_local__startswith=prefix_annee)
        .order_by("-numero_local")
        .values_list("numero_local", flat=True)
        .first()
    )
    if dernier:
        try:
            seq = int(dernier.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix_annee}{seq:04d}"


# ── Devis ─────────────────────────────────────────────────────────────────────

class Devis(TimeStampedModel):
    STATUT_CHOICES = [
        ("brouillon", "Brouillon"),
        ("envoye",    "Envoyé"),
        ("accepte",   "Accepté"),
        ("refuse",    "Refusé"),
        ("expire",    "Expiré"),
    ]

    numero             = models.CharField(max_length=30, unique=True, editable=False)
    client             = models.ForeignKey("crm.Client", on_delete=models.PROTECT, related_name="devis_comptabilite")
    projet             = models.ForeignKey("projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="devis")
    statut             = models.CharField(max_length=15, choices=STATUT_CHOICES, default="brouillon")
    date_validite      = models.DateField(null=True, blank=True)
    remise_globale_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    notes              = models.TextField(blank=True)

    class Meta:
        verbose_name = "Devis"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.numero} — {self.client.nom}"

    def save(self, *args, **kwargs):
        if not self.numero:
            from apps.core.models import EntrepriseConfig
            config = EntrepriseConfig.get()
            self.numero = _next_numero(Devis, config.prefixe_devis)
        super().save(*args, **kwargs)

    @property
    def total_ht(self):
        lignes = list(self.lignes.all())
        sous_total = sum(l.total_ht for l in lignes)
        remise = sous_total * self.remise_globale_pct / 100
        return sous_total - remise

    @property
    def total_tva(self):
        return sum(l.montant_tva for l in self.lignes.all())

    @property
    def total_ttc(self):
        return self.total_ht + self.total_tva


class LigneDevis(TimeStampedModel):
    devis         = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name="lignes")
    designation   = models.CharField(max_length=300)
    quantite      = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal("1"))
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    remise_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    taux_tva      = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))

    class Meta:
        verbose_name = "Ligne de devis"

    def __str__(self):
        return f"{self.designation} ({self.quantite} × {self.prix_unitaire})"

    @property
    def total_ht(self):
        return self.quantite * self.prix_unitaire * (1 - self.remise_pct / 100)

    @property
    def montant_tva(self):
        return self.total_ht * self.taux_tva / 100

    @property
    def montant_ttc(self):
        return self.total_ht + self.montant_tva


# ── Facture ───────────────────────────────────────────────────────────────────

class Facture(TimeStampedModel):
    TYPE_CHOICES = [
        ("vente",    "Vente"),
        ("avoir",    "Avoir"),
        ("proforma", "Proforma"),
    ]
    STATUT_CHOICES = [
        ("brouillon",  "Brouillon"),
        ("certifiee",  "Certifiée FNE"),
        ("payee",      "Payée"),
        ("annulee",    "Annulée"),
    ]
    MODE_CHOICES = [
        ("cash",         "Espèces"),
        ("card",         "Carte"),
        ("check",        "Chèque"),
        ("mobile-money", "Mobile Money"),
        ("transfer",     "Virement"),
        ("deferred",     "Différé"),
    ]
    TEMPLATE_CHOICES = [
        ("B2B", "B2B"), ("B2C", "B2C"), ("B2G", "B2G"), ("B2F", "B2F"),
    ]
    # Centre de coût analytique — amorce (item 15). Devient une entité dédiée au Sprint 3.
    CENTRE_COUT_CHOICES = [
        ("btp",        "BTP"),
        ("pepiniere",  "Pépinière"),
        ("location",   "Location"),
        ("plantation", "Plantation"),
    ]

    # Numérotation locale
    numero_local  = models.CharField(max_length=30, unique=True, editable=False)

    # Champs FNE — remplis uniquement après certification
    fne_reference       = models.CharField(max_length=100, blank=True,
                            help_text="Format DGI: [NCC][Année][Séq]")
    fne_token           = models.URLField(blank=True, max_length=500,
                            help_text="URL de vérification QR code")
    fne_balance_sticker = models.IntegerField(null=True, blank=True)
    fne_invoice_id      = models.CharField(max_length=100, blank=True,
                            help_text="ID interne DGI — requis pour émettre un avoir")
    fne_certifiee_at    = models.DateTimeField(null=True, blank=True)

    # Relations
    client  = models.ForeignKey("crm.Client", on_delete=models.PROTECT, related_name="factures")
    devis   = models.OneToOneField(Devis, null=True, blank=True, on_delete=models.SET_NULL, related_name="facture_liee")
    projet  = models.ForeignKey("projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="factures")
    facture_origine = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL,
                        related_name="avoirs", help_text="Facture d'origine — renseignée sur les avoirs")

    # Type / statut
    type_facture  = models.CharField(max_length=10, choices=TYPE_CHOICES, default="vente")
    statut        = models.CharField(max_length=15, choices=STATUT_CHOICES, default="brouillon")

    # Dates et règlement
    date_echeance  = models.DateField(null=True, blank=True)
    mode_reglement = models.CharField(max_length=20, choices=MODE_CHOICES, default="cash")
    template_fne   = models.CharField(max_length=5, choices=TEMPLATE_CHOICES, default="B2B")
    centre_cout    = models.CharField(max_length=15, choices=CENTRE_COUT_CHOICES, blank=True)

    # Paiements (montant_paye mis à jour par Paiement.save)
    montant_paye = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))

    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Facture"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.numero_local} — {self.client.nom}"

    def save(self, *args, **kwargs):
        if not self.numero_local:
            from apps.core.models import EntrepriseConfig
            config = EntrepriseConfig.get()
            self.numero_local = _next_numero_local(config.prefixe_facture)
        super().save(*args, **kwargs)

    # ── Totaux calculés depuis les lignes ─────────────────────────────────────

    @property
    def total_ht(self):
        return sum(l.total_ht for l in self.lignes.all())

    @property
    def total_tva(self):
        return sum(l.montant_tva for l in self.lignes.all())

    @property
    def total_ttc(self):
        return self.total_ht + self.total_tva

    @property
    def solde_restant(self):
        return self.total_ttc - self.montant_paye

    @property
    def est_certifiee(self):
        return bool(self.fne_reference)

    @property
    def est_verrouillee(self):
        """Une facture certifiée FNE (ou payée) est figée : aucune modification de
        son contenu n'est autorisée, conformément à la traçabilité fiscale."""
        return self.est_certifiee or self.statut in ("certifiee", "payee", "annulee")


class LigneFacture(TimeStampedModel):
    facture       = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name="lignes")
    fne_item_id   = models.CharField(max_length=100, blank=True,
                      help_text="ID ligne renvoyé par FNE — requis pour les avoirs")
    designation   = models.CharField(max_length=300)
    quantite      = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal("1"))
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    remise_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    taux_tva      = models.CharField(
        max_length=10,
        choices=[("TVA", "TVA 18%"), ("TVAB", "TVAB 9%"),
                 ("TVAC", "TVAC 0%"), ("TVAD", "TVAD 27%"), ("0", "Exonéré")],
        default="TVA",
    )

    class Meta:
        verbose_name = "Ligne de facture"

    def __str__(self):
        return f"{self.designation} ({self.quantite} × {self.prix_unitaire})"

    TVA_RATES = {"TVA": Decimal("18"), "TVAB": Decimal("9"),
                 "TVAC": Decimal("0"), "TVAD": Decimal("27"), "0": Decimal("0")}

    @property
    def total_ht(self):
        return self.quantite * self.prix_unitaire * (1 - self.remise_pct / 100)

    @property
    def taux_tva_pct(self):
        return self.TVA_RATES.get(self.taux_tva, Decimal("18"))

    @property
    def montant_tva(self):
        return self.total_ht * self.taux_tva_pct / 100

    @property
    def montant_ttc(self):
        return self.total_ht + self.montant_tva


# ── Paiement ──────────────────────────────────────────────────────────────────

class Paiement(TimeStampedModel):
    MODE_CHOICES = [
        ("especes",  "Espèces"),
        ("virement", "Virement"),
        ("cheque",   "Chèque"),
        ("mobile",   "Mobile Money"),
    ]

    facture   = models.ForeignKey(Facture, on_delete=models.PROTECT, related_name="paiements")
    date      = models.DateField()
    montant   = models.DecimalField(max_digits=15, decimal_places=2)
    mode      = models.CharField(max_length=20, choices=MODE_CHOICES, default="virement")
    reference = models.CharField(max_length=100, blank=True)
    notes     = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Paiement"
        ordering = ["-date"]

    def __str__(self):
        return f"Paiement {self.montant} F — {self.facture.numero_local}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        facture = self.facture
        total_paye = sum(p.montant for p in facture.paiements.all())
        facture.montant_paye = total_paye
        if total_paye >= facture.total_ttc:
            facture.statut = "payee"
        facture.save()


# ── Charge ────────────────────────────────────────────────────────────────────

class Charge(SoftDeleteModel):
    CATEGORIE_CHOICES = [
        ("salaire",        "Salaires & charges sociales"),
        ("materiel",       "Matériel & équipement"),
        ("carburant",      "Carburant & transport"),
        ("sous_traitance", "Sous-traitance"),
        ("location",       "Location engins"),
        ("fourniture",     "Fournitures"),
        ("autre",          "Autre"),
    ]

    libelle    = models.CharField(max_length=300)
    categorie  = models.CharField(max_length=20, choices=CATEGORIE_CHOICES)
    montant    = models.DecimalField(max_digits=15, decimal_places=2)
    date       = models.DateField()
    projet     = models.ForeignKey("projets.Projet", on_delete=models.SET_NULL, null=True, blank=True, related_name="charges")
    fournisseur = models.CharField(max_length=200, blank=True)
    reference  = models.CharField(max_length=100, blank=True)
    notes      = models.TextField(blank=True)

    class Meta:
        verbose_name = "Charge"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.libelle} — {self.montant} F ({self.date})"


# ── Stickers FNE ────────────────────────────────────────────────────────────────
# Stock de stickers (vignettes électroniques) consommés à chaque certification FNE.
# Ledger local : achats (+) et consommations (−). Le solde est réconcilié avec le
# balance_sticker renvoyé par l'API DGI lorsqu'elle est active.

class StickerAchat(TimeStampedModel):
    """Achat / recharge de stickers FNE (via Mobile Money sur la plateforme DGI)."""
    MODE_CHOICES = [
        ("mobile-money", "Mobile Money"),
        ("card",         "Carte bancaire"),
        ("transfer",     "Virement"),
    ]

    date          = models.DateField()
    quantite      = models.PositiveIntegerField()
    montant       = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    mode_paiement = models.CharField(max_length=20, choices=MODE_CHOICES, default="mobile-money")
    reference     = models.CharField(max_length=100, blank=True)
    notes         = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Achat de stickers"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"Achat {self.quantite} stickers — {self.date}"

    def save(self, *args, **kwargs):
        nouveau = self.pk is None
        super().save(*args, **kwargs)
        if nouveau:
            StickerMouvement.objects.create(
                type_mouvement="achat",
                quantite=self.quantite,
                achat=self,
                notes=f"Recharge {self.reference}".strip(),
            )


class StickerMouvement(TimeStampedModel):
    """Ligne de ledger des stickers FNE : achat (+), consommation (−), ajustement."""
    TYPE_CHOICES = [
        ("achat",        "Achat / recharge"),
        ("consommation", "Consommation"),
        ("ajustement",   "Ajustement"),
    ]

    type_mouvement = models.CharField(max_length=15, choices=TYPE_CHOICES)
    quantite       = models.IntegerField(help_text="Positif (achat) ou négatif (consommation)")
    solde_apres    = models.IntegerField(default=0)
    facture        = models.ForeignKey(Facture, null=True, blank=True,
                        on_delete=models.SET_NULL, related_name="stickers_mouvements")
    achat          = models.ForeignKey(StickerAchat, null=True, blank=True,
                        on_delete=models.CASCADE, related_name="mouvements")
    notes          = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Mouvement de stickers"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.get_type_mouvement_display()} {self.quantite:+d} (solde {self.solde_apres})"

    @staticmethod
    def solde_actuel():
        return StickerMouvement.objects.aggregate(s=models.Sum("quantite"))["s"] or 0

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.solde_apres = StickerMouvement.solde_actuel() + self.quantite
        super().save(*args, **kwargs)
