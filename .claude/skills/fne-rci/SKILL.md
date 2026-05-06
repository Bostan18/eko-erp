# Skill-FNE-RCI : Maîtrise du dispositif de Facture Normalisée Électronique (FNE) en Côte d'Ivoire

## 1. Vue d'ensemble et contexte

### 1.1. Contexte légal
La loi de finances pour la gestion 2025 (n° 2024-1109 du 18 décembre 2024) a étendu l'obligation de délivrance de la facture normalisée électronique (FNE) et du reçu normalisé électronique (RNE) à **tous les opérateurs économiques**, quels que soient leur régime d'imposition et leur forme juridique. Cette réforme s'inscrit dans la continuité des dispositions de 2005 (articles 384, 385 du CGI et articles 144 et suivants du LPF).

L'objectif est de digitaliser et dématérialiser les procédures de facturation pour assurer la traçabilité et l'authenticité des transactions commerciales.

### 1.2. Abréviations clés
- **API** : Application Programming Interface
- **CGI** : Code Général des Impôts
- **DFE** : Déclaration Fiscale d'Existence
- **DGI** : Direction Générale des Impôts
- **FNE** : Facture Normalisée Electronique
- **LPF** : Livre des Procédures Fiscales
- **NCC** : Numéro de Compte Contribuable
- **NTD** : Numéro de Télédéclarant
- **QR Code** : Quick Response Code
- **RNE** : Reçu Normalisé Electronique
- **TERNE** : Terminaux d'Emission de Reçus Normalisés Electroniques
- **TPE** : Terminal de Paiement Electronique

## 2. Procédures de gestion de la facturation (Arrêté N° 0337)

Trois procédures sont instituées :

1.  **Procédure de droit commun** : Utilisation directe de la plateforme dédiée de l'Administration fiscale (`https://fne.dgi.gouv.ci`).
2.  **Procédure d'exception (API)** : Interfaçage entre la plateforme de l'Administration et les systèmes de facturation informatisés des entreprises. Cette procédure est soumise à **option** et **accord préalable du Directeur général des Impôts**.
3.  **Procédure TERNE** : Génération des reçus normalisés électroniques via des terminaux de paiement électronique. Cette procédure s'applique aux entreprises du régime forfaitaire et aux entreprises de ventes à rayons multiples.

## 3. Composition de la FNE et du RNE (Le "Sticker Electronique")

La certification par une signature électronique se matérialise par trois éléments distincts :

1.  **Le visuel FNE** : un logo apposé sur le document.
2.  **Un QR Code** : qui, scanné, affiche les informations de la facture.
3.  **Un format de numérotation unique**.

**Formats de numérotation (série annuelle ininterrompue) :**
- **Facture de vente** : `[NCC] + [Année] + [Séquence]`
- **Facture d'avoir** : `A + [NCC] + [Année] + [Séquence]`
- **Facture proforma** : `P + [NCC] + [Année] + [Séquence]`
- **Bordereau** : `B3 + [NCC] + [Année] + [Séquence]`

**Mentions obligatoires (Art. 6 de l'Arrêté) :**
- Identification précise du redevable (raison sociale, adresse, NCC, RCCM, etc.).
- Identification du client (nom, raison sociale, adresse, NCC pour les transactions B2B).
- Numéro d'ordre de la facture.
- Date et heure d'émission.
- Désignation détaillée des articles ou services.
- Prix, taux de TVA, total payé et mode de règlement.

## 4. Procédure d'Interfaçage par API

Pour les entreprises qui souhaitent interfacer leur système de facturation (ERP) avec la plateforme FNE.

### 4.1. Prérequis techniques
- Supporter les requêtes HTTP (RESTful API).
- Gérer des données JSON.
- Supporter l'authentification via OAuth 2.0.
- Disposer d'une connexion internet stable et sécurisée.

### 4.2. Étapes de la procédure
1.  **Inscription à la plateforme de test** : sur `http://54.247.95.108`.
2.  **Configuration** de l'environnement de test.
3.  **Développement** de l'interface.
4.  **Tests** de génération de factures (vente, avoir, bordereau).
5.  **Transmission des spécimens** de factures à la DGI via `support.fne@dgi.gouv.ci`.
6.  **Validation de la conformité** par la DGI.
7.  **Transmission de l'URL de production** et affichage de la clé API sur l'espace de l'entreprise.

### 4.3. Détails de l'API

**Authentification**
- Type : `Bearer Token` (JWT)
- Header : `Authorization: Bearer <token>`

**API Methods**
- **Méthode** : `POST`
- **URL Test** : `http://54.247.95.108/ws`
- **URL Prod** : fournie après validation.

#### API #1: Certification de facture de vente
- **Endpoint** : `POST $url/external/invoices/sign`
- **Paramètres obligatoires** :
    - `invoiceType`: "sale"
    - `paymentMethod`: cash, card, check, mobile-money, transfer, deferred
    - `template`: B2B, B2C, B2G, B2F
    - `isRne`: true/false
    - `pointOfSale`, `establishment`
    - `items`: array d'articles
    - `taxes`: TVA, TVAB, TVAC, TVAD
- **Réponse** : Contient `ncc`, `reference` (numéro de facture), `token` (lien de vérification QR code), `balance_sticker` et l'objet `invoice` avec tous les détails.

#### API #2: Certification de facture d'avoir
- **Endpoint** : `POST $url/external/invoices/{id}/refund`
- **Paramètres obligatoires** :
    - `id` : l'identifiant de la facture d'origine (récupéré dans la réponse de l'API #1)
    - `items` : array des articles avec `id` (de l'article original) et `quantity` à retourner.

### 4.4. Codes de réponse
- **200/201** : Succès
- **400** : Erreur dans la requête
- **401** : Erreur d'authentification
- **500** : Endpoint non disponible

## 5. Demande de TERNE (Formulaire officiel)

Pour les entreprises éligibles à la procédure TERNE, le formulaire de demande doit inclure :

1.  **Informations générales du contribuable** : N° CC, raison sociale, régime d'imposition, forme juridique, N° RCCM, date d'inscription à la FNE, adresse, téléphone, email.
2.  **Informations du représentant légal** : Nom, fonction, téléphone, email.
3.  **Détails de la demande** : Tableau récapitulatif par établissement avec nombre de points de vente, nombre de TERNE demandés, existants, et nombre de TPE existants.
4.  **Engagement du demandeur** : Certification sur l'honneur de l'exactitude des informations, signature et cachet de l'entreprise.

## 6. Guide d'utilisation de la plateforme FNE

### 6.1. Inscription et connexion
1.  Accéder à `https://fne.dgi.gouv.ci`.
2.  Cliquer sur "Inscrivez-vous" et renseigner le formulaire avec le NCC et le NTD.
3.  Renseigner les informations de localisation (section/parcelle ou lot/îlot).
4.  Vérifier les informations, accepter les CGU et soumettre.
5.  Les identifiants de connexion sont envoyés par mail à l'adresse du gestionnaire.
6.  Lors de la première connexion, un OTP est envoyé par mail. Un changement de mot de passe est obligatoire (12 caractères, avec majuscule, minuscule, chiffre, caractère spécial).

### 6.2. Configuration de l'espace
- **Paramétrage** : Importer le logo, définir le seuil d'alerte des stickers, gérer l'option "Timbre de quittance", activer le bordereau d'achat.
- **Création d'établissements** : Ajouter les établissements secondaires.
- **Création de points de vente** : Créer un point de vente pour chaque caisse.
- **Gestion des utilisateurs** : Le gestionnaire principal peut créer des utilisateurs, définir leurs habilitations et les rattacher à un établissement/point de vente.

### 6.3. Gestion des stickers
L'achat de stickers se fait via le menu "Gestion des stickers". L'achat se fait par Mobile Money (ou carte bancaire plus tard). Le solde diminue à chaque génération de facture ou reçu.

### 6.4. Édition des factures
1.  Accéder à "Gestion des reçus et factures" > "Reçus et factures émis".
2.  Cliquer sur "Générer la facture".
3.  Remplir le formulaire en 6 parties :
    - **Générer la facture** : Choisir le type (vente, proforma, bordereau), le mode de paiement et le type de facturation (B2B, B2C, B2F, B2G).
    - **Informations du client** : Pour B2B, le NCC affiche automatiquement les infos si le client est inscrit.
    - **Ajouter un article** : Renseigner quantité, désignation, prix, remise et sélectionner le(s) taux de taxe(s) (TVA, TVAB, etc.) et les autres taxes si nécessaire.
    - **Remise** : Appliquer une remise globale en pourcentage.
    - **Taxe sur total TTC** : Ajouter une taxe globale sur le total TTC.
    - **Résumé de la facture** : Voir le détail avant validation.
4.  Finaliser par "Générer la facture" pour obtenir le document certifié avec QR code et numéro de série.
5.  Une facture sauvegardée est non signée (sans QR code ni numéro de série).

### 6.5. Génération d'un avoir
Depuis l'historique des factures, cliquer sur l'icône "Avoir" pour une facture de vente, sélectionner les articles et la quantité à retourner.

## 7. Calendrier d'entrée en vigueur (Art. 8 de l'Arrêté)

- **Régime Normal d'Imposition (RNI)** : au plus tard le **1er juin 2025**.
- **Régime Simplifié d'Imposition (RSI)** : au plus tard le **1er juillet 2025**.
- **Régime des Micro-Entreprises (RME)** : au plus tard le **1er août 2025**.
- **Régime de l'Entrepreneur** : au plus tard le **1er septembre 2025**.

**Note importante** : Dans l'attente de la mise en œuvre effective, la facture normalisée sur support papier continue d'être utilisée (Art. 6 de la loi de finances et BODGI).

## 8. Cas particuliers

- **Exonérations** : Pharmacies, compagnies aériennes, banques et compagnies d'assurances sont expressément dispensées.
- **Seuil pour les entreprises au régime forfaitaire** : L'obligation ne s'applique que pour les achats d'une valeur **égale ou supérieure à 5 000 francs CFA** (sauf pour les transactions entre professionnels).

## 9. Support et contacts utiles

- **Portail officiel** : [https://fne.dgi.gouv.ci/](https://fne.dgi.gouv.ci/)
- **Service d'assistance** : 25 21 01 86 60 (choisir l'option 4)
- **Demandes d'informations** : `infos.fne@dgi.gouv.ci`
- **Support technique (API, incidents)** : `support.fne@dgi.gouv.ci`

---

*Document consolidé le 1er avril 2026, basé sur les textes et guides de mai 2025.*