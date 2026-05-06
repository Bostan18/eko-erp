# EKO SARL — ERP/CRM

Système de gestion intégré pour EKO SARL (Agriculture · BTP · Développement durable).

## Stack technique
- **Backend** : Python 3.11 · Django 5 · Django REST Framework
- **Frontend** : React 18 · Vite · TailwindCSS
- **Base de données** : PostgreSQL 16
- **Cache** : Redis 7
- **Conteneurisation** : Docker · Docker Compose

## Modules
| Module | Description |
|--------|-------------|
| CRM | Clients, prospects, devis, contrats |
| Projets | BTP, Agriculture, Pépinière, Location |
| Comptabilité | Facturation, paiements, bilan |
| Stocks | Intrants, matériaux, équipements |
| RH & Paie | Permanents, journaliers, MOO |
| Reporting | KPIs, tableaux de bord |

## Démarrage rapide (WSL2 Ubuntu)

```bash
# Cloner et entrer dans le projet
cd ~/projects && git clone <repo-url> eko-erp && cd eko-erp

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # puis éditer .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

## Avec Docker

```bash
docker compose up --build
```

## Documentation
- [Architecture](docs/architecture/README.md)
- [ERD Base de données](docs/database/ERD.md)
- [API Reference](docs/api/README.md)
