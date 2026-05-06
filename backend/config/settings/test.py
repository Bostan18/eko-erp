from .base import *

DEBUG = False

# Base SQLite isolée pour les tests — pas besoin de CREATEDB PostgreSQL
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

# Désactiver les migrations pour des tests plus rapides
class DisableMigrations:
    def __contains__(self, item):
        return True
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
