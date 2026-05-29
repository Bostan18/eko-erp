import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

export default function ContratLocationForm({ engin, onSuccess, onClose }) {
  const [form, setForm] = useState({
    mode: 'externe',  // 'externe' = client, 'interne' = projet
    client: '', projet: '',
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin_prevue: '',
    tarif_jour: engin.tarif_location_jour || '0',
    statut: 'planifie',
    notes: '',
  })
  const [clients, setClients] = useState([])
  const [projets, setProjets] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/').then(({ data }) => setClients(data.results ?? data)).catch(() => {})
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data)).catch(() => {})
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.mode === 'externe' && !form.client) { setError('Sélectionnez le client.'); return }
    if (form.mode === 'interne' && !form.projet) { setError('Sélectionnez le projet.'); return }
    if (!form.date_fin_prevue) { setError('Date de fin prévue requise.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/parc/locations/', {
        engin: engin.id,
        client: form.mode === 'externe' ? form.client : null,
        projet: form.mode === 'interne' ? form.projet : null,
        date_debut: form.date_debut,
        date_fin_prevue: form.date_fin_prevue,
        tarif_jour: form.tarif_jour,
        statut: form.statut,
        notes: form.notes,
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
        <FormSection titre="Type">
          <div className="flex gap-2">
            {[
              { v: 'externe', label: 'Location externe (client)' },
              { v: 'interne', label: 'Affectation interne (projet)' },
            ].map(({ v, label }) => (
              <button key={v} type="button" onClick={() => set('mode', v)}
                className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-display font-medium border transition-colors ${
                  form.mode === v
                    ? 'bg-forest-700 text-white border-forest-700'
                    : 'bg-white text-sand-700 border-sand-200 hover:border-forest-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection titre={form.mode === 'externe' ? 'Client' : 'Projet'}>
          {form.mode === 'externe' ? (
            <Field label="Client" required>
              <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Projet" required>
              <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
              </select>
            </Field>
          )}
        </FormSection>

        <FormSection titre="Période & tarif">
          <FormRow cols={2}>
            <Field label="Date début" required>
              <input type="date" className="input" value={form.date_debut}
                onChange={(e) => set('date_debut', e.target.value)} />
            </Field>
            <Field label="Date fin prévue" required>
              <input type="date" className="input" value={form.date_fin_prevue}
                onChange={(e) => set('date_fin_prevue', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Tarif jour (F)">
              <input type="number" step="1" min="0" className="input"
                value={form.tarif_jour} onChange={(e) => set('tarif_jour', e.target.value)} />
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
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
          {saving ? 'Enregistrement…' : 'Créer le contrat'}
        </button>
      </ModalFooter>
    </form>
  )
}
