import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock complet d'axios — syncManager fait `import axios from 'axios'` puis
// `axios(config)`. Il faut donc que l'export default soit une fonction
// vi.fn appelable, et qu'elle ait aussi `.get` / `.post` pour prefetch.
const axiosMock = vi.fn()
axiosMock.get  = vi.fn()
axiosMock.post = vi.fn()
axiosMock.create = vi.fn(() => axiosMock)
axiosMock.interceptors = {
  request:  { use: vi.fn(), eject: vi.fn() },
  response: { use: vi.fn(), eject: vi.fn() },
}
vi.mock('axios', () => ({ default: axiosMock, ...{} }))

// Import après le mock
const { db } = await import('../db')
const {
  queueOp, syncAll, prefetchReferenceData,
  countPending, MAX_RETRIES,
} = await import('../syncManager')

beforeEach(async () => {
  globalThis.__setOnline(true)
  await db.pendingOps.clear()
  await db.employes.clear()
  await db.projets.clear()
  await db.taches.clear()
  await db.syncMeta.clear()
  axiosMock.mockReset()
  axiosMock.get.mockReset()
  axiosMock.post.mockReset()
  localStorage.clear()
  localStorage.setItem('access_token', 'fake-jwt')
})

describe('syncManager', () => {

  it('queueOp ajoute une opération dans pendingOps', async () => {
    globalThis.__setOnline(false)
    const result = await queueOp({
      type: 'pointage',
      endpoint: '/rh/presences/saisie_journee/',
      method: 'POST',
      payload: { date: '2026-05-17', presences: [] },
    })
    expect(result.queued).toBe(true)
    expect(result.id).toBeDefined()
    expect(await countPending()).toBe(1)
    const op = await db.pendingOps.get(result.id)
    expect(op.endpoint).toBe('/rh/presences/saisie_journee/')
    expect(op.tentatives).toBe(0)
    expect(axiosMock).not.toHaveBeenCalled()
  })

  it('syncAll rejoue les opérations dans l\'ordre createdAt', async () => {
    globalThis.__setOnline(false)
    await queueOp({ type: 'a', endpoint: '/projets/realisations/', method: 'POST', payload: { n: 1 } })
    await new Promise((r) => setTimeout(r, 5))
    await queueOp({ type: 'b', endpoint: '/projets/realisations/', method: 'POST', payload: { n: 2 } })

    const calls = []
    axiosMock.mockImplementation(async (config) => {
      calls.push(config.data.n)
      return { status: 200, data: {} }
    })

    globalThis.__setOnline(true)
    const summary = await syncAll()

    expect(calls).toEqual([1, 2])
    expect(summary.ok).toBe(2)
    expect(await countPending()).toBe(0)
  })

  it('un 4xx supprime l\'opération de la file (erreur permanente)', async () => {
    globalThis.__setOnline(false)
    const { id } = await queueOp({
      type: 'photo', endpoint: '/projets/projets/1/photos/', method: 'POST', payload: {},
    })

    axiosMock.mockRejectedValue({ response: { status: 400, data: { detail: 'mauvais' } } })

    globalThis.__setOnline(true)
    const summary = await syncAll()
    expect(summary.failed).toBe(1)
    expect(await countPending()).toBe(0)
    expect(await db.pendingOps.get(id)).toBeUndefined()
  })

  it('une erreur réseau retry jusqu\'à MAX_RETRIES puis abandonne', async () => {
    globalThis.__setOnline(false)
    const { id } = await queueOp({
      type: 'realisation', endpoint: '/projets/realisations/', method: 'POST', payload: {},
    })

    axiosMock.mockRejectedValue({ code: 'ERR_NETWORK', message: 'Network Error' })

    globalThis.__setOnline(true)
    // 1ère tentative : tentatives passe de 0 → 1, op gardée
    let summary = await syncAll()
    expect(summary.retry).toBe(1)
    expect(await countPending()).toBe(1)

    // Appels successifs jusqu'à atteindre MAX_RETRIES → suppression
    for (let i = 1; i < MAX_RETRIES; i++) {
      summary = await syncAll()
    }
    expect(await countPending()).toBe(0)
    expect(await db.pendingOps.get(id)).toBeUndefined()
  })

  it('prefetchReferenceData remplit les stores IndexedDB', async () => {
    axiosMock.get.mockImplementation(async (url) => {
      if (url === '/api/rh/employes/') {
        return { data: [{ id: 1, code: 'EMP-001', nom: 'Koné', prenom: 'A', type_contrat: 'journalier' }] }
      }
      if (url === '/api/projets/projets/') {
        return { data: [{ id: 10, code: 'PRJ-1', nom: 'Yopo', statut: 'en_cours', localisation: 'YOP', client_nom: 'Mairie' }] }
      }
      if (url === '/api/projets/taches/') {
        return { data: [{ id: 100, projet: 10, nom: 'Terrassement', statut: 'en_cours', date_debut: '2026-05-01', date_fin_prevue: '2026-05-20' }] }
      }
      return { data: [] }
    })

    await prefetchReferenceData()
    expect(await db.employes.count()).toBe(1)
    expect(await db.projets.count()).toBe(1)
    expect(await db.taches.count()).toBe(1)
    const meta = await db.syncMeta.get('last_full_sync')
    expect(meta?.value).toBeDefined()
  })
})
