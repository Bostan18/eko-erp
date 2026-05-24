import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { today } from '../../utils/format'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  libelle: '', categorie: 'materiel', montant: '',
  date: today(), projet: '', centre_cout: '', fournisseur: '', reference: '', notes: '',
}

function validate(form) {
  if (!form.libelle.trim()) return 'Le libellé est requis.'
  if (form.libelle.trim().length < 2) return 'Le libellé doit contenir au moins 2 caractères.'
  if (!form.montant || Number(form.montant) <= 0) return 'Le montant doit être supérieur à 0.'
  if (!form.date) return 'La date est requise.'
  return null
}

export default function ChargeForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(INIT)
  const [projets, setProjets] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
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
      await api.post('/comptabilite/charges/', {
        ...form, projet: form.projet || null, centre_cout: form.centre_cout || null,
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

        <FormSection titre="Charge">
          <Field label="Libellé" required>
            <input className="input" placeholder="Achat ciment — 50 sacs" value={form.libelle}
              onChange={(e) => set('libelle', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Catégorie" required>
              <select className="input" value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
                <option value="salaire">Salaires & charges sociales</option>
                <option value="materiel">Matériel & équipement</option>
                <option value="carburant">Carburant & transport</option>
                <option value="sous_traitance">Sous-traitance</option>
                <option value="location">Location engins</option>
                <option value="fourniture">Fournitures</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Montant (F)" required>
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.montant}
                onChange={(e) => set('montant', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Affectation">
          <FormRow cols={2}>
            <Field label="Date" required>
              <input type="date" className="input" value={form.date}
                onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Projet lié">
              <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
                <option value="">— Sans projet —</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Centre de coût" hint="Ventilation analytique (optionnel)">
            <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
              <option value="">— Aucun —</option>
              {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <FormRow cols={2}>
            <Field label="Fournisseur">
              <input className="input" placeholder="Société ABC" value={form.fournisseur}
                onChange={(e) => set('fournisseur', e.target.value)} />
            </Field>
            <Field label="Référence" hint="N° bon de livraison, ticket…">
              <input className="input" placeholder="BL-2026-0044" value={form.reference}
                onChange={(e) => set('reference', e.target.value)} />
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
          {saving ? 'Enregistrement…' : 'Enregistrer la charge'}
        </button>
      </ModalFooter>
    </form>
  )
}
