# ERD — Base de données EKO ERP

## Schéma relationnel

```
┌─────────────────┐       ┌─────────────────────┐
│   Client        │       │   Projet            │
│─────────────────│       │─────────────────────│
│ id (PK)         │       │ id (PK)             │
│ code CLI-xxx    │       │ code PRJ-xxx        │
│ nom             │       │ nom                 │
│ type_client     │       │ type_projet         │
│ secteur         │       │ statut              │
│ statut          │       │ client_id (FK)      │──┐
│ telephone       │       │ chef_projet_id (FK) │  │
│ email           │       │ budget_prevu        │  │
│ localite        │       │ budget_realise      │  │
│ created_at      │       │ date_debut          │  │
└─────────────────┘       │ date_fin_prevue     │  │
        │                 │ created_at          │  │
        │ 1               └─────────────────────┘  │
        │ N                       │                 │
        ▼                        │ 1               │
┌─────────────────┐              │ N               │
│   Devis         │              ▼                 │
│─────────────────│    ┌──────────────────────┐   │
│ id (PK)         │    │  ProjetEmploye       │   │
│ numero DEV-xxx  │    │  (table pivot)       │   │
│ client_id (FK)  │    │──────────────────────│   │
│ objet           │    │ projet_id (FK)       │   │
│ montant_ht      │    │ employe_id (FK)      │   │
│ taux_tva        │    │ role_sur_projet      │   │
│ montant_ttc     │    └──────────────────────┘   │
│ statut          │             ▲                  │
│ date_emission   │             │                  │
│ date_validite   │    ┌─────────────────────┐    │
└─────────────────┘    │   Employe           │    │
                       │─────────────────────│    │
                       │ id (PK)             │    │
┌─────────────────┐    │ code EMP-xxx        │    │
│   Facture       │    │ nom / prenom        │    │
│─────────────────│    │ type_contrat        │    │
│ id (PK)         │    │ statut              │    │
│ numero FAC-xxx  │    │ salaire_mensuel     │    │
│ client_id (FK)  │    │ taux_journalier     │    │
│ projet_id (FK)  │    │ date_entree         │    │
│ montant_ht      │    └─────────────────────┘    │
│ statut_paiement │             │                  │
│ date_echeance   │             │ 1                │
└─────────────────┘             │ N                │
                                ▼                  │
┌─────────────────┐    ┌─────────────────────┐    │
│  StockArticle   │    │ PresenceJournaliere │◄───┘
│─────────────────│    │─────────────────────│
│ id (PK)         │    │ id (PK)             │
│ designation     │    │ employe_id (FK)     │
│ categorie       │    │ projet_ref          │
│ unite           │    │ date                │
│ qte_stock       │    │ present             │
│ seuil_alerte    │    │ heures_travaillees  │
│ prix_unitaire   │    │ montant_du          │
│ fournisseur     │    └─────────────────────┘
└─────────────────┘
```

## Tables principales : 9
Client · Devis · Facture · Projet · ProjetEmploye · Employe · PresenceJournaliere · StockArticle · MouvementStock
