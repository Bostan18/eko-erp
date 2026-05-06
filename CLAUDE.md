# EKO SARL — ERP/CRM · Guide pour Claude Code

## Contexte entreprise
EKO SARL opère dans 4 domaines :
- **Agriculture** : pépinière, entretien de plants, plantations
- **BTP** : construction, rénovation, démolition
- **Location** : machines et engins de chantier
- **Développement durable** : entretien d'espaces verts

## Personnel
- Employés permanents (CDI) → salaire mensuel fixe
- Journaliers → taux journalier × jours présents
- MOO (Main d'Œuvre Occasionnelle) → selon mission

## Architecture
- **Backend** : Django 5 + DRF, PostgreSQL, Redis
- **Frontend** : React 18 + Vite + TailwindCSS
- **Auth** : JWT (SimpleJWT)
- **Environnement dev** : WSL2 Ubuntu

## Conventions de code
- Python : snake_case, docstrings en français
- JS/TS : camelCase, composants en PascalCase
- API : REST, préfixe `/api/`
- Modèles : héritent de `SoftDeleteModel` ou `TimeStampedModel`
- IDs métier : CLI-001, PRJ-001, EMP-001

## Structure des apps Django
```
backend/apps/
  core/        # Modèles abstraits (timestamps, soft delete)
  crm/         # Clients, prospects, devis
  projets/     # Chantiers BTP et projets agricoles
  comptabilite/ # Factures, paiements, charges
  stocks/      # Inventaire, entrées/sorties
  rh/          # Employés, présences, paie
  reporting/   # KPIs, exports
```

## Commandes fréquentes
```bash
# Backend
source backend/venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# Tests
python manage.py test apps.crm

# Frontend
cd frontend && npm run dev
```

## Priorités de développement
1. Module RH (journaliers/pointage) — le plus critique
2. Module Projets (suivi chantiers)
3. Module CRM (clients/devis)
4. Comptabilité & Stocks
5. Reporting
