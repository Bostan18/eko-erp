import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  nom: '', banque: '', numero_compte: '', type_compte: 'banque',
  solde_initial: '', actif: true,
}

export default function CompteForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom du compte est requis.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/achats/comptes/', { ...form, solde_initial: form.solde_initial || 0 })
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
        <FormSection titre="Compte de trésorerie">
          <FormRow cols={2}>
            <Field label="Nom du compte" required>
              <input className="input" placeholder="Compte courant SGBCI" value={form.nom}
                onChange={(e) => set('nom', e.target.value)} />
            </Field>
            <Field label="Type">
              <select className="input" value={form.type_compte} onChange={(e) => set('type_compte', e.target.value)}>
                <option value="banque">Compte bancaire</option>
                <option value="caisse">Caisse</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Banque / Opérateur">
              <input className="input" placeholder="SGBCI, Orange Money…" value={form.banque}
                onChange={(e) => set('banque', e.target.value)} />
            </Field>
            <Field label="N° de compte">
              <input className="input" placeholder="CI00 0000 0000…" value={form.numero_compte}
                onChange={(e) => set('numero_compte', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Solde initial (F)" hint="Solde de départ à la création du compte">
            <input type="number" step="1" className="input" placeholder="0" value={form.solde_initial}
              onChange={(e) => set('solde_initial', e.target.value)} />
          </Field>
        </FormSection>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer le compte'}
        </button>
      </div>
    </form>
  )
}
