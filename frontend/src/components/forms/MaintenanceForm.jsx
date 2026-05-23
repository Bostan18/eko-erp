import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

export default function MaintenanceForm({ engin, onSuccess, onClose }) {
  const [form, setForm] = useState({
    type_maintenance: 'preventive',
    date_intervention: new Date().toISOString().slice(0, 10),
    heures_compteur_intervention: engin.heures_compteur || '0',
    description: '',
    prochaine_revision_heures: '',
    cout: '0',
    effectue_par: '',
    notes: '',
  })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.description.trim()) { setError('Décrivez l\'intervention.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/parc/maintenances/', {
        ...form,
        engin: engin.id,
        prochaine_revision_heures: form.prochaine_revision_heures || null,
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
          <div className="alert-red mb-5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>
        )}
        <FormSection titre="Intervention">
          <FormRow cols={2}>
            <Field label="Type">
              <select className="input" value={form.type_maintenance} onChange={(e) => set('type_maintenance', e.target.value)}>
                <option value="preventive">Préventive</option>
                <option value="corrective">Corrective</option>
                <option value="revision">Révision périodique</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={form.date_intervention}
                onChange={(e) => set('date_intervention', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Description" required>
            <input className="input" placeholder="Remplacement filtres, vidange, réparation…"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <FormRow cols={3}>
            <Field label="Compteur (h)">
              <input type="number" step="0.1" min="0" className="input"
                value={form.heures_compteur_intervention} onChange={(e) => set('heures_compteur_intervention', e.target.value)} />
            </Field>
            <Field label="Prochaine révision (h)" hint="met à jour le seuil engin">
              <input type="number" step="1" min="0" className="input"
                value={form.prochaine_revision_heures} onChange={(e) => set('prochaine_revision_heures', e.target.value)} />
            </Field>
            <Field label="Coût (F)">
              <input type="number" step="1" min="0" className="input"
                value={form.cout} onChange={(e) => set('cout', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Effectué par">
            <input className="input" placeholder="Atelier interne / prestataire…"
              value={form.effectue_par} onChange={(e) => set('effectue_par', e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
