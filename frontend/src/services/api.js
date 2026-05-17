import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // ── Hors-ligne : tenter de bufferiser les écritures whitelistées ───────
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const isWrite = ['post', 'put', 'patch'].includes((original?.method || '').toLowerCase())
      if (isWrite && original) {
        const offline = await import('../offline/syncManager')
        const endpoint = (original.url || '').replace(/^\/api/, '')
        if (offline.endpointAutoriseOffline(endpoint)) {
          let payload = original.data
          if (payload instanceof FormData) {
            const entries = []
            for (const [k, v] of payload.entries()) {
              if (v instanceof Blob) entries.push([k, { blob: v, name: v.name ?? 'file' }])
              else entries.push([k, v])
            }
            payload = { __formData: true, entries }
          } else if (typeof payload === 'string') {
            try { payload = JSON.parse(payload) } catch { /* keep string */ }
          }
          const queued = await offline.queueOp({
            type: endpoint,
            endpoint,
            method: original.method?.toUpperCase() ?? 'POST',
            payload,
          })
          // Réponse synthétique pour ne pas casser les callers
          return Promise.resolve({
            status: 202,
            statusText: 'Queued offline',
            data: { offline: true, queued: true, id: queued.id },
            headers: {},
            config: original,
          })
        }
      }
    }

    // ── 401 : refresh + replay ────────────────────────────────────────────
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          // refresh failed
        }
      }
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
