import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  code: '', nom: '', prenom: '', type_contrat: 'journalier',
  poste: '', telephone: '', statut: 'actif',
  date_entree: '', salaire_mensuel: '', taux_journalier: '',
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : EMP-001).'
  if (!/^[A-Z]+-\d+$/.test(form.code.trim())) return 'Format de code invalide (ex : EMP-001).'
  if (!form.nom.trim()) return 'Le nom est requis.'
  if (!form.prenom.trim()) return 'Le prénom est requis.'
  const isJournalier = ['journalier', 'moo'].includes(form.type_contrat)
  if (isJournalier && form.taux_journalier && Number(form.taux_journalier) <= 0) {
    return 'Le taux journalier doit être supérieur à 0.'
  }
  if (form.type_contrat === 'cdi' && form.salaire_mensuel && Number(form.salaire_mensuel) <= 0) {
    return 'Le salaire mensuel doit être supérieur à 0.'
  }
  return null
}

export default function EmployeForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/rh/employes/', {
        ...form,
        salaire_mensuel: form.salaire_mensuel || null,
        taux_journalier: form.taux_journalier || null,
        date_entree: form.date_entree || null,
      })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const isJournalier = ['journalier', 'moo'].includes(form.type_contrat)

  return (
    <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert-red mb-5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <FormSection titre="Identité">
          <FormRow cols={2}>
            <Field label="Code" required hint="Format : EMP-001">
              <input className="input" placeholder="EMP-001" value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Type contrat" required>
              <select className="input" value={form.type_contrat} onChange={(e) => set('type_contrat', e.target.value)}>
                <option value="cdi">CDI Permanent</option>
                <option value="journalier">Journalier</option>
                <option value="moo">MOO</option>
                <option value="stagiaire">Stagiaire</option>
              </select>
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Nom" required>
              <input className="input" placeholder="KONÉ" value={form.nom}
                onChange={(e) => set('nom', e.target.value)} />
            </Field>
            <Field label="Prénom" required>
              <input className="input" placeholder="Moussa" value={form.prenom}
                onChange={(e) => set('prenom', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Poste et contact">
          <FormRow cols={2}>
            <Field label="Poste">
              <input className="input" placeholder="Maçon, Planteur…" value={form.poste}
                onChange={(e) => set('poste', e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <input className="input" placeholder="07 00 00 00 00" value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date d'entrée">
              <input type="date" className="input" value={form.date_entree}
                onChange={(e) => set('date_entree', e.target.value)} />
            </Field>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="conge">En congé</option>
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Rémunération">
          {isJournalier ? (
            <Field label="Taux journalier (F)" hint="Montant payé par jour de présence">
              <input type="number" min="0" step="100" className="input" placeholder="5000"
                value={form.taux_journalier}
                onChange={(e) => set('taux_journalier', e.target.value)} />
            </Field>
          ) : (
            <Field label="Salaire mensuel (F)" hint="Montant brut payé chaque mois">
              <input type="number" min="0" step="1000" className="input" placeholder="150000"
                value={form.salaire_mensuel}
                onChange={(e) => set('salaire_mensuel', e.target.value)} />
            </Field>
          )}
        </FormSection>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : "Créer l'employé"}
        </button>
      </ModalFooter>
    </form>
  )
}
