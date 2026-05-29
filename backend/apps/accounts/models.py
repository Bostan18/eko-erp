from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Role(models.TextChoices):
    """Rôles métier EKO. Chaque utilisateur a exactement un rôle."""
    ADMIN         = "ADMIN",         "Administrateur"
    DIRECTION     = "DIRECTION",     "Direction"
    COMPTABLE     = "COMPTABLE",     "Comptable"
    RH            = "RH",            "Ressources Humaines"
    CHEF_CHANTIER = "CHEF_CHANTIER", "Chef de chantier"
    LECTURE       = "LECTURE",       "Lecture seule"


class Profile(TimeStampedModel):
    """Extension du User Django — un Profile par User (OneToOne, signal post_save).

    Porte le rôle métier (RBAC simple). Le lien vers l'employé RH se fait
    dans l'autre sens via `Employe.user` (OneToOneField sur apps.rh.Employe).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.LECTURE,
        help_text="Détermine les modules accessibles. Voir apps.accounts.permissions.",
    )

    class Meta:
        verbose_name = "Profil utilisateur"
        verbose_name_plural = "Profils utilisateurs"

    def __str__(self):
        return f"{self.user.username} — {self.get_role_display()}"
