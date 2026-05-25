import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  libelle: '', activite: '', type_objectif: 'unite',
  unite_label: '', tarif_reference: '0', actif: true, notes: '',
}

export default function TacheCatalogueForm({ initial, onSuccess, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm]     = useState({
    ...INIT,
    ...(initial || {}),
    activite: String(initial?.activite ?? ''),
  })
  const [centres, setCentres] = useState([])
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.libelle.trim()) { setError('Le libellé est requis.'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, activite: form.activite || null }
      if (isEdit) {
        await api.patch(`/operations/taches-catalogue/${initial.id}/`, payload)
      } else {
        await api.post('/operations/taches-catalogue/', payload)
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
        <FormSection titre="Tâche">
          <Field label="Libellé" required>
            <input className="input" placeholder="Repiquage plant, Bêchage parcelle, Pose carrelage…"
              value={form.libelle} onChange={(e) => set('libelle', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Activité (centre de coût)">
              <select className="input" value={form.activite} onChange={(e) => set('activite', e.target.value)}>
                <option value="">—</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
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

        <FormSection titre="Mesure">
          <FormRow cols={3}>
            <Field label="Type d'objectif">
              <select className="input" value={form.type_objectif} onChange={(e) => set('type_objectif', e.target.value)}>
                <option value="unite">Unité</option>
                <option value="surface">Surface (m²)</option>
                <option value="volume">Volume (m³)</option>
                <option value="lineaire">Linéaire (m)</option>
                <option value="forfait">Forfait</option>
              </select>
            </Field>
            <Field label="Unité affichée">
              <input className="input" placeholder="plants, sacs, m²…"
                value={form.unite_label} onChange={(e) => set('unite_label', e.target.value)} />
            </Field>
            <Field label="Tarif de référence (F)">
              <input type="number" step="0.01" min="0" className="input"
                value={form.tarif_reference} onChange={(e) => set('tarif_reference', e.target.value)} />
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
          {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour' : 'Créer la tâche')}
        </button>
      </ModalFooter>
    </form>
  )
}
