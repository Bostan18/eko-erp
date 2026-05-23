import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  nom: '', type_engin: 'pelleteuse', marque: '', modele: '',
  immatriculation: '', numero_serie: '', annee_mise_service: '',
  heures_compteur: '0', heures_revision: '500', duree_vie_estimee_h: '10000',
  prix_achat: '0', tarif_location_jour: '0',
  statut: 'disponible', site_actuel: '', notes: '',
}

export default function EnginForm({ initial, onSuccess, onClose }) {
  const [form, setForm]   = useState({ ...INIT, ...(initial || {}) })
  const [sites, setSites] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEdit = !!initial?.id

  useEffect(() => {
    api.get('/operations/sites/?actif=true').then(({ data }) => setSites(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom de l\'engin est requis.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        site_actuel: form.site_actuel || null,
        annee_mise_service: form.annee_mise_service || null,
      }
      if (isEdit) {
        await api.patch(`/parc/engins/${initial.id}/`, payload)
      } else {
        await api.post('/parc/engins/', payload)
      }
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
          <Field label="Nom / désignation" required>
            <input className="input" placeholder="Pelleteuse Cat 320, Bétonnière 350L…"
              value={form.nom} onChange={(e) => set('nom', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Type d'engin">
              <select className="input" value={form.type_engin} onChange={(e) => set('type_engin', e.target.value)}>
                <option value="pelleteuse">Pelleteuse</option>
                <option value="compacteur">Compacteur</option>
                <option value="tractopelle">Tractopelle</option>
                <option value="chargeuse">Chargeuse</option>
                <option value="niveleuse">Niveleuse</option>
                <option value="camion_benne">Camion benne</option>
                <option value="betonniere">Bétonnière</option>
                <option value="tracteur">Tracteur</option>
                <option value="groupe_electro">Groupe électrogène</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="disponible">Disponible</option>
                <option value="en_chantier">En chantier</option>
                <option value="en_location">En location</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Marque">
              <input className="input" value={form.marque} onChange={(e) => set('marque', e.target.value)} />
            </Field>
            <Field label="Modèle">
              <input className="input" value={form.modele} onChange={(e) => set('modele', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={3}>
            <Field label="Immatriculation">
              <input className="input mono-cell" value={form.immatriculation} onChange={(e) => set('immatriculation', e.target.value)} />
            </Field>
            <Field label="N° série">
              <input className="input mono-cell" value={form.numero_serie} onChange={(e) => set('numero_serie', e.target.value)} />
            </Field>
            <Field label="Année mise en service">
              <input type="number" min="1980" max="2100" className="input"
                value={form.annee_mise_service} onChange={(e) => set('annee_mise_service', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Compteur & maintenance">
          <FormRow cols={3}>
            <Field label="Heures compteur">
              <input type="number" step="0.1" min="0" className="input"
                value={form.heures_compteur} onChange={(e) => set('heures_compteur', e.target.value)} />
            </Field>
            <Field label="Seuil prochaine révision (h)">
              <input type="number" step="1" min="0" className="input"
                value={form.heures_revision} onChange={(e) => set('heures_revision', e.target.value)} />
            </Field>
            <Field label="Durée de vie estimée (h)">
              <input type="number" step="100" min="0" className="input"
                value={form.duree_vie_estimee_h} onChange={(e) => set('duree_vie_estimee_h', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Financier & affectation">
          <FormRow cols={2}>
            <Field label="Prix d'achat (F)">
              <input type="number" step="1" min="0" className="input"
                value={form.prix_achat} onChange={(e) => set('prix_achat', e.target.value)} />
            </Field>
            <Field label="Tarif location / jour (F)">
              <input type="number" step="1" min="0" className="input"
                value={form.tarif_location_jour} onChange={(e) => set('tarif_location_jour', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Site actuel">
            <select className="input" value={form.site_actuel} onChange={(e) => set('site_actuel', e.target.value)}>
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
          {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour' : 'Créer l\'engin')}
        </button>
      </div>
    </form>
  )
}
