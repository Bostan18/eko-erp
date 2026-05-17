import axios from 'axios'
import { db, SYNC_META_LAST_FULL } from './db'
import { isOnline } from './networkStatus'

export const MAX_RETRIES = 5

export const SYNC_OK_EVENT      = 'eko:sync:ok'
export const SYNC_ERROR_EVENT   = 'eko:sync:error'
export const SYNC_PROGRESS_EVENT = 'eko:sync:progress'

/**
 * Endpoints autorisés à être bufférisés offline.
 * Tout autre POST/PUT/PATCH/DELETE sera rejeté hors-ligne.
 */
export const OFFLINE_WHITELIST = [
  /^\/rh\/presences\/saisie_semaine\/?$/,
  /^\/rh\/presences\/saisie_journee\/?$/,
  /^\/projets\/realisations\/saisie_multiple\/?$/,
  /^\/projets\/realisations\/?$/,
  /^\/projets\/projets\/\d+\/photos\/?$/,
]

export function endpointAutoriseOffline(endpoint) {
  return OFFLINE_WHITELIST.some((r) => r.test(endpoint))
}

function dispatch(event, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(event, { detail }))
  }
}

/**
 * Met en file une opération mutative.
 *
 * payload peut être un object (JSON) ou un FormData sérialisé en
 * { __formData: true, entries: [[key, value | { blob, name }] ...] }.
 *
 * @returns {Promise<{ queued: true, id: number, online: boolean }>}
 */
export async function queueOp({ type, endpoint, method = 'POST', payload = {} }) {
  const id = await db.pendingOps.add({
    type,
    endpoint,
    method,
    payload,
    createdAt: new Date().toISOString(),
    tentatives: 0,
    status: 'pending',
  })

  // Tentative immédiate si online
  if (isOnline()) {
    syncAll().catch(() => {})
  }
  return { queued: true, id, online: isOnline() }
}

/**
 * Reconstitue un FormData à partir d'une payload sérialisée.
 */
function rebuildPayload(payload) {
  if (payload && payload.__formData && Array.isArray(payload.entries)) {
    const fd = new FormData()
    for (const [k, v] of payload.entries) {
      if (v && typeof v === 'object' && v.blob instanceof Blob) {
        fd.append(k, v.blob, v.name ?? 'file')
      } else {
        fd.append(k, v)
      }
    }
    return fd
  }
  return payload
}

function buildAxiosConfig(op) {
  const data = rebuildPayload(op.payload)
  const token = localStorage.getItem('access_token')
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json'

  return {
    url: `/api${op.endpoint}`,
    method: op.method,
    data,
    headers,
  }
}

/**
 * Rejoue toutes les opérations en file (ordre createdAt).
 * - succès 2xx       : suppression de la file
 * - échec 4xx        : marqué failed, supprimé, log
 * - échec réseau/5xx : tentatives++, garde en file jusqu'à MAX_RETRIES
 */
export async function syncAll() {
  if (!isOnline()) return { skipped: true, reason: 'offline' }

  const ops = await db.pendingOps.orderBy('createdAt').toArray()
  if (ops.length === 0) {
    dispatch(SYNC_OK_EVENT, { count: 0 })
    return { ok: 0, failed: 0, retry: 0 }
  }

  let okCount = 0
  let failedCount = 0
  let retryCount = 0

  for (const op of ops) {
    try {
      await axios(buildAxiosConfig(op))
      await db.pendingOps.delete(op.id)
      okCount += 1
      dispatch(SYNC_PROGRESS_EVENT, { done: okCount, total: ops.length })
    } catch (err) {
      const status = err?.response?.status
      if (status && status >= 400 && status < 500) {
        // 4xx → erreur permanente, on retire de la file pour ne pas boucler
        await db.pendingOps.update(op.id, { status: 'failed', erreur: status })
        await db.pendingOps.delete(op.id)
        failedCount += 1
        dispatch(SYNC_ERROR_EVENT, { op, status, fatal: true })
      } else {
        const tentatives = (op.tentatives ?? 0) + 1
        if (tentatives >= MAX_RETRIES) {
          await db.pendingOps.delete(op.id)
          failedCount += 1
          dispatch(SYNC_ERROR_EVENT, { op, status, fatal: true, retriesExceeded: true })
        } else {
          await db.pendingOps.update(op.id, { tentatives })
          retryCount += 1
        }
      }
    }
  }

  if (okCount > 0 && failedCount === 0 && retryCount === 0) {
    dispatch(SYNC_OK_EVENT, { count: okCount })
  }

  return { ok: okCount, failed: failedCount, retry: retryCount }
}

/**
 * Précharge les données de référence pour consultation offline.
 */
export async function prefetchReferenceData() {
  const token = localStorage.getItem('access_token')
  if (!token) return
  const headers = { Authorization: `Bearer ${token}` }

  try {
    const [empl, proj, taches] = await Promise.all([
      axios.get('/api/rh/employes/', { headers }),
      axios.get('/api/projets/projets/', { headers }),
      axios.get('/api/projets/taches/', { headers }),
    ])
    const employes = empl.data.results ?? empl.data
    const projets  = proj.data.results ?? proj.data
    const ts       = taches.data.results ?? taches.data

    await db.transaction('rw', db.employes, db.projets, db.taches, db.syncMeta, async () => {
      await db.employes.clear()
      await db.projets.clear()
      await db.taches.clear()
      await db.employes.bulkAdd(employes.map((e) => ({
        id: e.id, code: e.code, nom: e.nom, prenom: e.prenom,
        statut: e.statut ?? '', type_contrat: e.type_contrat ?? '',
      })))
      await db.projets.bulkAdd(projets.map((p) => ({
        id: p.id, code: p.code, nom: p.nom, statut: p.statut,
        lieu: p.localisation ?? '', client_nom: p.client_nom ?? '',
      })))
      await db.taches.bulkAdd(ts.map((t) => ({
        id: t.id, projetId: t.projet, nom: t.nom, statut: t.statut,
        date_debut: t.date_debut, date_fin_prevue: t.date_fin_prevue,
      })))
      await db.syncMeta.put({ key: SYNC_META_LAST_FULL, value: new Date().toISOString() })
    })
  } catch (err) {
    // Network error or auth fail — pas grave, on retentera plus tard
  }
}

export async function countPending() {
  return db.pendingOps.count()
}

export async function listPending() {
  return db.pendingOps.orderBy('createdAt').toArray()
}
