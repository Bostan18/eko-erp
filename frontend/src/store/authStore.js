import { create } from 'zustand'
import api from '../services/api'

/* Snapshot localStorage : on persiste user (incluant role + modules) pour
 * éviter un flash de Sidebar/garde-routes au refresh. Le profil est
 * re-fetché via loadMe() au boot pour rester à jour côté serveur. */

function readUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null') }
  catch { return null }
}

function writeUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user))
  else      localStorage.removeItem('user')
}

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('access_token') || null,
  user:  readUser(),

  /* Action appelée par Login après réception des JWT. */
  login: (access, refresh, user = null) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    if (user) writeUser(user)
    set({ token: access, user })
  },

  /* Remplace le profil courant (utilisé après /me ou modification de profil). */
  setMe: (user) => {
    writeUser(user)
    set({ user })
  },

  /* Récupère le profil serveur (rôle + modules + lien employé). */
  loadMe: async () => {
    try {
      const { data } = await api.get('/auth/me/')
      writeUser(data)
      set({ user: data })
      return data
    } catch {
      // Token invalide ou serveur down : on déloggue proprement.
      get().logout()
      return null
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    writeUser(null)
    set({ token: null, user: null })
  },

  /* Sélecteur de permission — true si l'utilisateur peut accéder au module.
   * Aligné avec apps/accounts/permissions.py:MODULE_ACCESS côté backend. */
  can: (modId) => {
    const { user } = get()
    if (!user) return false
    if (user.is_superuser) return true
    return Array.isArray(user.modules) && user.modules.includes(modId)
  },
}))

export default useAuthStore
