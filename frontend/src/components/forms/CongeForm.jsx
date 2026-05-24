import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  employe: '', type_conge: 'conges_payes',
  date_debut: new Date().toISOString().slice(0, 10),
  date_fin: '', motif: '', notes: '',
}

export default function CongeForm({ employeId, onSuccess, onClose }) {
  const [form, setForm] = useState({ ...INIT, employe: employeId ?? '' })
  const [employes, setEmployes] = useState([])
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!employeId) {
      api.get('/rh/employes/').then(({ data }) => setEmployes(data.results ?? data)).catch(() => {})
    }
  }, [employeId])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.employe || !form.date_fin) {
      setError('Employé, dates de début et fin requis.'); return
    }
    setSaving(true); setError('')
    try {
      await api.post('/rh/conges/', form)
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
        <FormSection titre="Demande">
          {!employeId && (
            <Field label="Employé" required>
              <select className="input" value={form.employe} onChange={(e) => set('employe', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {employes.map((e) => <option key={e.id} value={e.id}>{e.code} — {e.nom_complet}</option>)}
              </select>
            </Field>
          )}
          <FormRow cols={2}>
            <Field label="Type">
              <select className="input" value={form.type_conge} onChange={(e) => set('type_conge', e.target.value)}>
                <option value="conges_payes">Congés payés</option>
                <option value="maladie">Maladie</option>
                <option value="maternite">Maternité / paternité</option>
                <option value="sans_solde">Sans solde</option>
                <option value="special">Spécial</option>
              </select>
            </Field>
            <Field label="Motif">
              <input className="input" placeholder="Visite famille, opération…"
                value={form.motif} onChange={(e) => set('motif', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date début" required>
              <input type="date" className="input" value={form.date_debut}
                onChange={(e) => set('date_debut', e.target.value)} />
            </Field>
            <Field label="Date fin" required>
              <input type="date" className="input" value={form.date_fin}
                onChange={(e) => set('date_fin', e.target.value)} />
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
          {saving ? 'Enregistrement…' : 'Soumettre la demande'}
        </button>
      </ModalFooter>
    </form>
  )
}
