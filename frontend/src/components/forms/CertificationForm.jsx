import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

export default function CertificationForm({ employeId, onSuccess, onClose }) {
  const [form, setForm] = useState({
    libelle: '', organisme: '', numero: '',
    date_obtention: new Date().toISOString().slice(0, 10),
    date_expiration: '', notes: '',
  })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.libelle.trim()) { setError('Libellé requis.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/rh/certifications/', {
        ...form,
        employe: employeId,
        date_expiration: form.date_expiration || null,
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
        <FormSection titre="Certification">
          <Field label="Libellé" required>
            <input className="input" placeholder="CAP maçon, Permis CACES, Visite médicale…"
              value={form.libelle} onChange={(e) => set('libelle', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Organisme">
              <input className="input" value={form.organisme} onChange={(e) => set('organisme', e.target.value)} />
            </Field>
            <Field label="N° / référence">
              <input className="input mono-cell" value={form.numero} onChange={(e) => set('numero', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date d'obtention">
              <input type="date" className="input" value={form.date_obtention}
                onChange={(e) => set('date_obtention', e.target.value)} />
            </Field>
            <Field label="Date d'expiration" hint="vide = sans expiration">
              <input type="date" className="input" value={form.date_expiration}
                onChange={(e) => set('date_expiration', e.target.value)} />
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
