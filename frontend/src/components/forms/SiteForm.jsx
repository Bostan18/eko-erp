import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  nom: '', type_site: 'chantier', projet: '', responsable: '',
  localisation: '', actif: true, notes: '',
}

export default function SiteForm({ onSuccess, onClose }) {
  const [form, setForm]   = useState(INIT)
  const [projets, setProjets]   = useState([])
  const [employes, setEmployes] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data)).catch(() => {})
    api.get('/rh/employes/').then(({ data }) => setEmployes(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom du site est requis.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/operations/sites/', {
        ...form,
        projet:      form.projet      || null,
        responsable: form.responsable || null,
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
        <FormSection titre="Identification">
          <Field label="Nom du site" required>
            <input className="input" placeholder="Zone A, Parcelle 3, Dépôt Yopougon…"
              value={form.nom} onChange={(e) => set('nom', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Type de site">
              <select className="input" value={form.type_site} onChange={(e) => set('type_site', e.target.value)}>
                <option value="chantier">Chantier BTP</option>
                <option value="parcelle">Parcelle agricole</option>
                <option value="pepiniere">Pépinière</option>
                <option value="espace_vert">Espace vert</option>
                <option value="depot">Dépôt / parc engins</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Statut">
              <select className="input" value={form.actif ? '1' : '0'}
                onChange={(e) => set('actif', e.target.value === '1')}>
                <option value="1">Actif</option>
                <option value="0">Inactif</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Rattachement">
          <FormRow cols={2}>
            <Field label="Projet">
              <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
                <option value="">—</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
              </select>
            </Field>
            <Field label="Responsable">
              <select className="input" value={form.responsable} onChange={(e) => set('responsable', e.target.value)}>
                <option value="">—</option>
                {employes.map((e) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Localisation">
            <input className="input" placeholder="Commune, quartier, point GPS…"
              value={form.localisation} onChange={(e) => set('localisation', e.target.value)} />
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
          {saving ? 'Enregistrement…' : 'Créer le site'}
        </button>
      </div>
    </form>
  )
}
