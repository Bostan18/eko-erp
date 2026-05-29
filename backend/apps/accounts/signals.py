from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile, Role


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def creer_profile_pour_user(sender, instance, created, **kwargs):
    """Crée automatiquement un Profile lorsqu'un User est créé.

    Les superusers sont promus ADMIN d'office (sécurise les comptes
    créés via `createsuperuser`). Les autres reçoivent LECTURE par défaut
    et devront être promus via /api/auth/users/ par un ADMIN.
    """
    if not created:
        return
    role = Role.ADMIN if instance.is_superuser else Role.LECTURE
    Profile.objects.create(user=instance, role=role)
