import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  nom: '', ncc: '', categorie: 'materiaux',
  telephone: '', email: '', localite: '', notes: '',
}

export default function FournisseurForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom du fournisseur est requis.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/achats/fournisseurs/', form)
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
        <FormSection titre="Identification">
          <Field label="Nom / Raison sociale" required>
            <input className="input" placeholder="Ciments de Côte d'Ivoire" value={form.nom}
              onChange={(e) => set('nom', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Catégorie">
              <select className="input" value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
                <option value="materiaux">Matériaux & fournitures</option>
                <option value="materiel">Matériel & équipement</option>
                <option value="sous_traitance">Sous-traitance</option>
                <option value="services">Services</option>
                <option value="transport">Transport & carburant</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="NCC" hint="N° Compte Contribuable">
              <input className="input" placeholder="CI-1234567 X" value={form.ncc}
                onChange={(e) => set('ncc', e.target.value)} />
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
              <input type="email" className="input" placeholder="contact@fournisseur.ci" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Localité">
            <input className="input" placeholder="Abidjan, Bouaké…" value={form.localite}
              onChange={(e) => set('localite', e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer le fournisseur'}
        </button>
      </ModalFooter>
    </form>
  )
}
