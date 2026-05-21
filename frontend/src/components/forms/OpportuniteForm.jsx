import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { fmt } from '../../utils/format'
import { FormSection, FormRow, Field } from '../ui/Modal'

const PROBA_DEFAUT = {
  prospection: 10, qualification: 30, proposition: 50,
  negociation: 70, gagnee: 100, perdue: 0,
}

export default function OpportuniteForm({ onSuccess, onClose, phaseInitiale = 'prospection' }) {
  const [form, setForm]       = useState({
    titre: '', client: '', phase: phaseInitiale, probabilite: PROBA_DEFAUT[phaseInitiale],
    valeur_estimee: '', centre_cout: '', date_cloture_prevue: '', notes: '',
  })
  const [clients, setClients] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/').then(({ data }) => setClients(data.results ?? data))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function setPhase(phase) {
    setForm((f) => ({ ...f, phase, probabilite: PROBA_DEFAUT[phase] ?? f.probabilite }))
  }

  const ponderee = Number(form.valeur_estimee || 0) * Number(form.probabilite || 0) / 100

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titre.trim()) { setError('Le titre est requis.'); return }
    if (!form.client) { setError('Sélectionnez un client.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/crm/opportunites/', {
        ...form,
        valeur_estimee: form.valeur_estimee || 0,
        centre_cout: form.centre_cout || null,
        date_cloture_prevue: form.date_cloture_prevue || null,
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
        <FormSection titre="Opportunité">
          <Field label="Titre" required>
            <input className="input" placeholder="Chantier route régionale" value={form.titre}
              onChange={(e) => set('titre', e.target.value)} />
          </Field>
          <Field label="Client" required>
            <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
              <option value="">— Choisir —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <FormRow cols={2}>
            <Field label="Phase">
              <select className="input" value={form.phase} onChange={(e) => setPhase(e.target.value)}>
                <option value="prospection">Prospection</option>
                <option value="qualification">Qualification</option>
                <option value="proposition">Proposition</option>
                <option value="negociation">Négociation</option>
                <option value="gagnee">Gagnée</option>
                <option value="perdue">Perdue</option>
              </select>
            </Field>
            <Field label="Probabilité (%)">
              <input type="number" min="0" max="100" className="input" value={form.probabilite}
                onChange={(e) => set('probabilite', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Valeur estimée (F)">
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.valeur_estimee}
                onChange={(e) => set('valeur_estimee', e.target.value)} />
            </Field>
            <Field label="Activité / centre">
              <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
                <option value="">— Aucun —</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Clôture prévue">
            <input type="date" className="input" value={form.date_cloture_prevue}
              onChange={(e) => set('date_cloture_prevue', e.target.value)} />
          </Field>
          <div className="rounded-lg bg-forest-50 border border-forest-100 px-4 py-2.5 text-[12.5px] text-forest-800 flex justify-between">
            <span>Valeur pondérée</span>
            <span className="font-mono font-semibold">{fmt(ponderee)} F</span>
          </div>
        </FormSection>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : "Créer l'opportunité"}
        </button>
      </div>
    </form>
  )
}
