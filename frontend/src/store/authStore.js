import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('access_token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login: (token, user) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
}))

export default useAuthStore
