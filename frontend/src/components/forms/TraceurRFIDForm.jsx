import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  tag_uid: '', article: '', site: '',
  quantite: '1', statut: 'en_stock',
  date_pose: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function TraceurRFIDForm({ onSuccess, onClose }) {
  const [form, setForm]   = useState(INIT)
  const [articles, setArticles] = useState([])
  const [sites, setSites]       = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // matériau ou équipement (BTP)
    Promise.all([
      api.get('/stocks/articles/?categorie=materiau'),
      api.get('/stocks/articles/?categorie=equipement'),
    ]).then(([a, b]) => {
      const list = [...(a.data.results ?? a.data), ...(b.data.results ?? b.data)]
      setArticles(list)
    }).catch(() => {})
    api.get('/operations/sites/?actif=true').then(({ data }) => setSites(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tag_uid.trim() || !form.article) {
      setError('Tag RFID et article requis.'); return
    }
    setSaving(true); setError('')
    try {
      await api.post('/stocks/traceurs-rfid/', {
        ...form,
        site: form.site || null,
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
        <FormSection titre="Tag RFID">
          <Field label="UID du tag" required hint="Code unique scanné depuis le lecteur RFID/NFC">
            <input className="input mono-cell" placeholder="04:A1:B2:C3:D4…"
              value={form.tag_uid} onChange={(e) => set('tag_uid', e.target.value)} />
          </Field>
          <Field label="Article (matériau / équipement BTP)" required>
            <select className="input" value={form.article} onChange={(e) => set('article', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {articles.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.nom}</option>)}
            </select>
          </Field>
          <FormRow cols={3}>
            <Field label="Quantité">
              <input type="number" step="0.01" min="0" className="input"
                value={form.quantite} onChange={(e) => set('quantite', e.target.value)} />
            </Field>
            <Field label="Date pose">
              <input type="date" className="input" value={form.date_pose}
                onChange={(e) => set('date_pose', e.target.value)} />
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="en_stock">En stock</option>
                <option value="sorti">Sorti / sur site</option>
                <option value="perdu">Perdu / volé</option>
                <option value="retire">Retiré</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Localisation">
          <Field label="Site actuel">
            <select className="input" value={form.site} onChange={(e) => set('site', e.target.value)}>
              <option value="">—</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
            </select>
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
          {saving ? 'Enregistrement…' : 'Enregistrer le tag'}
        </button>
      </div>
    </form>
  )
}
