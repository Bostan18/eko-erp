import Dexie from 'dexie'

export const db = new Dexie('eko-offline')

db.version(1).stores({
  // File d'attente des opérations POST/PUT/PATCH/DELETE à synchroniser
  pendingOps: '++id, type, endpoint, createdAt, tentatives, status',

  // Photos prises offline
  photos: '++id, projetId, prise_le, synced',

  // Données de référence cachées pour consultation offline
  employes: 'id, code, nom, prenom, statut',
  projets:  'id, code, nom, statut, lieu, client_nom',
  taches:   'id, projetId, nom, statut, date_debut, date_fin_prevue',

  // Métadonnées (key/value)
  syncMeta: 'key',
})

export const SYNC_META_LAST_FULL = 'last_full_sync'
