import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'

const INIT = {
  code: '', nom: '', prenom: '', type_contrat: 'journalier',
  poste: '', telephone: '', statut: 'actif',
  date_entree: '', salaire_mensuel: '', taux_journalier: '',
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : EMP-001).'
  if (!/^[A-Z]+-\d+$/.test(form.code.trim())) return 'Format de code invalide (ex : EMP-001).'
  if (!form.nom.trim()) return 'Le nom est requis.'
  if (!form.prenom.trim()) return 'Le prénom est requis.'
  const isJournalier = ['journalier', 'moo'].includes(form.type_contrat)
  if (isJournalier && form.taux_journalier && Number(form.taux_journalier) <= 0) {
    return 'Le taux journalier doit être supérieur à 0.'
  }
  if (form.type_contrat === 'cdi' && form.salaire_mensuel && Number(form.salaire_mensuel) <= 0) {
    return 'Le salaire mensuel doit être supérieur à 0.'
  }
  return null
}

export default function EmployeForm({ onSuccess, onClose }) {
  const [form, setForm]   = useState(INIT)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/rh/employes/', {
        ...form,
        salaire_mensuel: form.salaire_mensuel || null,
        taux_journalier: form.taux_journalier || null,
        date_entree: form.date_entree || null,
      })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const isJournalier = ['journalier', 'moo'].includes(form.type_contrat)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Code *</label>
          <input className="input" placeholder="EMP-001" value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Type contrat *</label>
          <select className="input" value={form.type_contrat} onChange={(e) => set('type_contrat', e.target.value)}>
            <option value="cdi">CDI Permanent</option>
            <option value="journalier">Journalier</option>
            <option value="moo">MOO</option>
            <option value="stagiaire">Stagiaire</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Nom *</label>
          <input className="input" placeholder="KONÉ" value={form.nom}
            onChange={(e) => set('nom', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Prénom *</label>
          <input className="input" placeholder="Moussa" value={form.prenom}
            onChange={(e) => set('prenom', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Poste</label>
          <input className="input" placeholder="Maçon, Planteur…" value={form.poste}
            onChange={(e) => set('poste', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Téléphone</label>
          <input className="input" placeholder="07 00 00 00 00" value={form.telephone}
            onChange={(e) => set('telephone', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date d'entrée</label>
          <input type="date" className="input" value={form.date_entree}
            onChange={(e) => set('date_entree', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Statut</label>
          <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="conge">En congé</option>
          </select>
        </div>
      </div>

      {isJournalier ? (
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Taux journalier (F)</label>
          <input type="number" min="0" step="100" className="input" placeholder="5000" value={form.taux_journalier}
            onChange={(e) => set('taux_journalier', e.target.value)} />
        </div>
      ) : (
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Salaire mensuel (F)</label>
          <input type="number" min="0" step="1000" className="input" placeholder="150000" value={form.salaire_mensuel}
            onChange={(e) => set('salaire_mensuel', e.target.value)} />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : "Créer l'employé"}
        </button>
      </div>
    </form>
  )
}
