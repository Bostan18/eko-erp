import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { today } from '../../utils/format'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  compte: '', date: today(), sens: 'sortie', montant: '',
  categorie: 'achat', libelle: '', mode: 'virement', reference: '',
  facture_achat: '', centre_cout: '',
}

export default function MouvementForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(INIT)
  const [comptes, setComptes] = useState([])
  const [factures, setFactures] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/achats/comptes/?actif=true').then(({ data }) => setComptes(data.results ?? data))
    api.get('/achats/factures/').then(({ data }) => setFactures((data.results ?? data).filter((f) => f.statut !== 'payee' && f.statut !== 'annulee')))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  function choisirFacture(id) {
    const fa = factures.find((f) => String(f.id) === String(id))
    setForm((f) => ({
      ...f,
      facture_achat: id,
      ...(fa ? {
        montant: String(fa.solde_restant),
        libelle: f.libelle || `Règlement ${fa.numero}`,
        centre_cout: fa.centre_cout ? String(fa.centre_cout) : f.centre_cout,
      } : {}),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.compte) { setError('Sélectionnez un compte.'); return }
    if (!form.libelle.trim()) { setError('Le libellé est requis.'); return }
    if (!form.montant || Number(form.montant) <= 0) { setError('Le montant doit être supérieur à 0.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/achats/tresorerie/', {
        ...form,
        facture_achat: form.sens === 'sortie' ? (form.facture_achat || null) : null,
        centre_cout: form.centre_cout || null,
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

        <FormSection titre="Mouvement">
          <FormRow cols={2}>
            <Field label="Sens" required>
              <select className="input" value={form.sens} onChange={(e) => set('sens', e.target.value)}>
                <option value="sortie">Décaissement (sortie)</option>
                <option value="entree">Encaissement (entrée)</option>
              </select>
            </Field>
            <Field label="Compte" required>
              <select className="input" value={form.compte} onChange={(e) => set('compte', e.target.value)}>
                <option value="">— Choisir —</option>
                {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
          </FormRow>

          {form.sens === 'sortie' && (
            <Field label="Régler une facture d'achat" hint="Pré-remplit le montant et l'imputation">
              <select className="input" value={form.facture_achat} onChange={(e) => choisirFacture(e.target.value)}>
                <option value="">— Aucune (décaissement libre) —</option>
                {factures.map((f) => (
                  <option key={f.id} value={f.id}>{f.numero} — {f.fournisseur_nom} · solde {Number(f.solde_restant).toLocaleString('fr-FR')} F</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Libellé" required>
            <input className="input" placeholder="Règlement fournisseur, salaire, encaissement client…" value={form.libelle}
              onChange={(e) => set('libelle', e.target.value)} />
          </Field>

          <FormRow cols={2}>
            <Field label="Montant (F)" required>
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.montant}
                onChange={(e) => set('montant', e.target.value)} />
            </Field>
            <Field label="Date" required>
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Détails">
          <FormRow cols={2}>
            <Field label="Catégorie">
              <select className="input" value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
                <option value="vente">Vente / client</option>
                <option value="achat">Achat / fournisseur</option>
                <option value="salaire">Salaires & paie</option>
                <option value="charge">Charge / frais</option>
                <option value="impot">Impôts & taxes</option>
                <option value="transfert">Transfert interne</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Mode">
              <select className="input" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="mobile">Mobile Money</option>
              </select>
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Référence">
              <input className="input" placeholder="N° chèque, transaction…" value={form.reference}
                onChange={(e) => set('reference', e.target.value)} />
            </Field>
            <Field label="Centre de coût">
              <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
                <option value="">— Aucun —</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
          </FormRow>
        </FormSection>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le mouvement'}
        </button>
      </div>
    </form>
  )
}
