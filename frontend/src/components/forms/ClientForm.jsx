import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'

const TYPE_LABEL = { client: 'client', prospect: 'prospect', partenaire: 'partenaire' }

function buildInit(typeDefault) {
  return {
    code: '', nom: '', type_client: typeDefault, secteur: '',
    statut: 'actif', telephone: '', email: '', localite: '', notes: '',
  }
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : CLI-001).'
  if (!/^[A-Z]+-\d+$/.test(form.code.trim())) return 'Format de code invalide (ex : CLI-001).'
  if (!form.nom.trim()) return 'Le nom est requis.'
  if (form.nom.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Adresse email invalide.'
  return null
}

export default function ClientForm({ onSuccess, onClose, typeDefault = 'prospect' }) {
  const [form, setForm]     = useState(() => buildInit(typeDefault))
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/crm/clients/', form)
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Code *</label>
          <input className="input" placeholder="CLI-001" value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Type *</label>
          <select className="input" value={form.type_client} onChange={(e) => set('type_client', e.target.value)}>
            <option value="prospect">Prospect</option>
            <option value="client">Client</option>
            <option value="partenaire">Partenaire</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Nom / Raison sociale *</label>
        <input className="input" placeholder="BOUAKÉ CONSTRUCTIONS SARL" value={form.nom}
          onChange={(e) => set('nom', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Secteur</label>
          <select className="input" value={form.secteur} onChange={(e) => set('secteur', e.target.value)}>
            <option value="">— Choisir —</option>
            <option value="agriculture">Agriculture</option>
            <option value="btp">BTP</option>
            <option value="collectivite">Collectivité</option>
            <option value="prive">Privé</option>
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Statut</label>
          <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="negociation">En négociation</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Téléphone</label>
          <input className="input" placeholder="07 00 00 00 00" value={form.telephone}
            onChange={(e) => set('telephone', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Email</label>
          <input type="email" className="input" placeholder="contact@societe.ci" value={form.email}
            onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Localité</label>
        <input className="input" placeholder="Abidjan, Bouaké…" value={form.localite}
          onChange={(e) => set('localite', e.target.value)} />
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Notes</label>
        <textarea className="input resize-none" rows={2} placeholder="Informations complémentaires…"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : `Créer le ${TYPE_LABEL[form.type_client] ?? 'client'}`}
        </button>
      </div>
    </form>
  )
}
