import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'

const INIT = {
  nom: '', description: '', type_objectif: 'unite', unite_label: '',
  objectif_cible: '', tarif_unitaire: '', bonus_objectif_pct: '0',
  date_debut: '', date_fin_prevue: '', statut: 'a_faire',
}

function validate(form) {
  if (!form.nom.trim()) return 'Le nom de la tâche est requis.'
  if (Number(form.objectif_cible) <= 0) return "L'objectif cible doit être supérieur à 0."
  if (Number(form.tarif_unitaire) < 0) return 'Le tarif unitaire ne peut pas être négatif.'
  if (form.date_debut && form.date_fin_prevue && form.date_fin_prevue < form.date_debut) {
    return 'La date de fin prévue doit être postérieure à la date de début.'
  }
  return null
}

const TYPE_OBJECTIF_LABELS = {
  surface: 'Surface (m²)', volume: 'Volume (m³)', unite: 'Unité',
  lineaire: 'Linéaire (m)', forfait: 'Forfait',
}

export default function TacheForm({ projetId, onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
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
      await api.post('/projets/taches/', {
        ...form,
        projet: projetId,
        objectif_cible: Number(form.objectif_cible),
        tarif_unitaire: Number(form.tarif_unitaire),
        bonus_objectif_pct: Number(form.bonus_objectif_pct),
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

      <div>
        <label className="block font-display text-xs font-medium text-gray-600 mb-1">Nom de la tâche *</label>
        <input className="input" placeholder="Coulage fondation" value={form.nom}
          onChange={(e) => set('nom', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Type d'objectif *</label>
          <select className="input" value={form.type_objectif} onChange={(e) => set('type_objectif', e.target.value)}>
            {Object.entries(TYPE_OBJECTIF_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Unité (libellé)</label>
          <input className="input" placeholder="m², sacs, ml…" value={form.unite_label}
            onChange={(e) => set('unite_label', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Objectif cible *</label>
          <input type="number" min="0.01" step="0.01" className="input" placeholder="50"
            value={form.objectif_cible} onChange={(e) => set('objectif_cible', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Tarif unitaire (F)</label>
          <input type="number" min="0" step="1" className="input" placeholder="10000"
            value={form.tarif_unitaire} onChange={(e) => set('tarif_unitaire', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Bonus objectif (%)</label>
          <input type="number" min="0" max="100" step="0.5" className="input" placeholder="0"
            value={form.bonus_objectif_pct} onChange={(e) => set('bonus_objectif_pct', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Date début</label>
          <input type="date" className="input" value={form.date_debut}
            onChange={(e) => set('date_debut', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Date fin prévue</label>
          <input type="date" className="input" value={form.date_fin_prevue}
            min={form.date_debut || undefined}
            onChange={(e) => set('date_fin_prevue', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea className="input resize-none" rows={2} placeholder="Détails de la tâche…"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer la tâche'}
        </button>
      </div>
    </form>
  )
}
