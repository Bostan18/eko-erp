import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { fmt } from '../../utils/format'
import { ModalFooter } from '../ui/Modal'

const LIGNE_INIT = { designation: '', centre_cout: '', quantite: '1', prix_unitaire: '', remise_pct: '0', taux_tva: '18' }

export default function DevisForm({ initial, onSuccess, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    client:              String(initial?.client ?? ''),
    projet:              String(initial?.projet ?? ''),
    date_validite:       initial?.date_validite ?? '',
    remise_globale_pct:  String(initial?.remise_globale_pct ?? '0'),
    notes:               initial?.notes ?? '',
  })
  const [lignes, setLignes] = useState([{ ...LIGNE_INIT }])
  const [clients, setClients] = useState([])
  const [projets, setProjets] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/crm/clients/').then(({ data }) => setClients(data.results ?? data))
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
    if (isEdit) {
      api.get(`/comptabilite/lignes-devis/?devis=${initial.id}`)
        .then(({ data }) => {
          const items = data.results ?? data
          if (items.length > 0) {
            setLignes(items.map((l) => ({
              designation: l.designation,
              centre_cout: String(l.centre_cout ?? ''),
              quantite: String(l.quantite),
              prix_unitaire: String(l.prix_unitaire),
              remise_pct: String(l.remise_pct ?? 0),
              taux_tva: String(l.taux_tva ?? 18),
            })))
          }
        })
        .catch(() => {})
    }
  }, [isEdit, initial?.id])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function setLigne(idx, field, value) {
    setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }
  function ajouterLigne() { setLignes((prev) => [...prev, { ...LIGNE_INIT }]) }
  function supprimerLigne(idx) { setLignes((prev) => prev.filter((_, i) => i !== idx)) }

  const totals = lignes.reduce((acc, l) => {
    const qte = Number(l.quantite) || 0
    const pu  = Number(l.prix_unitaire) || 0
    const rem = Number(l.remise_pct) || 0
    const tva = Number(l.taux_tva) || 0
    const ht  = qte * pu * (1 - rem / 100)
    const tvaMontant = ht * tva / 100
    acc.ht  += ht
    acc.tva += tvaMontant
    return acc
  }, { ht: 0, tva: 0 })
  const remiseGlobale = totals.ht * (Number(form.remise_globale_pct) || 0) / 100
  const totalHT = totals.ht - remiseGlobale
  const totalTTC = totalHT + totals.tva

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.client) { setError('Sélectionnez un client.'); return }
    if (!isEdit) {
      const lignesValides = lignes.filter((l) => l.designation && l.prix_unitaire)
      if (lignesValides.length === 0) { setError('Ajoutez au moins une ligne avec désignation et prix.'); return }
    }

    setSaving(true)
    try {
      const payload = {
        client: form.client,
        projet: form.projet || null,
        date_validite: form.date_validite || null,
        remise_globale_pct: form.remise_globale_pct || 0,
        notes: form.notes,
      }
      if (isEdit) {
        await api.patch(`/comptabilite/devis/${initial.id}/`, payload)
      } else {
        const { data: devis } = await api.post('/comptabilite/devis/', payload)
        const lignesValides = lignes.filter((l) => l.designation && l.prix_unitaire)
        await Promise.all(
          lignesValides.map((l) => api.post('/comptabilite/lignes-devis/', {
            devis: devis.id,
            designation: l.designation,
            centre_cout: l.centre_cout || null,
            quantite: l.quantite,
            prix_unitaire: l.prix_unitaire,
            remise_pct: l.remise_pct || 0,
            taux_tva: l.taux_tva || 18,
          }))
        )
      }
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
        <div className="p-3 rounded-lg bg-red-50 ring-1 ring-red-200 text-red-700 text-sm font-body">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Client *</label>
          <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)} required>
            <option value="">— Sélectionner —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Projet (optionnel)</label>
          <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
            <option value="">—</option>
            {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Validité jusqu'au</label>
          <input type="date" className="input" value={form.date_validite} onChange={(e) => set('date_validite', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-ink mb-1">Remise globale (%)</label>
          <input type="number" step="0.01" min="0" max="100" className="input"
            value={form.remise_globale_pct} onChange={(e) => set('remise_globale_pct', e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-semibold text-ink text-sm">Lignes du devis</p>
          <button type="button" onClick={ajouterLigne} className="btn-secondary text-xs px-2 py-1">+ Ligne</button>
        </div>
        <div className="space-y-2">
          {lignes.map((l, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input className="input col-span-3" placeholder="Désignation"
                value={l.designation} onChange={(e) => setLigne(idx, 'designation', e.target.value)} />
              <select className="input col-span-2 text-[12px]" title="Activité"
                value={l.centre_cout} onChange={(e) => setLigne(idx, 'centre_cout', e.target.value)}>
                <option value="">Activité…</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <input type="number" step="0.001" className="input col-span-1" placeholder="Qté"
                value={l.quantite} onChange={(e) => setLigne(idx, 'quantite', e.target.value)} />
              <input type="number" step="0.01" className="input col-span-2" placeholder="Prix unit."
                value={l.prix_unitaire} onChange={(e) => setLigne(idx, 'prix_unitaire', e.target.value)} />
              <input type="number" step="0.01" min="0" max="100" className="input col-span-1" placeholder="-%"
                value={l.remise_pct} onChange={(e) => setLigne(idx, 'remise_pct', e.target.value)} />
              <input type="number" step="0.01" className="input col-span-2" placeholder="TVA %"
                value={l.taux_tva} onChange={(e) => setLigne(idx, 'taux_tva', e.target.value)} />
              <button type="button" onClick={() => supprimerLigne(idx)}
                className="col-span-1 text-sand-500 hover:text-red-500 transition-colors text-lg"
                title="Supprimer">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 bg-sand-50">
        <div className="grid grid-cols-3 gap-3 text-sm font-body">
          <div>
            <p className="text-sand-500 text-xs uppercase tracking-wide">Total HT</p>
            <p className="font-display font-semibold text-ink">{fmt(totalHT)} F</p>
          </div>
          <div>
            <p className="text-sand-500 text-xs uppercase tracking-wide">TVA</p>
            <p className="font-display font-semibold text-ink">{fmt(totals.tva)} F</p>
          </div>
          <div>
            <p className="text-sand-500 text-xs uppercase tracking-wide">Total TTC</p>
            <p className="font-display font-bold text-forest-700 text-lg">{fmt(totalTTC)} F</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-ink mb-1">Notes</label>
        <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour' : 'Créer le devis')}
        </button>
      </ModalFooter>
    </form>
  )
}
