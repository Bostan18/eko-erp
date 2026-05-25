from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Comptes & accès"

    def ready(self):
        # Enregistre les signaux (auto-création du Profile)
        from . import signals  # noqa: F401
