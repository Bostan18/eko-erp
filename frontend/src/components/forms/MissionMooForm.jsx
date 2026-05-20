import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'

const INIT = {
  employe: '',
  projet: '',
  description: '',
  date_debut: new Date().toISOString().slice(0, 10),
  date_fin: new Date().toISOString().slice(0, 10),
  montant_forfaitaire: '',
  notes: '',
}

function validate(form) {
  if (!form.employe) return 'Employé MOO requis.'
  if (!form.description.trim()) return 'Description requise.'
  if (!form.date_debut || !form.date_fin) return 'Dates de début et fin requises.'
  if (form.date_fin < form.date_debut) return 'La date de fin doit être après le début.'
  if (!form.montant_forfaitaire || Number(form.montant_forfaitaire) <= 0) {
    return 'Le montant forfaitaire doit être supérieur à 0.'
  }
  return null
}

export default function MissionMooForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [employes, setEmployes] = useState([])
  const [projets, setProjets]   = useState([])
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/rh/employes/?type_contrat=moo').then(({ data }) => setEmployes(data.results ?? data))
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/rh/missions-moo/', {
        employe: Number(form.employe),
        projet: form.projet ? Number(form.projet) : null,
        description: form.description,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        montant_forfaitaire: form.montant_forfaitaire,
        notes: form.notes,
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

      <div>
        <label className="block font-display text-xs font-medium text-ink mb-1">Employé MOO *</label>
        <select className="input" value={form.employe} onChange={(e) => set('employe', e.target.value)}>
          <option value="">— Choisir un employé MOO —</option>
          {employes.map((e) => (
            <option key={e.id} value={e.id}>{e.code} — {e.nom_complet}</option>
          ))}
        </select>
        {employes.length === 0 && (
          <p className="text-xs text-sand-500 mt-1 italic">Aucun employé de type MOO enregistré.</p>
        )}
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-ink mb-1">Description *</label>
        <input className="input" placeholder="Ex : transport matériaux chantier route Bouaké"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Date début *</label>
          <input className="input" type="date" value={form.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Date fin *</label>
          <input className="input" type="date" value={form.date_fin} onChange={(e) => set('date_fin', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Montant forfaitaire (FCFA) *</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0"
            value={form.montant_forfaitaire} onChange={(e) => set('montant_forfaitaire', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Projet (optionnel)</label>
          <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
            <option value="">— Aucun —</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-ink mb-1">Notes</label>
        <textarea className="input resize-none" rows={2}
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer la mission'}
        </button>
      </div>
    </form>
  )
}
