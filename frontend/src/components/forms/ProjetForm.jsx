import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  code: '', nom: '', type_projet: 'btp', centre_cout: '', statut: 'planifie',
  client: '', localisation: '', date_debut: '', date_fin_prevue: '',
  budget_estime: '', description: '',
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : PRJ-001).'
  if (!/^[A-Z]+-\d+$/.test(form.code.trim())) return 'Format de code invalide (ex : PRJ-001).'
  if (!form.nom.trim()) return 'Le nom du projet est requis.'
  if (form.budget_estime && Number(form.budget_estime) < 0) return 'Le budget ne peut pas être négatif.'
  if (form.date_debut && form.date_fin_prevue && form.date_fin_prevue < form.date_debut) {
    return 'La date de fin prévue doit être postérieure à la date de début.'
  }
  return null
}

export default function ProjetForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(INIT)
  const [clients, setClients] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/?statut=actif').then(({ data }) => setClients(data.results ?? data))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/projets/projets/', {
        ...form,
        client: form.client || null,
        centre_cout: form.centre_cout || null,
        budget_estime: form.budget_estime || 0,
        date_debut: form.date_debut || null,
        date_fin_prevue: form.date_fin_prevue || null,
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
          <div className="alert-red mb-5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <FormSection titre="Identification">
          <FormRow cols={2}>
            <Field label="Code" required hint="Format : PRJ-001">
              <input className="input" placeholder="PRJ-001" value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Type" required>
              <select className="input" value={form.type_projet} onChange={(e) => set('type_projet', e.target.value)}>
                <option value="btp">BTP</option>
                <option value="agriculture">Agriculture</option>
                <option value="pepiniere">Pépinière</option>
                <option value="location">Location</option>
                <option value="espaces_verts">Espaces verts</option>
              </select>
            </Field>
          </FormRow>
          <Field label="Nom du projet" required>
            <input className="input" placeholder="Construction villa Cocody" value={form.nom}
              onChange={(e) => set('nom', e.target.value)} />
          </Field>
        </FormSection>

        <FormSection titre="Affectation">
          <FormRow cols={2}>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </Field>
            <Field label="Client">
              <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
                <option value="">— Sans client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Localisation">
              <input className="input" placeholder="Cocody, Abidjan" value={form.localisation}
                onChange={(e) => set('localisation', e.target.value)} />
            </Field>
            <Field label="Centre de coût" hint="Ventilation analytique">
              <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
                <option value="">— Aucun —</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Planning & budget">
          <FormRow cols={2}>
            <Field label="Date début">
              <input type="date" className="input" value={form.date_debut}
                onChange={(e) => set('date_debut', e.target.value)} />
            </Field>
            <Field label="Date fin prévue">
              <input type="date" className="input" value={form.date_fin_prevue}
                min={form.date_debut || undefined}
                onChange={(e) => set('date_fin_prevue', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Budget estimé (F)" hint="Estimation initiale, modifiable">
            <input type="number" min="0" step="10000" className="input" placeholder="5000000" value={form.budget_estime}
              onChange={(e) => set('budget_estime', e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea className="input resize-none" rows={2} placeholder="Détails du projet…"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </FormSection>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer le projet'}
        </button>
      </ModalFooter>
    </form>
  )
}
