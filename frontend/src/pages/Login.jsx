import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'

export default function Login() {
  const { token, login } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/token/', form)
      login(data.access, data.refresh, { username: form.username })
      navigate('/')
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Texture subtle */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle at 25% 30%, #ffffff 0%, transparent 40%), radial-gradient(circle at 75% 70%, #ffffff 0%, transparent 35%)' }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-forest-500 rounded-xl mb-4 shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
              <path d="M12 2C8 2 4 5 4 9c0 5 8 13 8 13s8-8 8-13c0-4-4-7-8-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-white text-[28px] tracking-tight">
            EKO <span className="text-forest-400">SARL</span>
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-forest-400 mt-2">
            Système ERP · Côte d'Ivoire
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-7 shadow-2xl">
          <div className="mb-5">
            <h2 className="font-display font-semibold text-ink text-lg">Connexion</h2>
            <p className="text-[12px] text-sand-500 mt-0.5">Identifiez-vous pour accéder à votre espace.</p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-700 text-[12.5px] font-body flex items-start gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="block">
              <span className="block font-display text-[11.5px] font-medium text-sand-700 mb-1">
                Nom d'utilisateur
              </span>
              <input
                type="text"
                className="input"
                placeholder="timite"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </label>

            <label className="block">
              <span className="block font-display text-[11.5px] font-medium text-sand-700 mb-1">
                Mot de passe
              </span>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            <button type="submit" className="btn-primary w-full justify-center mt-2 py-2.5" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-forest-500 text-[11px] mt-6 font-mono uppercase tracking-[0.14em]">
          Agriculture · BTP · Location · Espaces verts
        </p>
      </div>
    </div>
  )
}
