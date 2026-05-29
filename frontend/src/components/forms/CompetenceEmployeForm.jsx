import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

export default function CompetenceEmployeForm({ employeId, onSuccess, onClose }) {
  const [competences, setCompetences] = useState([])
  const [form, setForm] = useState({
    competence: '', niveau: '3',
    date_acquisition: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/rh/competences/?actif=true').then(({ data }) => setCompetences(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.competence) { setError('Sélectionnez une compétence.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/rh/competences-employes/', { ...form, employe: employeId })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const comp = competences.find((c) => String(c.id) === String(form.competence))

  return (
    <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert-red mb-5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>
        )}
        <FormSection titre="Compétence">
          <Field label="Compétence du référentiel" required>
            <select className="input" value={form.competence} onChange={(e) => set('competence', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {competences.map((c) => (
                <option key={c.id} value={c.id}>{c.libelle} ({c.categorie_display})</option>
              ))}
            </select>
          </Field>
          <FormRow cols={2}>
            <Field label={`Niveau${comp ? ` (max ${comp.niveau_max})` : ''}`}>
              <input type="number" min="1" max={comp?.niveau_max ?? 5} className="input"
                value={form.niveau} onChange={(e) => set('niveau', e.target.value)} />
            </Field>
            <Field label="Date d'acquisition">
              <input type="date" className="input" value={form.date_acquisition}
                onChange={(e) => set('date_acquisition', e.target.value)} />
            </Field>
          </FormRow>
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
