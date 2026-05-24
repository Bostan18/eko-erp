#!/bin/sh
set -e

# Attend la disponibilité de Postgres (au cas où le healthcheck Docker compose lâcherait trop tôt)
echo "[entrypoint] Migrations Django..."
python manage.py migrate --noinput

# Passe la main au CMD du docker-compose (par défaut : runserver)
exec "$@"
