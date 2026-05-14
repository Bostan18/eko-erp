import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { today } from '../../utils/format'

const INIT = {
  libelle: '', categorie: 'materiel', montant: '',
  date: today(), projet: '', fournisseur: '', reference: '', notes: '',
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
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/comptabilite/charges/', { ...form, projet: form.projet || null })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Libellé *</label>
        <input className="input" placeholder="Achat ciment — 50 sacs" value={form.libelle}
          onChange={(e) => set('libelle', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Catégorie *</label>
          <select className="input" value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
            <option value="salaire">Salaires & charges sociales</option>
            <option value="materiel">Matériel & équipement</option>
            <option value="carburant">Carburant & transport</option>
            <option value="sous_traitance">Sous-traitance</option>
            <option value="location">Location engins</option>
            <option value="fourniture">Fournitures</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Montant (F) *</label>
          <input type="number" min="0" step="1" className="input" placeholder="0" value={form.montant}
            onChange={(e) => set('montant', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date *</label>
          <input type="date" className="input" value={form.date}
            onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Projet lié</label>
          <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
            <option value="">— Sans projet —</option>
            {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Fournisseur</label>
          <input className="input" placeholder="Société ABC" value={form.fournisseur}
            onChange={(e) => set('fournisseur', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Référence</label>
          <input className="input" placeholder="N° bon de livraison" value={form.reference}
            onChange={(e) => set('reference', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer la charge'}
        </button>
      </div>
    </form>
  )
}
