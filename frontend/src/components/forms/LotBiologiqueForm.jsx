import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  article: '', espece: '', site: '',
  date_semis: new Date().toISOString().slice(0, 10),
  date_repiquage: '',
  quantite_initiale: '', quantite_actuelle: '',
  etat_sante: 'bon', notes: '',
}

export default function LotBiologiqueForm({ initial, onSuccess, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm]   = useState({
    ...INIT,
    ...(initial || {}),
    article: String(initial?.article ?? ''),
    site:    String(initial?.site ?? ''),
  })
  const [intrants, setIntrants] = useState([])
  const [sites, setSites]       = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/stocks/articles/?categorie=intrant').then(({ data }) => setIntrants(data.results ?? data)).catch(() => {})
    api.get('/operations/sites/?actif=true').then(({ data }) => setSites(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.article || !form.espece || !form.quantite_initiale) {
      setError('Article, espèce et quantité initiale requis.'); return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        site: form.site || null,
        date_repiquage: form.date_repiquage || null,
        quantite_actuelle: form.quantite_actuelle || form.quantite_initiale,
      }
      if (isEdit) {
        await api.patch(`/stocks/lots-biologiques/${initial.id}/`, payload)
      } else {
        await api.post('/stocks/lots-biologiques/', payload)
      }
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
        <FormSection titre="Lot">
          <FormRow cols={2}>
            <Field label="Article / Intrant" required>
              <select className="input" value={form.article} onChange={(e) => set('article', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {intrants.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.nom}</option>)}
              </select>
            </Field>
            <Field label="Espèce" required>
              <input className="input" placeholder="Anacardier, Hévéa, Tomate…"
                value={form.espece} onChange={(e) => set('espece', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Site (pépinière / parcelle)">
              <select className="input" value={form.site} onChange={(e) => set('site', e.target.value)}>
                <option value="">—</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
              </select>
            </Field>
            <Field label="État sanitaire">
              <select className="input" value={form.etat_sante} onChange={(e) => set('etat_sante', e.target.value)}>
                <option value="excellent">Excellent</option>
                <option value="bon">Bon</option>
                <option value="moyen">Moyen</option>
                <option value="critique">Critique</option>
                <option value="perdu">Perdu</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Cycle & quantités">
          <FormRow cols={2}>
            <Field label="Date de semis" required>
              <input type="date" className="input" value={form.date_semis}
                onChange={(e) => set('date_semis', e.target.value)} />
            </Field>
            <Field label="Date de repiquage" hint="laissez vide si pas encore repiqué">
              <input type="date" className="input" value={form.date_repiquage}
                onChange={(e) => set('date_repiquage', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Quantité initiale" required>
              <input type="number" step="1" min="1" className="input"
                value={form.quantite_initiale} onChange={(e) => set('quantite_initiale', e.target.value)} />
            </Field>
            <Field label="Quantité actuelle" hint="par défaut = initiale">
              <input type="number" step="1" min="0" className="input"
                value={form.quantite_actuelle} onChange={(e) => set('quantite_actuelle', e.target.value)} />
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
          {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour' : 'Créer le lot')}
        </button>
      </ModalFooter>
    </form>
  )
}
