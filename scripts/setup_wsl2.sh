#!/bin/bash
# =============================================================
# EKO ERP — Script d'installation WSL2 Ubuntu
# =============================================================
set -e

echo "================================================"
echo "  EKO ERP — Installation WSL2 Ubuntu"
echo "================================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${YELLOW}▶${NC} $1"; }

# --- Dépendances système ---
info "Mise à jour système..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
sudo apt-get install -y -qq \
  python3.11 python3.11-venv python3-pip \
  postgresql-client \
  nodejs npm \
  git curl wget

ok "Dépendances système installées"

# --- Backend Python ---
info "Configuration de l'environnement Python..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
ok "Environnement Python prêt"

# --- .env ---
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  Fichier .env créé. Éditez les valeurs avant de continuer :"
  echo "   nano backend/.env"
fi

deactivate
cd ..

# --- Frontend ---
info "Installation des dépendances frontend..."
cd frontend
npm install --silent
ok "Frontend prêt"
cd ..

# --- Docker (optionnel) ---
if ! command -v docker &> /dev/null; then
  info "Docker non détecté. Installation..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  ok "Docker installé (redémarrez WSL2 : wsl --shutdown)"
else
  ok "Docker déjà installé"
fi

echo ""
echo "================================================"
echo "  Installation terminée !"
echo "================================================"
echo ""
echo "Prochaines étapes :"
echo "  1. Démarrer PostgreSQL : sudo service postgresql start"
echo "  2. Créer la BDD       : sudo -u postgres createdb eko_erp"
echo "  3. Lancer le backend  : cd backend && source venv/bin/activate && python manage.py migrate && python manage.py runserver"
echo "  4. Lancer le frontend : cd frontend && npm run dev"
echo ""
echo "  Ou avec Docker : docker compose up --build"
