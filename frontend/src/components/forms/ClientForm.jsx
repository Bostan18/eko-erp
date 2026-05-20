import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  code: '', nom: '', type_client: 'prospect', secteur: '',
  statut: 'actif', telephone: '', email: '', localite: '', notes: '',
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : CLI-001).'
  if (!/^[A-Z]+-\d+$/.test(form.code.trim())) return 'Format de code invalide (ex : CLI-001).'
  if (!form.nom.trim()) return 'Le nom est requis.'
  if (form.nom.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Adresse email invalide.'
  return null
}

export default function ClientForm({ onSuccess, onClose }) {
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
      await api.post('/crm/clients/', form)
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
          <FormRow cols={2}>
            <Field label="Code" required hint="Format : CLI-001">
              <input className="input" placeholder="CLI-001" value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Type" required>
              <select className="input" value={form.type_client} onChange={(e) => set('type_client', e.target.value)}>
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="partenaire">Partenaire</option>
              </select>
            </Field>
          </FormRow>
          <Field label="Nom / Raison sociale" required>
            <input className="input" placeholder="BOUAKÉ CONSTRUCTIONS SARL" value={form.nom}
              onChange={(e) => set('nom', e.target.value)} />
          </Field>
        </FormSection>

        <FormSection titre="Classification">
          <FormRow cols={2}>
            <Field label="Secteur">
              <select className="input" value={form.secteur} onChange={(e) => set('secteur', e.target.value)}>
                <option value="">— Choisir —</option>
                <option value="agriculture">Agriculture</option>
                <option value="btp">BTP</option>
                <option value="collectivite">Collectivité</option>
                <option value="prive">Privé</option>
              </select>
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="negociation">En négociation</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Contact">
          <FormRow cols={2}>
            <Field label="Téléphone">
              <input className="input" placeholder="07 00 00 00 00" value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className="input" placeholder="contact@societe.ci" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Localité">
            <input className="input" placeholder="Abidjan, Bouaké…" value={form.localite}
              onChange={(e) => set('localite', e.target.value)} />
          </Field>
          <Field label="Notes" hint="Informations internes, contexte commercial, etc.">
            <textarea className="input resize-none" rows={2} placeholder="Informations complémentaires…"
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer le client'}
        </button>
      </div>
    </form>
  )
}
