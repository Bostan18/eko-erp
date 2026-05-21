import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { today } from '../../utils/format'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  client: '', objet: '', type_contrat: 'prestation', montant: '',
  centre_cout: '', date_debut: today(), date_fin: '',
  reconduction_tacite: false, statut: 'brouillon', notes: '',
}

export default function ContratForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(INIT)
  const [clients, setClients] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/').then(({ data }) => setClients(data.results ?? data))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.client) { setError('Sélectionnez un client.'); return }
    if (!form.objet.trim()) { setError("L'objet du contrat est requis."); return }
    setSaving(true); setError('')
    try {
      await api.post('/crm/contrats/', {
        ...form,
        montant: form.montant || 0,
        centre_cout: form.centre_cout || null,
        date_fin: form.date_fin || null,
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
        <FormSection titre="Contrat">
          <Field label="Client" required>
            <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
              <option value="">— Choisir —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Objet" required>
            <input className="input" placeholder="Entretien espaces verts — mairie de Cocody" value={form.objet}
              onChange={(e) => set('objet', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Type">
              <select className="input" value={form.type_contrat} onChange={(e) => set('type_contrat', e.target.value)}>
                <option value="prestation">Prestation de services</option>
                <option value="location">Location</option>
                <option value="maintenance">Maintenance / Entretien</option>
                <option value="cadre">Contrat-cadre</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Montant (F)">
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.montant}
                onChange={(e) => set('montant', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date de début" required>
              <input type="date" className="input" value={form.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
            </Field>
            <Field label="Date de fin">
              <input type="date" className="input" value={form.date_fin} min={form.date_debut || undefined}
                onChange={(e) => set('date_fin', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Centre de coût">
              <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
                <option value="">— Aucun —</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="brouillon">Brouillon</option>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="expire">Expiré</option>
                <option value="resilie">Résilié</option>
              </select>
            </Field>
          </FormRow>
          <label className="flex items-center gap-2 text-[12.5px] text-ink mt-1">
            <input type="checkbox" checked={form.reconduction_tacite}
              onChange={(e) => set('reconduction_tacite', e.target.checked)} />
            Reconduction tacite
          </label>
        </FormSection>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer le contrat'}
        </button>
      </div>
    </form>
  )
}
