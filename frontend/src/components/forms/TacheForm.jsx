import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

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
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1">
        {error && (
          <div className="alert-red mb-5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <FormSection titre="Identification">
          <Field label="Nom de la tâche" required>
            <input className="input" placeholder="Coulage fondation" value={form.nom}
              onChange={(e) => set('nom', e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea className="input resize-none" rows={2} placeholder="Détails de la tâche…"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </FormSection>

        <FormSection titre="Objectif & rémunération">
          <FormRow cols={2}>
            <Field label="Type d'objectif" required>
              <select className="input" value={form.type_objectif} onChange={(e) => set('type_objectif', e.target.value)}>
                {Object.entries(TYPE_OBJECTIF_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Unité (libellé)" hint="ex : m², sacs, ml">
              <input className="input" placeholder="m², sacs, ml…" value={form.unite_label}
                onChange={(e) => set('unite_label', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Objectif cible" required>
              <input type="number" min="0.01" step="0.01" className="input" placeholder="50"
                value={form.objectif_cible} onChange={(e) => set('objectif_cible', e.target.value)} />
            </Field>
            <Field label="Tarif unitaire (F)">
              <input type="number" min="0" step="1" className="input" placeholder="10000"
                value={form.tarif_unitaire} onChange={(e) => set('tarif_unitaire', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Bonus objectif (%)" hint="Prime sur dépassement">
              <input type="number" min="0" max="100" step="0.5" className="input" placeholder="0"
                value={form.bonus_objectif_pct} onChange={(e) => set('bonus_objectif_pct', e.target.value)} />
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Planning">
          <FormRow cols={2}>
            <Field label="Date début">
              <input type="date" className="input" value={form.date_debut}
                onChange={(e) => set('date_debut', e.target.value)} />
            </Field>
            <Field label="Date fin prévue">
              <input type="date" className="input" value={form.date_fin_prevue}
                min={form.date_debut || undefined}
                onChange={(e) => set('date_fin_prevue', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer la tâche'}
        </button>
      </div>
    </form>
  )
}
