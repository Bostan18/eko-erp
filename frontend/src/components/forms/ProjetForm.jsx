import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'

const INIT = {
  code: '', nom: '', type_projet: 'btp', statut: 'planifie',
  client: '', localisation: '', date_debut: '', date_fin_prevue: '',
  budget_estime: '', description: '',
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : PRJ-001).'
  if (!/^[A-Z]+-\d+$/.test(form.code.trim())) return 'Format de code invalide (ex : PRJ-001).'
  if (!form.nom.trim()) return 'Le nom du projet est requis.'
  if (form.budget_estime && Number(form.budget_estime) < 0) return 'Le budget ne peut pas être négatif.'
  if (form.date_debut && form.date_fin_prevue && form.date_fin_prevue < form.date_debut) {
    return 'La date de fin prévue doit être postérieure à la date de début.'
  }
  return null
}

export default function ProjetForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(INIT)
  const [clients, setClients] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/?statut=actif').then(({ data }) => setClients(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/projets/projets/', {
        ...form,
        client: form.client || null,
        budget_estime: form.budget_estime || 0,
        date_debut: form.date_debut || null,
        date_fin_prevue: form.date_fin_prevue || null,
      })
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
          <input className="input" placeholder="PRJ-001" value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Type *</label>
          <select className="input" value={form.type_projet} onChange={(e) => set('type_projet', e.target.value)}>
            <option value="btp">BTP</option>
            <option value="agriculture">Agriculture</option>
            <option value="pepiniere">Pépinière</option>
            <option value="location">Location</option>
            <option value="espaces_verts">Espaces verts</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Nom du projet *</label>
        <input className="input" placeholder="Construction villa Cocody" value={form.nom}
          onChange={(e) => set('nom', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Statut</label>
          <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="suspendu">Suspendu</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Client</label>
          <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
            <option value="">— Sans client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Localisation</label>
        <input className="input" placeholder="Cocody, Abidjan" value={form.localisation}
          onChange={(e) => set('localisation', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date début</label>
          <input type="date" className="input" value={form.date_debut}
            onChange={(e) => set('date_debut', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date fin prévue</label>
          <input type="date" className="input" value={form.date_fin_prevue}
            min={form.date_debut || undefined}
            onChange={(e) => set('date_fin_prevue', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Budget estimé (F)</label>
        <input type="number" min="0" step="10000" className="input" placeholder="5000000" value={form.budget_estime}
          onChange={(e) => set('budget_estime', e.target.value)} />
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Description</label>
        <textarea className="input resize-none" rows={2} placeholder="Détails du projet…"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer le projet'}
        </button>
      </div>
    </form>
  )
}
