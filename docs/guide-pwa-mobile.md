# Guide PWA mobile — EKO ERP

Ce guide explique aux chefs de chantier comment installer EKO sur leur
téléphone Android, utiliser l'app en mode hors-ligne, et que faire si la
synchronisation échoue.

> Cible matérielle principale : **Chrome sur Android 10+** sur un téléphone
> doté d'un verrou écran (mot de passe / empreinte).

---

## 1. Installer EKO sur Android (3 étapes)

1. Ouvrir Chrome et se rendre sur l'URL de l'ERP (`https://erp.eko.local`
   ou le domaine de production).
2. Lorsque l'invite « Installez EKO sur votre téléphone » apparaît, taper
   **Installer**. Si l'invite n'apparaît pas, ouvrir le menu Chrome (⋮)
   puis **Ajouter à l'écran d'accueil**.
3. Une icône **EKO** apparaît sur l'écran d'accueil. La lancer ouvre l'app
   en plein écran (sans barre d'adresse), comme une appli native.

À la première ouverture connectée à Internet, l'app **précharge** la
liste des journaliers, projets et tâches dans le téléphone — c'est ce qui
permet la consultation hors-ligne.

---

## 2. Vérifier que le mode hors-ligne fonctionne

1. Sur le téléphone, activer le **mode avion**.
2. Lancer EKO depuis l'icône. L'app doit s'ouvrir normalement.
3. Aller dans **Pointer mes équipes** → la liste des journaliers est
   visible (chargée depuis le cache).
4. Pointer 2 ou 3 journaliers puis taper **Valider la journée**. Un
   message confirme l'enregistrement local.
5. Vérifier dans le coin haut droit du header (ou dans la sidebar
   desktop) : la pastille indique **« X en attente »**.
6. Désactiver le mode avion. La pastille passe à **« ✓ Synchronisé »**
   en quelques secondes.

> En cas de doute, ouvrir Chrome DevTools (Chrome sur PC, connecté au
> téléphone) → **Application** → **IndexedDB** → `eko-offline` →
> `pendingOps`. Les opérations en attente sont listées avec leur date.

---

## 3. Prendre une photo géolocalisée d'un chantier

1. Depuis l'accueil mobile, taper **Photos chantier** (ou ouvrir un
   projet et son entrée *Nouvelle photo*).
2. Taper le gros bouton vert **Prendre une photo** → l'appareil photo
   arrière s'ouvre.
3. Cadrer, prendre la photo. Elle est automatiquement compressée à
   1600 px max et la position GPS est récupérée.
4. Choisir le type (avant / après / incident / autre), ajouter une
   légende facultative, taper **Valider**.
5. Si en ligne : la photo est uploadée immédiatement. Sinon : elle est
   enregistrée localement et envoyée au prochain retour de la 4G.

> Le navigateur demande l'autorisation **caméra** et **localisation** à
> la première utilisation. Si refusées, les ré-autoriser dans les
> paramètres Android → Apps → Chrome → Permissions.

---

## 4. Que faire si la synchronisation échoue ?

La pastille en haut à droite passe à **« ✗ Erreur sync »** dans deux cas :

1. **Mauvais identifiants** : votre token a expiré et le refresh a échoué.
   → Quitter l'app, vous reconnecter. Vos saisies en attente sont
   conservées dans IndexedDB et seront jouées après la reconnexion.
2. **Erreur 4xx côté serveur** (par ex. un projet supprimé entre-temps).
   → L'opération est retirée de la file. Taper sur la pastille pour voir
   les détails. Si plusieurs erreurs, contacter le directeur ou
   ressaisir manuellement après vérification.

En cas de **panne réseau temporaire**, l'app retente automatiquement
jusqu'à 5 fois. Au-delà, l'opération est abandonnée et une erreur est
loggée.

---

## 5. Mise à jour de l'app

L'app vérifie automatiquement les mises à jour à chaque ouverture. Si
une nouvelle version est disponible, elle est appliquée en arrière-plan
et activée au prochain démarrage. Aucun téléchargement Play Store —
c'est l'avantage des PWA.

---

## 6. Sécurité — lecture obligatoire

Les photos prises hors-ligne **sont stockées en clair** dans la mémoire
locale du téléphone (IndexedDB). En cas de perte ou vol du téléphone, un
tiers pourrait y accéder.

**Prérequis non négociables** :
- Activer un **verrou écran** (PIN, empreinte ou schéma) sur le téléphone.
- Ne **pas** partager le téléphone professionnel avec un tiers non
  autorisé pendant qu'EKO est ouverte.
- En cas de perte, prévenir le directeur immédiatement pour
  désactiver le compte JWT côté serveur.

---

## 7. Limitations actuelles (Sprint PWA mai 2026)

- **Pas de rôle « chef de chantier »** côté serveur : tout utilisateur
  authentifié peut, en théorie, uploader des photos sur n'importe quel
  projet. Une couche de permissions fines arrivera dans un sprint
  ultérieur.
- **Pas de notification push** : la sync est déclenchée au retour
  réseau et à l'ouverture de l'app.
- **Pas de mode sombre** dans cette version.
- **Tests sur appareil réel obligatoires** : Chrome desktop ne reproduit
  pas le comportement caméra / install prompt à l'identique.
