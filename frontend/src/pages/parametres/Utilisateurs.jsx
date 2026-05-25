import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import Modal, { ModalFooter, FormSection, FormRow, Field } from '../../components/ui/Modal'
import ModuleTabs, { PARAMETRES_TABS } from '../../components/ui/ModuleTabs'
import Badge from '../../components/ui/Badge'
import EmptyState, { IconEmptyClipboard } from '../../components/ui/EmptyState'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { IconUsers, IconShield } from '../../components/ui/Icons'

/* Tons de badge par rôle — repris des couleurs sémantiques de la palette EKO. */
const ROLE_TONE = {
  ADMIN:         'red',
  DIRECTION:     'ink',
  COMPTABLE:     'blue',
  RH:            'gold',
  CHEF_CHANTIER: 'green',
  LECTURE:       'gray',
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

function formatDate(iso) {
  if (!iso) return '—'
  try { return DATE_FMT.format(new Date(iso)) } catch { return '—' }
}

export default function Utilisateurs() {
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers]     = useState([])
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [editing, setEditing] = useState(null)     // null | 'new' | userObj
  const [credential, setCredential] = useState(null) // {username, temp_password} après création/reset
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function chargerUtilisateurs() {
    const { data } = await api.get('/auth/users/')
    setUsers(data.results ?? data ?? [])
  }

  useEffect(() => {
    Promise.all([
      api.get('/auth/users/').then(({ data }) => setUsers(data.results ?? data ?? [])),
      api.get('/auth/roles/').then(({ data }) => setRoles(data)),
    ]).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role_display || '').toLowerCase().includes(q)
    )
  }, [users, search])

  async function reset(user) {
    const { data } = await api.post(`/auth/users/${user.id}/reset_password/`)
    setCredential({ ...data, mode: 'reset' })
  }

  async function desactiver(user) {
    await api.delete(`/auth/users/${user.id}/`)
    setConfirmDelete(null)
    chargerUtilisateurs()
  }

  if (loading) return <SkeletonPage />

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Utilisateurs &amp; accès</div>
          <div className="sec-sub">
            Gestion des comptes, rôles et permissions par module
          </div>
        </div>
        <div className="sec-actions">
          <button onClick={() => setEditing('new')} className="btn-primary btn-sm">
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      <ModuleTabs items={PARAMETRES_TABS} />

      {/* ─── Liste ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="th-title">
            Comptes ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <input
            type="search"
            placeholder="Rechercher (nom, email, rôle)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-[260px] px-3 py-1.5 text-[12.5px] border border-sand-200 rounded-md
                       focus:outline-none focus:border-forest-500 transition-colors"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconEmptyClipboard />}
            titre={search ? 'Aucun résultat' : 'Aucun utilisateur'}
            sub={search
              ? 'Essayez un autre terme de recherche.'
              : 'Créez le premier compte pour démarrer.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-eko">
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Dernière connexion</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-display font-medium text-ink">{u.username}</div>
                      {(u.first_name || u.last_name) && (
                        <div className="text-[11px] text-sand-500">
                          {[u.first_name, u.last_name].filter(Boolean).join(' ')}
                        </div>
                      )}
                    </td>
                    <td className="mono-cell">{u.email || '—'}</td>
                    <td>
                      <Badge tone={ROLE_TONE[u.role] ?? 'gray'}>{u.role_display}</Badge>
                    </td>
                    <td>
                      {u.is_active
                        ? <Badge tone="green" dot>Actif</Badge>
                        : <Badge tone="gray">Désactivé</Badge>}
                    </td>
                    <td className="mono-cell">{formatDate(u.last_login)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditing(u)}
                        className="text-[12px] text-forest-700 hover:text-forest-900 font-display font-medium"
                      >
                        Éditer
                      </button>
                      <span className="text-sand-300 mx-2">·</span>
                      <button
                        onClick={() => reset(u)}
                        className="text-[12px] text-gold-700 hover:text-gold-900 font-display font-medium"
                      >
                        Reset MDP
                      </button>
                      {u.is_active && u.id !== currentUser?.id && (
                        <>
                          <span className="text-sand-300 mx-2">·</span>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            className="text-[12px] text-red-600 hover:text-red-800 font-display font-medium"
                          >
                            Désactiver
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Note pédagogique sur les rôles ────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <IconShield className="w-4 h-4 text-forest-600" />
          <div className="sec-title text-[14px]">À propos des rôles</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] text-sand-700">
          <p><Badge tone="red">Administrateur</Badge> — Accès complet + gestion utilisateurs</p>
          <p><Badge tone="ink">Direction</Badge> — Lecture sur tous les modules</p>
          <p><Badge tone="blue">Comptable</Badge> — Compta, achats, CRM, reporting</p>
          <p><Badge tone="gold">RH</Badge> — Employés, paie, congés, documents</p>
          <p><Badge tone="green">Chef de chantier</Badge> — Projets, opérations, parc, stocks</p>
          <p><Badge tone="gray">Lecture seule</Badge> — Tableau de bord uniquement</p>
        </div>
      </div>

      {/* ─── Drawer création / édition ──────────────────── */}
      {editing && (
        <UserFormDrawer
          user={editing === 'new' ? null : editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={(payload) => {
            setEditing(null)
            chargerUtilisateurs()
            if (payload?.temp_password) {
              setCredential({ ...payload, mode: 'create' })
            }
          }}
        />
      )}

      {/* ─── Modal de credential temporaire ─────────────── */}
      {credential && (
        <CredentialModal
          credential={credential}
          onClose={() => setCredential(null)}
        />
      )}

      {/* ─── Modal confirmation désactivation ───────────── */}
      {confirmDelete && (
        <ConfirmModal
          titre="Désactiver ce compte ?"
          message={`L'utilisateur "${confirmDelete.username}" ne pourra plus se connecter. Ses données historiques sont préservées.`}
          confirmLabel="Désactiver"
          onConfirm={() => desactiver(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */

function UserFormDrawer({ user, roles, onClose, onSaved }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    username:   user?.username   ?? '',
    email:      user?.email      ?? '',
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name  ?? '',
    role:       user?.role       ?? 'LECTURE',
    is_active:  user?.is_active  ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        const { data } = await api.patch(`/auth/users/${user.id}/`, {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          is_active: form.is_active,
        })
        onSaved(data)
      } else {
        const { data } = await api.post('/auth/users/', form)
        onSaved(data)
      }
    } catch (err) {
      const detail = err.response?.data
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      titre={isEdit ? `Éditer · ${user.username}` : 'Nouvel utilisateur'}
      sousTitre={isEdit ? 'Rôle, email, activation' : 'Un mot de passe temporaire sera généré'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <FormSection titre="Identité">
          <FormRow cols={1}>
            <Field label="Nom d'utilisateur" required hint={isEdit ? "Non modifiable" : "Sera utilisé pour se connecter"}>
              <input
                type="text"
                className="input"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                disabled={isEdit}
                required
                autoComplete="off"
              />
            </Field>
          </FormRow>
          <FormRow cols={1}>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Prénom">
              <input
                type="text"
                className="input"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
              />
            </Field>
            <Field label="Nom">
              <input
                type="text"
                className="input"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
              />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Accès">
          <FormRow cols={1}>
            <Field label="Rôle" required hint="Détermine les modules accessibles">
              <select
                className="input"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
          </FormRow>
          {isEdit && (
            <FormRow cols={1}>
              <label className="flex items-center gap-2 text-[12.5px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set('is_active', e.target.checked)}
                  className="w-4 h-4 accent-forest-600"
                />
                Compte actif (peut se connecter)
              </label>
            </FormRow>
          )}
        </FormSection>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
            {error}
          </div>
        )}

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="btn-primary btn-sm">
            {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer le compte')}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────── */

function CredentialModal({ credential, onClose }) {
  const [copied, setCopied] = useState(false)

  async function copier() {
    try {
      await navigator.clipboard.writeText(credential.temp_password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard refusé : on laisse l'utilisateur sélectionner à la main
    }
  }

  const titre = credential.mode === 'create'
    ? 'Compte créé · mot de passe temporaire'
    : 'Mot de passe réinitialisé'

  return (
    <Modal
      titre={titre}
      sousTitre="À transmettre à l'utilisateur — affiché une seule fois"
      onClose={onClose}
      width={460}
    >
      <div className="space-y-4">
        <div className="px-3 py-2 bg-gold-50 border border-gold-200 rounded text-[12px] text-gold-800">
          <strong>Important :</strong> ce mot de passe n'est pas stocké en clair.
          Notez-le ou copiez-le maintenant. L'utilisateur devra le changer à sa première connexion.
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 mb-1">
            Identifiant
          </div>
          <div className="font-display font-medium text-[14px] text-ink">{credential.username}</div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 mb-1">
            Mot de passe temporaire
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-sand-100 border border-sand-200 rounded font-mono text-[14px] text-ink tracking-[0.08em] select-all">
              {credential.temp_password}
            </code>
            <button
              type="button"
              onClick={copier}
              className="btn-secondary btn-sm shrink-0"
            >
              {copied ? 'Copié ✓' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      <ModalFooter>
        <button type="button" onClick={onClose} className="btn-primary btn-sm">
          J'ai noté le mot de passe
        </button>
      </ModalFooter>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────── */

function ConfirmModal({ titre, message, confirmLabel, onConfirm, onClose }) {
  return (
    <Modal titre={titre} onClose={onClose} width={420}>
      <p className="text-[13px] text-ink leading-relaxed">{message}</p>
      <ModalFooter>
        <button type="button" onClick={onClose} className="btn-secondary btn-sm">
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn-sm bg-red-600 hover:bg-red-700 text-white font-display font-medium px-3.5 py-1.5 rounded transition-colors"
        >
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  )
}
