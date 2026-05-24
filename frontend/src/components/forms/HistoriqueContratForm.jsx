import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

export default function HistoriqueContratForm({ employeId, onSuccess, onClose }) {
  const [form, setForm] = useState({
    type_contrat: 'cdi', poste: '',
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin: '', salaire_mensuel: '', taux_journalier: '',
    motif_fin: '', notes: '',
  })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/rh/historique-contrats/', {
        ...form,
        employe: employeId,
        date_fin: form.date_fin || null,
        salaire_mensuel: form.salaire_mensuel || null,
        taux_journalier: form.taux_journalier || null,
      })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert-red mb-5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>
        )}
        <FormSection titre="Contrat">
          <FormRow cols={2}>
            <Field label="Type">
              <select className="input" value={form.type_contrat} onChange={(e) => set('type_contrat', e.target.value)}>
                <option value="cdi">CDI Permanent</option>
                <option value="journalier">Journalier</option>
                <option value="moo">MOO</option>
                <option value="stagiaire">Stagiaire</option>
              </select>
            </Field>
            <Field label="Poste">
              <input className="input" value={form.poste} onChange={(e) => set('poste', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date début" required>
              <input type="date" className="input" value={form.date_debut}
                onChange={(e) => set('date_debut', e.target.value)} />
            </Field>
            <Field label="Date fin" hint="vide = contrat en cours">
              <input type="date" className="input" value={form.date_fin}
                onChange={(e) => set('date_fin', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Salaire mensuel (F)">
              <input type="number" step="1" min="0" className="input"
                value={form.salaire_mensuel} onChange={(e) => set('salaire_mensuel', e.target.value)} />
            </Field>
            <Field label="Taux journalier (F)">
              <input type="number" step="1" min="0" className="input"
                value={form.taux_journalier} onChange={(e) => set('taux_journalier', e.target.value)} />
            </Field>
          </FormRow>
          {form.date_fin && (
            <Field label="Motif de fin">
              <input className="input" placeholder="Démission, licenciement, fin de mission…"
                value={form.motif_fin} onChange={(e) => set('motif_fin', e.target.value)} />
            </Field>
          )}
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Ajouter'}
        </button>
      </ModalFooter>
    </form>
  )
}
