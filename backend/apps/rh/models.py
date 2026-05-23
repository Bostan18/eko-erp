from django.db import models
from apps.core.models import SoftDeleteModel, TimeStampedModel

class Employe(SoftDeleteModel):
    TYPE_CHOICES = [("cdi","CDI Permanent"),("journalier","Journalier"),("moo","MOO"),("stagiaire","Stagiaire")]
    STATUT_CHOICES = [("actif","Actif"),("inactif","Inactif"),("conge","En congé")]

    code = models.CharField(max_length=20, unique=True)  # EMP-001
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    type_contrat = models.CharField(max_length=20, choices=TYPE_CHOICES)
    poste = models.CharField(max_length=150, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="actif")
    date_entree = models.DateField(null=True, blank=True)
    salaire_mensuel = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    taux_journalier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "Employé"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.code} — {self.nom} {self.prenom}"

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class PresenceJournaliere(TimeStampedModel):
    """Pointage journalier — crucial pour les journaliers EKO."""
    employe = models.ForeignKey(Employe, on_delete=models.PROTECT, related_name="presences")
    date = models.DateField()
    present = models.BooleanField(default=True)
    heures_travaillees = models.DecimalField(max_digits=4, decimal_places=1, default=8)
    montant_du = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    projet_ref = models.CharField(max_length=50, blank=True)  # FK souple vers Projet
    site = models.ForeignKey(
        "operations.Site", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="presences",
    )
    notes = models.CharField(max_length=300, blank=True)
    paye_le = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Présence journalière"
        unique_together = ["employe", "date"]
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        if self.employe.taux_journalier and self.present:
            self.montant_du = self.employe.taux_journalier
        super().save(*args, **kwargs)


class BulletinPaie(TimeStampedModel):
    """Bulletin mensuel pour les CDI. MVP : brut = net (pas de retenues)."""
    STATUT_CHOICES = [("genere", "Généré"), ("paye", "Payé")]

    employe = models.ForeignKey(Employe, on_delete=models.PROTECT, related_name="bulletins")
    mois = models.DateField(help_text="1er jour du mois concerné (ex: 2026-05-01)")
    brut = models.DecimalField(max_digits=12, decimal_places=2)
    net = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="genere")
    paye_le = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Bulletin de paie"
        unique_together = ["employe", "mois"]
        ordering = ["-mois", "employe__nom"]

    def __str__(self):
        return f"{self.employe.code} — {self.mois.strftime('%Y-%m')}"


# ── Sprint 8 — RH avancé ─────────────────────────────────────────────────────

class Conge(TimeStampedModel):
    """Demande de congé / absence avec workflow d'approbation."""
    TYPE_CHOICES = [
        ("conges_payes", "Congés payés"),
        ("maladie",      "Maladie"),
        ("maternite",    "Maternité / paternité"),
        ("sans_solde",   "Sans solde"),
        ("special",      "Spécial (mariage, deuil…)"),
    ]
    STATUT_CHOICES = [
        ("demande",  "Demandé"),
        ("approuve", "Approuvé"),
        ("refuse",   "Refusé"),
        ("annule",   "Annulé"),
    ]

    employe       = models.ForeignKey(Employe, on_delete=models.PROTECT, related_name="conges")
    type_conge    = models.CharField(max_length=20, choices=TYPE_CHOICES, default="conges_payes")
    date_debut    = models.DateField()
    date_fin      = models.DateField()
    motif         = models.CharField(max_length=300, blank=True)
    statut        = models.CharField(max_length=20, choices=STATUT_CHOICES, default="demande")
    approuve_par  = models.CharField(max_length=200, blank=True)
    approuve_le   = models.DateField(null=True, blank=True)
    notes         = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Congé"
        ordering = ["-date_debut"]

    def __str__(self):
        return f"{self.employe.code} — {self.get_type_conge_display()} {self.date_debut}→{self.date_fin}"

    @property
    def nb_jours(self):
        if not self.date_debut or not self.date_fin:
            return 0
        return max(0, (self.date_fin - self.date_debut).days + 1)


class Competence(SoftDeleteModel):
    """Référentiel des compétences activable."""
    CATEGORIE_CHOICES = [
        ("technique",      "Technique BTP"),
        ("agricole",       "Agricole / pépinière"),
        ("conduite_engin", "Conduite d'engin"),
        ("management",     "Management"),
        ("administratif",  "Administratif"),
        ("autre",          "Autre"),
    ]

    code        = models.CharField(max_length=30, unique=True)  # SKL-MACONNERIE
    libelle     = models.CharField(max_length=150)
    categorie   = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default="technique")
    niveau_max  = models.PositiveSmallIntegerField(default=5)
    actif       = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Compétence"
        ordering = ["categorie", "libelle"]

    def __str__(self):
        return self.libelle


class CompetenceEmploye(TimeStampedModel):
    """Compétence détenue par un employé avec niveau."""
    employe          = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name="competences")
    competence       = models.ForeignKey(Competence, on_delete=models.PROTECT, related_name="acquisitions")
    niveau           = models.PositiveSmallIntegerField(default=1)
    date_acquisition = models.DateField(null=True, blank=True)
    notes            = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Compétence employé"
        unique_together = ["employe", "competence"]
        ordering = ["competence__libelle"]

    def __str__(self):
        return f"{self.employe.code} — {self.competence.libelle} ({self.niveau})"


class Certification(TimeStampedModel):
    """Certification, diplôme ou habilitation rattachée à un employé."""
    employe         = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name="certifications")
    libelle         = models.CharField(max_length=200)
    organisme       = models.CharField(max_length=200, blank=True)
    numero          = models.CharField(max_length=100, blank=True)
    date_obtention  = models.DateField()
    date_expiration = models.DateField(null=True, blank=True, help_text="Vide = sans expiration.")
    notes           = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Certification"
        ordering = ["-date_obtention"]

    def __str__(self):
        return f"{self.employe.code} — {self.libelle}"

    @property
    def statut(self):
        """valide / bientot_expiree (≤ 60 j) / expiree / sans_expiration"""
        if not self.date_expiration:
            return "sans_expiration"
        from datetime import date, timedelta
        today = date.today()
        if self.date_expiration < today:
            return "expiree"
        if self.date_expiration <= today + timedelta(days=60):
            return "bientot_expiree"
        return "valide"


class HistoriqueContrat(TimeStampedModel):
    """Trace l'évolution contractuelle d'un employé (type, salaire, dates)."""
    employe          = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name="historique_contrats")
    type_contrat     = models.CharField(max_length=20, choices=Employe.TYPE_CHOICES)
    poste            = models.CharField(max_length=150, blank=True)
    date_debut       = models.DateField()
    date_fin         = models.DateField(null=True, blank=True, help_text="Vide = contrat en cours.")
    salaire_mensuel  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    taux_journalier  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    motif_fin        = models.CharField(max_length=200, blank=True)
    notes            = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Historique contrat"
        ordering = ["-date_debut"]

    def __str__(self):
        return f"{self.employe.code} — {self.type_contrat} ({self.date_debut})"

    @property
    def est_en_cours(self):
        return self.date_fin is None


class MissionMoo(TimeStampedModel):
    """Mission ponctuelle d'un employé MOO, payée au forfait."""
    employe = models.ForeignKey(
        Employe, on_delete=models.PROTECT, related_name="missions_moo",
        limit_choices_to={"type_contrat": "moo"},
    )
    projet = models.ForeignKey(
        "projets.Projet", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="missions_moo",
    )
    description = models.CharField(max_length=300)
    date_debut = models.DateField()
    date_fin = models.DateField()
    montant_forfaitaire = models.DecimalField(max_digits=12, decimal_places=2)
    paye_le = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Mission MOO"
        ordering = ["-date_debut"]

    def __str__(self):
        return f"{self.employe.code} — {self.description[:30]}"
