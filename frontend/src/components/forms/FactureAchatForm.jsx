import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { fmt, today } from '../../utils/format'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  fournisseur: '', reference: '', libelle: '',
  date: today(), date_echeance: '',
  montant_ht: '', taux_tva: '18',
  centre_cout: '', projet: '', statut: 'brouillon', notes: '',
}

export default function FactureAchatForm({ initial, onSuccess, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm]               = useState({
    ...INIT,
    ...(initial || {}),
    fournisseur: String(initial?.fournisseur ?? ''),
    centre_cout: String(initial?.centre_cout ?? ''),
    projet:      String(initial?.projet ?? ''),
  })
  const [fournisseurs, setFournisseurs] = useState([])
  const [centres, setCentres]         = useState([])
  const [projets, setProjets]         = useState([])
  const [error, setError]             = useState('')
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    api.get('/achats/fournisseurs/').then(({ data }) => setFournisseurs(data.results ?? data))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  const ht  = Number(form.montant_ht || 0)
  const tva = ht * Number(form.taux_tva || 0) / 100
  const ttc = ht + tva

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fournisseur) { setError('Sélectionnez un fournisseur.'); return }
    if (!form.libelle.trim()) { setError('Le libellé est requis.'); return }
    if (ht <= 0) { setError('Le montant HT doit être supérieur à 0.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        centre_cout: form.centre_cout || null,
        projet: form.projet || null,
        date_echeance: form.date_echeance || null,
      }
      if (isEdit) {
        await api.patch(`/achats/factures/${initial.id}/`, payload)
      } else {
        await api.post('/achats/factures/', payload)
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

        <FormSection titre="Fournisseur & pièce">
          <FormRow cols={2}>
            <Field label="Fournisseur" required>
              <select className="input" value={form.fournisseur} onChange={(e) => set('fournisseur', e.target.value)}>
                <option value="">— Choisir —</option>
                {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </Field>
            <Field label="N° pièce fournisseur" hint="Référence sur la facture reçue">
              <input className="input" placeholder="F-2026-0099" value={form.reference}
                onChange={(e) => set('reference', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Libellé" required>
            <input className="input" placeholder="Ciment 100 sacs + ferraille" value={form.libelle}
              onChange={(e) => set('libelle', e.target.value)} />
          </Field>
        </FormSection>

        <FormSection titre="Montants & dates">
          <FormRow cols={2}>
            <Field label="Montant HT (F)" required>
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.montant_ht}
                onChange={(e) => set('montant_ht', e.target.value)} />
            </Field>
            <Field label="TVA (%)">
              <input type="number" min="0" max="100" step="0.5" className="input" value={form.taux_tva}
                onChange={(e) => set('taux_tva', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date" required>
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Échéance">
              <input type="date" className="input" value={form.date_echeance} min={form.date || undefined}
                onChange={(e) => set('date_echeance', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Imputation">
          <FormRow cols={2}>
            <Field label="Centre de coût">
              <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
                <option value="">— Aucun —</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
            <Field label="Projet lié">
              <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
                <option value="">— Sans projet —</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <div className="rounded-lg bg-forest-950 px-4 py-3 mt-2">
          <div className="flex justify-between text-[12.5px] text-forest-200 mb-1">
            <span>Montant HT</span><span className="font-mono">{fmt(ht)} F</span>
          </div>
          <div className="flex justify-between text-[12.5px] text-forest-200 mb-1">
            <span>TVA ({form.taux_tva || 0}%)</span><span className="font-mono">{fmt(tva)} F</span>
          </div>
          <div className="flex justify-between font-display font-bold text-white text-[15px] pt-2 mt-1 border-t border-forest-800">
            <span>Total TTC</span><span>{fmt(ttc)} F</span>
          </div>
        </div>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour' : 'Enregistrer la facture')}
        </button>
      </ModalFooter>
    </form>
  )
}
