import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { fmt, today } from '../../utils/format'

const LIGNE_INIT = { designation: '', quantite: '1', prix_unitaire: '' }

function validate(form, lignes) {
  if (!form.numero.trim()) return 'Le numéro de facture est requis.'
  if (!form.client) return 'Veuillez sélectionner un client.'
  if (!form.date_echeance) return "La date d'échéance est requise."
  if (form.date_echeance < form.date_emission) return "La date d'échéance doit être postérieure à la date d'émission."
  const lignesValides = lignes.filter((l) => l.designation && l.prix_unitaire)
  if (lignesValides.length === 0) return 'Ajoutez au moins une ligne de facturation avec désignation et prix.'
  return null
}

export default function FactureForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState({
    numero: '', client: '', projet: '', taux_tva: '18',
    date_emission: today(), date_echeance: '', notes: '',
  })
  const [lignes, setLignes]   = useState([{ ...LIGNE_INIT }])
  const [clients, setClients] = useState([])
  const [projets, setProjets] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/').then(({ data }) => setClients(data.results ?? data))
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  function setLigne(idx, field, value) {
    setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function ajouterLigne() { setLignes((prev) => [...prev, { ...LIGNE_INIT }]) }
  function supprimerLigne(idx) { setLignes((prev) => prev.filter((_, i) => i !== idx)) }

  const montantHT  = lignes.reduce((s, l) => s + (Number(l.quantite) * Number(l.prix_unitaire || 0)), 0)
  const montantTVA = montantHT * Number(form.taux_tva) / 100
  const montantTTC = montantHT + montantTVA

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form, lignes)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      const { data: facture } = await api.post('/comptabilite/factures/', {
        ...form,
        client: form.client || null,
        projet: form.projet || null,
        montant_ht: montantHT,
        montant_tva: montantTVA,
        montant_ttc: montantTTC,
        date_echeance: form.date_echeance || null,
      })
      await Promise.all(
        lignes
          .filter((l) => l.designation && l.prix_unitaire)
          .map((l) => api.post('/comptabilite/lignes/', {
            facture: facture.id,
            designation: l.designation,
            quantite: l.quantite,
            prix_unitaire: l.prix_unitaire,
          }))
      )
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Numéro *</label>
          <input className="input" placeholder="FAC-001" value={form.numero}
            onChange={(e) => set('numero', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">TVA (%)</label>
          <input type="number" min="0" max="100" step="0.5" className="input" value={form.taux_tva}
            onChange={(e) => set('taux_tva', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Client *</label>
        <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
          <option value="">— Choisir un client —</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Projet (optionnel)</label>
        <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
          <option value="">— Sans projet —</option>
          {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date d'émission *</label>
          <input type="date" className="input" value={form.date_emission}
            onChange={(e) => set('date_emission', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date d'échéance *</label>
          <input type="date" className="input" value={form.date_echeance}
            min={form.date_emission || undefined}
            onChange={(e) => set('date_echeance', e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-display text-xs font-medium text-[#1C1817]">Lignes de facturation *</label>
          <button type="button" onClick={ajouterLigne}
            className="text-xs font-display font-medium text-forest-700 hover:text-forest-800">
            + Ajouter une ligne
          </button>
        </div>
        <div className="space-y-2 border border-[#ece2d3] rounded-lg p-3 bg-[#fbf7f0]">
          {lignes.map((ligne, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input className="input flex-1 text-sm py-1.5" placeholder="Désignation"
                value={ligne.designation} onChange={(e) => setLigne(idx, 'designation', e.target.value)} />
              <input type="number" min="0.01" step="0.01" className="input w-16 text-sm py-1.5 text-center" placeholder="Qté"
                value={ligne.quantite} onChange={(e) => setLigne(idx, 'quantite', e.target.value)} />
              <input type="number" min="0" step="1" className="input w-28 text-sm py-1.5" placeholder="Prix unit."
                value={ligne.prix_unitaire} onChange={(e) => setLigne(idx, 'prix_unitaire', e.target.value)} />
              <span className="font-display text-sm font-medium text-[#1C1817] w-24 text-right shrink-0">
                {fmt(Number(ligne.quantite) * Number(ligne.prix_unitaire || 0))} F
              </span>
              {lignes.length > 1 && (
                <button type="button" onClick={() => supprimerLigne(idx)}
                  className="text-[#A59F9B] hover:text-red-400 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-forest-50 rounded-lg p-4 space-y-1.5 text-sm font-body">
        <div className="flex justify-between text-[#1C1817]">
          <span>Montant HT</span><span className="font-medium">{fmt(montantHT)} F</span>
        </div>
        <div className="flex justify-between text-[#1C1817]">
          <span>TVA ({form.taux_tva}%)</span><span className="font-medium">{fmt(montantTVA)} F</span>
        </div>
        <div className="flex justify-between text-forest-800 font-display font-bold border-t border-forest-200 pt-1.5 mt-1.5">
          <span>Total TTC</span><span>{fmt(montantTTC)} F</span>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Notes</label>
        <textarea className="input resize-none" rows={2} value={form.notes}
          onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer la facture'}
        </button>
      </div>
    </form>
  )
}
