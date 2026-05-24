import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  type_dechet: 'organique', quantite: '', unite: 'kg',
  date: new Date().toISOString().slice(0, 10),
  origine_projet: '', origine_site: '',
  mode_traitement: 'compost', notes: '',
}

export default function DechetForm({ onSuccess, onClose }) {
  const [form, setForm]   = useState(INIT)
  const [projets, setProjets] = useState([])
  const [sites, setSites]     = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data)).catch(() => {})
    api.get('/operations/sites/?actif=true').then(({ data }) => setSites(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.quantite) { setError('La quantité est requise.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/stocks/dechets/', {
        ...form,
        origine_projet: form.origine_projet || null,
        origine_site:   form.origine_site   || null,
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
        <FormSection titre="Déchet">
          <FormRow cols={2}>
            <Field label="Type de déchet">
              <select className="input" value={form.type_dechet} onChange={(e) => set('type_dechet', e.target.value)}>
                <option value="organique">Déchet organique / vert</option>
                <option value="plastique">Plastique / emballage</option>
                <option value="gravats">Béton & gravats</option>
                <option value="metal">Métal / ferraille</option>
                <option value="huile">Huile usée / hydrocarbure</option>
                <option value="bois">Bois & palettes</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Quantité" required>
              <input type="number" step="0.01" min="0" className="input"
                value={form.quantite} onChange={(e) => set('quantite', e.target.value)} />
            </Field>
            <Field label="Unité">
              <select className="input" value={form.unite} onChange={(e) => set('unite', e.target.value)}>
                <option value="kg">Kilogramme</option>
                <option value="tonne">Tonne</option>
                <option value="m3">Mètre cube</option>
                <option value="sac">Sac</option>
                <option value="u">Unité</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Origine & traitement">
          <FormRow cols={2}>
            <Field label="Projet d'origine">
              <select className="input" value={form.origine_projet} onChange={(e) => set('origine_projet', e.target.value)}>
                <option value="">—</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
              </select>
            </Field>
            <Field label="Site d'origine">
              <select className="input" value={form.origine_site} onChange={(e) => set('origine_site', e.target.value)}>
                <option value="">—</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Mode de traitement" hint="compost / recyclage / réutilisation / valorisation = valorisé">
            <select className="input" value={form.mode_traitement} onChange={(e) => set('mode_traitement', e.target.value)}>
              <option value="compost">Compostage</option>
              <option value="recyclage">Recyclage</option>
              <option value="reutilisation">Réutilisation</option>
              <option value="valorisation">Valorisation énergétique</option>
              <option value="decharge">Mise en décharge</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le déchet'}
        </button>
      </ModalFooter>
    </form>
  )
}
