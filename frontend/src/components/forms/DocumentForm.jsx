import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  id_doc: '', titre: '', type_doc: 'permis',
  entite_type: 'site', entite_id: '',
  date_emission: '', date_expiration: '',
  fichier_url: '', notes: '',
}

const TYPE_OPTIONS = [
  { v: 'permis',        l: 'Permis de construire / d\'exploiter' },
  { v: 'medical',       l: 'Visite médicale' },
  { v: 'assurance',     l: 'Assurance' },
  { v: 'certification', l: 'Certification' },
  { v: 'env_permit',    l: 'Autorisation environnementale' },
  { v: 'cnps',          l: 'CNPS / DGI' },
  { v: 'contrat',       l: 'Contrat' },
  { v: 'autre',         l: 'Autre' },
]

const ENTITE_OPTIONS = [
  { v: 'site',       l: 'Chantier / Site' },
  { v: 'employe',    l: 'Employé' },
  { v: 'engin',      l: 'Engin / Véhicule' },
  { v: 'projet',     l: 'Projet' },
  { v: 'client',     l: 'Client' },
  { v: 'entreprise', l: "Entreprise (EKO SARL)" },
]

function validate(form) {
  if (!form.titre.trim()) return 'Le titre du document est requis.'
  if (form.titre.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères.'
  if (!form.type_doc) return 'Le type est requis.'
  if (form.date_emission && form.date_expiration && form.date_expiration < form.date_emission) {
    return "La date d'expiration doit être postérieure à la date d'émission."
  }
  if (form.fichier_url && !/^https?:\/\//i.test(form.fichier_url)) {
    return "Le lien du fichier doit commencer par http:// ou https://."
  }
  return null
}

export default function DocumentForm({ onSuccess, onClose }) {
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
      await api.post('/core/documents/', {
        ...form,
        date_emission:   form.date_emission   || null,
        date_expiration: form.date_expiration || null,
        fichier_url:     form.fichier_url     || null,
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

        <FormSection titre="Document">
          <FormRow cols={2}>
            <Field label="Code" hint="Optionnel — auto-généré si vide">
              <input className="input" placeholder="DOC-001" value={form.id_doc}
                onChange={(e) => set('id_doc', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Type" required>
              <select className="input" value={form.type_doc} onChange={(e) => set('type_doc', e.target.value)}>
                {TYPE_OPTIONS.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Titre" required>
            <input className="input" placeholder="Permis de construire — Chantier Cocody"
              value={form.titre} onChange={(e) => set('titre', e.target.value)} />
          </Field>
        </FormSection>

        <FormSection titre="Entité liée">
          <FormRow cols={2}>
            <Field label="Type d'entité">
              <select className="input" value={form.entite_type} onChange={(e) => set('entite_type', e.target.value)}>
                {ENTITE_OPTIONS.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Code de l'entité" hint="ex : SITE-001, EMP-2024-001">
              <input className="input" placeholder="SITE-001"
                value={form.entite_id} onChange={(e) => set('entite_id', e.target.value.toUpperCase())} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Validité">
          <FormRow cols={2}>
            <Field label="Date d'émission">
              <input type="date" className="input" value={form.date_emission}
                onChange={(e) => set('date_emission', e.target.value)} />
            </Field>
            <Field label="Date d'expiration" hint="Déclenche l'alerte 30 j avant">
              <input type="date" className="input" value={form.date_expiration}
                min={form.date_emission || undefined}
                onChange={(e) => set('date_expiration', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Pièce jointe & notes">
          <Field label="Lien du fichier" hint="URL d'un fichier stocké (Drive, S3, etc.)">
            <input type="url" className="input" placeholder="https://drive.google.com/…"
              value={form.fichier_url} onChange={(e) => set('fichier_url', e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} placeholder="Numéro de référence, contexte…"
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le document'}
        </button>
      </div>
    </form>
  )
}
