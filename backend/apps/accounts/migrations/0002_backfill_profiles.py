"""Crée rétroactivement un Profile pour les utilisateurs déjà en base.

Le signal post_save couvre les futurs Users, mais pas ceux créés avant
l'installation de l'app accounts. Les superusers existants → ADMIN, les
autres → LECTURE (à promouvoir manuellement ensuite via /api/auth/users/).
"""
from django.db import migrations


def backfill_profiles(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Profile = apps.get_model("accounts", "Profile")
    for user in User.objects.all():
        if Profile.objects.filter(user=user).exists():
            continue
        Profile.objects.create(
            user=user,
            role="ADMIN" if user.is_superuser else "LECTURE",
        )


def noop(apps, schema_editor):
    # Reverse : on garde les profils (sûr, pas destructif)
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(backfill_profiles, noop),
    ]
