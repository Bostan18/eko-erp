# Architecture EKO ERP

## Vue d'ensemble

```
[Navigateur Web]
     │
     ▼
[React 18 + Vite + TailwindCSS]  :5173
     │  REST/JSON
     ▼
[Django REST Framework]           :8000
     │
     ├──[PostgreSQL 16]           :5432
     ├──[Redis 7]                 :6379
     └──[Stockage fichiers /media]
```

## Choix techniques et justifications

| Composant | Choix | Raison |
|-----------|-------|--------|
| Backend | Django 5 | Robuste, admin intégré, ORM puissant |
| API | DRF + JWT | Standard REST, stateless, mobile-ready |
| BDD | PostgreSQL | ACID, JSON natif, performant |
| Cache | Redis | Sessions, cache API, files d'attente |
| Frontend | React + Vite | Rapide, écosystème riche |
| Style | TailwindCSS | Utilitaire, cohérent |

## Gestion des rôles (RBAC)

| Rôle | Permissions |
|------|-------------|
| Directeur | Accès total + reporting |
| Chef de projet | Projets + RH + Stocks |
| Comptable | Comptabilité + lecture CRM |
| RH/Admin | RH + lecture projets |
| Terrain/Saisie | Présences + stocks (lecture) |
