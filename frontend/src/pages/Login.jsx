import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import api from '../services/api'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

function getSaison(month) {
  if (month >= 3 && month <= 6)  return ['Saison des pluies', 'Cycle 1 · grande saison']
  if (month >= 7 && month <= 8)  return ['Saison sèche',      'Intersaison courte']
  if (month >= 9 && month <= 10) return ['Saison des pluies', 'Cycle 2 · petite saison']
  return ['Saison sèche', 'Harmattan']
}

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .14 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E"

export default function Login() {
  const { token, login, setMe, logout } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm]   = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  if (token) return <Navigate to="/" replace />

  const now = new Date()
  const [saisonLabel, saisonSub] = getSaison(now.getMonth())
  const dateStr = DATE_FMT.format(now)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/token/', form)
      // Pose le token d'abord, puis enrichit le store avec le profil serveur
      // (rôle, modules, employé lié). Si /me échoue : on déloggue plutôt
      // qu'entrer dans l'app sans rôle.
      login(data.access, data.refresh, { username: form.username })
      try {
        const { data: me } = await api.get('/auth/me/')
        setMe(me)
      } catch {
        logout()
        throw new Error('profile-failed')
      }
      navigate('/')
    } catch (err) {
      const msg = err?.message === 'profile-failed'
        ? 'Authentification OK mais profil indisponible. Réessayez.'
        : 'Identifiants incorrects. Veuillez réessayer.'
      setError(msg)
      setShake(true)
      setTimeout(() => setShake(false), 480)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-forest-950 overflow-hidden">
      {/* ─────────── PANNEAU GAUCHE : le champ ─────────── */}
      <section
        className="relative md:flex-[3] min-h-[260px] md:min-h-screen bg-forest-950 text-sand-100 overflow-hidden flex flex-col p-8 md:p-12"
        style={{ backgroundImage: `url("${GRAIN_URI}")` }}
      >
        {/* Courbes de niveau (tracé progressif) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.14] pointer-events-none"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path
              key={i}
              d={`M -50 ${110 + i * 95} Q 220 ${60 + i * 80}, 420 ${140 + i * 100} T 870 ${110 + i * 95}`}
              fill="none"
              stroke="white"
              strokeWidth="1"
              className="topo-line"
              style={{ animationDelay: `${i * 110}ms` }}
            />
          ))}
        </svg>

        {/* Éphéméride */}
        <header className="relative z-10 reveal" style={{ animationDelay: '60ms' }}>
          <p className="font-display font-bold text-[15px] md:text-[17px] text-sand-100 capitalize">
            {dateStr}
          </p>
          <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold-400/90">
            <span className="text-gold-500">●</span> {saisonLabel}
            <span className="text-sand-100/30 mx-1.5">·</span>
            <span className="text-sand-100/60">{saisonSub}</span>
          </p>
        </header>

        {/* Logo monolithique */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-start py-10 md:py-12">
          <h1
            className="font-display font-extrabold text-white leading-[0.82] tracking-[-0.045em]
                       text-[76px] sm:text-[110px] md:text-[140px] lg:text-[176px] reveal"
            style={{ animationDelay: '200ms' }}
          >
            E<span className="text-forest-500">K</span>O
          </h1>
          <div className="mt-5 flex items-center gap-3 reveal" style={{ animationDelay: '320ms' }}>
            <span className="h-px w-8 bg-gold-500" />
            <p className="font-mono text-[10.5px] md:text-[11px] uppercase tracking-[0.22em] text-sand-100/70">
              SARL · Côte d'Ivoire
            </p>
          </div>
        </div>

        {/* Coordonnées (md+ uniquement) */}
        <footer
          className="relative z-10 hidden md:block reveal"
          style={{ animationDelay: '460ms' }}
        >
          <div className="font-mono text-[10px] leading-[1.8] text-sand-100/55 uppercase tracking-[0.14em]">
            <p>Lat 5°20′N · Lon 4°02′W · Alt 18m</p>
            <p>Abidjan · CI</p>
          </div>
        </footer>
      </section>

      {/* ─────────── PANNEAU DROIT : le registre ─────────── */}
      <section className="relative md:flex-[2] bg-sand-100 flex items-center justify-center p-8 md:p-12">
        <div className={`w-full max-w-[360px] ${shake ? 'animate-shake' : ''}`}>
          <div className="relative pl-6">
            {/* Ruban gold vertical */}
            <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-gold-500 rounded-r-sm" />

            <p
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-sand-500 mb-2 reveal"
              style={{ animationDelay: '380ms' }}
            >
              Accès restreint
            </p>
            <h2
              className="font-display font-bold text-ink text-[28px] leading-none tracking-tight reveal"
              style={{ animationDelay: '440ms' }}
            >
              Identification
            </h2>
            <p
              className="font-body text-[12.5px] text-sand-600 mt-2 reveal"
              style={{ animationDelay: '500ms' }}
            >
              Connectez-vous à votre espace pour reprendre vos chantiers.
            </p>

            {error && (
              <div className="mt-5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px] font-body flex items-start gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5 reveal"
              style={{ animationDelay: '560ms' }}
            >
              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-sand-500 mb-1.5">
                  Identifiant
                </span>
                <input
                  type="text"
                  className="w-full bg-transparent border-0 border-b-[1.5px] border-sand-300 px-0 py-2
                             text-[14px] font-display text-ink placeholder-sand-400
                             focus:outline-none focus:border-forest-500 transition-colors"
                  placeholder="prenom.nom"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-sand-500 mb-1.5">
                  Mot de passe
                </span>
                <input
                  type="password"
                  className="w-full bg-transparent border-0 border-b-[1.5px] border-sand-300 px-0 py-2
                             text-[14px] font-display text-ink placeholder-sand-400
                             focus:outline-none focus:border-forest-500 transition-colors tracking-[0.22em]"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`group w-full mt-6 flex items-center justify-between gap-2
                            bg-forest-500 hover:bg-forest-600 text-white px-5 py-3.5 rounded-lg
                            font-display font-medium text-[13px] tracking-wide transition-all
                            disabled:opacity-60 disabled:cursor-not-allowed
                            shadow-[0_4px_14px_rgba(31,143,83,0.28)]
                            hover:shadow-[0_6px_22px_rgba(31,143,83,0.38)]
                            active:translate-y-px
                            ${loading ? 'animate-pulse-soft' : ''}`}
              >
                <span>{loading ? 'Authentification…' : 'Se connecter'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>

          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-400 mt-12 pl-6">
            EKO SARL · v2026.5 · <span className="text-gold-600">Système de gestion</span>
          </p>
        </div>
      </section>

      {/* Animations locales */}
      <style>{`
        @keyframes reveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { opacity: 0; animation: reveal .7s cubic-bezier(.2,.7,.2,1) forwards; }

        @keyframes draw {
          from { stroke-dashoffset: 1400; }
          to   { stroke-dashoffset: 0; }
        }
        .topo-line {
          stroke-dasharray: 1400;
          stroke-dashoffset: 1400;
          animation: draw 2.6s cubic-bezier(.4,.1,.2,1) forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake .45s cubic-bezier(.36,.07,.19,.97); }

        @keyframes pulseSoft { 50% { opacity: .82; } }
        .animate-pulse-soft { animation: pulseSoft 1.4s ease-in-out infinite; }

        @keyframes stampIn {
          from { opacity: 0; transform: rotate(-18deg) scale(.6); }
          to   { opacity: 1; transform: rotate(-8deg)  scale(1); }
        }
        .stamp {
          opacity: 0;
          transform: rotate(-8deg);
          animation: stampIn .55s cubic-bezier(.34,1.56,.64,1) .9s forwards;
        }
      `}</style>
    </div>
  )
}
