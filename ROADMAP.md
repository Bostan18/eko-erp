# EKO SARL — Roadmap de développement

## Phase 1 — Fondations ✅ TERMINÉE (06 Mai 2026)

- [x]  Architecture et structure du projet (43 fichiers)
- [x]  Documentation Notion complète (8 pages + 4 BDD)
- [x]  Installation WSL2 Ubuntu + Python 3.12.3
- [x]  Dépendances Python installées (Django, DRF, JWT, psycopg2...)
- [x]  PostgreSQL connecté et migrations de base appliquées
- [x]  Admin Django fonctionnel → http://localhost:8000/admin
- [x]  Superuser créé (timite)
- [x]  CLAUDE.md pour Claude Code

## Phase 2 — Modules cœur ✅ TERMINÉE (06 Mai 2026)

- [x]  Migrations CRM et RH (`makemigrations` + `migrate`)
- [x]  Enregistrement admin Django (Client, Devis, Employé, Présence, Projet, Article, Mouvement)
- [x]  Correction bug PresenceJournaliere (import TimeStampedModel)
- [x]  Correction debug_toolbar (URLs + middleware + INTERNAL_IPS)
- [x]  APIs fonctionnelles : clients, employés, présences, projets, stocks
- [x]  Module Projets : modèles complets + migrations (Projet, IntervenantProjet)
- [x]  Module Stocks : modèles complets + migrations (Article, MouvementStock, alerte seuil)
- [x]  Frontend React : Vite + TailwindCSS + Zustand + Axios installés
- [x]  Frontend : layout + sidebar + auth JWT + navigation
- [x]  Frontend : pages liste (Employés, Projets, Clients)

## Phase 3 — Modules secondaires ✅ TERMINÉE (06 Mai 2026)

- [x]  Module Comptabilité backend (Facture, LigneFacture, Paiement, Charge) + API + Admin
- [x]  Pointage journalier : grille de saisie rapide + endpoints bulk (`feuille_journee`, `saisie_journee`)
- [x]  Formulaires de création : Employé, Client, Projet, Article, Facture (lignes dynamiques), Charge
- [x]  Stocks frontend : alertes visuelles, filtres catégorie, bannière sous-seuil
- [x]  Fiche détail Employé : présences du mois, total à payer, historique filtrable
- [x]  Fiche détail Projet : intervenants, mouvements de stock liés
- [x]  Factures : liste avec stats (encaissé / en attente / en retard), détail + paiement inline
- [x]  Charges : liste par catégorie, totaux dynamiques
- [x]  Sidebar : sous-menus RH (Employés / Pointage) et Comptabilité (Factures / Charges)

## Phase 4 — Reporting & Déploiement (À venir)

- [ ]  Tableau de bord KPIs dynamique (chiffres réels depuis l'API)
- [ ]  KPIs RH : masse salariale du mois, présences journaliers
- [ ]  KPIs Projets : projets en cours par type, budget engagé
- [ ]  KPIs Finance : CA facturé, encaissé, charges, marge
- [ ]  KPIs Stocks : articles en alerte, valeur du stock
- [ ]  Exports Excel / PDF (factures, feuilles de paie, rapports)
- [ ]  Tests automatisés (pytest)
- [ ]  Déploiement VPS (Nginx + Gunicorn + Docker)
