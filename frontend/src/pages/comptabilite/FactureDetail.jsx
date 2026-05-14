import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'

function exportFile(url, filename) {
  api.get(url, { responseType: 'blob' }).then(({ data }) => {
    const href = URL.createObjectURL(data)
    Object.assign(document.createElement('a'), { href, download: filename }).click()
    URL.revokeObjectURL(href)
  })
}

function fmt(n) { return Number(n).toLocaleString('fr-FR') }
function today() { return new Date().toISOString().slice(0, 10) }

const STATUT_BADGE = {
  brouillon: 'badge-gray', envoyee: 'badge-blue',
  partiellement_payee: 'badge-yellow', payee: 'badge-green',
  en_retard: 'badge-red', annulee: 'badge-gray',
}

const STATUT_LABEL = {
  brouillon: 'Brouillon', envoyee: 'Envoyée', partiellement_payee: 'Partiellement payée',
  payee: 'Payée', en_retard: 'En retard', annulee: 'Annulée',
}

export default function FactureDetail() {
  const { id } = useParams()
  const [facture, setFacture]     = useState(null)
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showPaie, setShowPaie]   = useState(false)
  const [paie, setPaie]           = useState({ montant: '', mode: 'virement', reference: '', date: today() })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function charger() {
    Promise.all([
      api.get(`/comptabilite/factures/${id}/`),
      api.get(`/comptabilite/paiements/?facture=${id}`),
    ]).then(([{ data: f }, { data: p }]) => {
      setFacture(f)
      setPaiements(p.results ?? p)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [id])

  async function enregistrerPaiement(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/comptabilite/paiements/', { ...paie, facture: id })
      setShowPaie(false)
      setPaie({ montant: '', mode: 'virement', reference: '', date: today() })
      charger()
    } catch {
      setError('Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>
  if (!facture) return <div className="p-12 text-center text-red-500 font-body">Facture introuvable.</div>

  const progression = facture.montant_ttc > 0
    ? Math.min(100, (Number(facture.montant_paye) / Number(facture.montant_ttc)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-body text-[#A59F9B]">
        <Link to="/comptabilite/factures" className="hover:text-forest-700 transition-colors">Factures</Link>
        <span>/</span>
        <span className="text-[#1C1817]">{facture.numero}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display font-bold text-[#1C1817] text-xl">{facture.numero}</h1>
            <span className={STATUT_BADGE[facture.statut] ?? 'badge-gray'}>{STATUT_LABEL[facture.statut]}</span>
          </div>
          <p className="font-body text-[#1C1817]">{facture.client_nom}</p>
          {facture.projet_nom && <p className="font-body text-[#A59F9B] text-sm">{facture.projet_nom}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {facture.statut !== 'payee' && (
            <button className="btn-primary" onClick={() => setShowPaie(true)}>+ Enregistrer paiement</button>
          )}
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/export_excel/`, `facture_${facture.numero}.xlsx`)}>
            ↓ Excel
          </button>
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/export_pdf/`, `facture_${facture.numero}.pdf`)}>
            ↓ PDF
          </button>
          <Link to="/comptabilite/factures" className="btn-secondary">← Retour</Link>
        </div>
      </div>

      {/* Montants + progression */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-1">Montant TTC</p>
          <p className="font-display font-bold text-[#1C1817] text-2xl">{fmt(facture.montant_ttc)} F</p>
          <p className="font-body text-xs text-[#A59F9B] mt-1">HT : {fmt(facture.montant_ht)} F · TVA : {fmt(facture.montant_tva)} F</p>
        </div>
        <div className="card p-5 bg-forest-50 border-forest-100">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Payé</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{fmt(facture.montant_paye)} F</p>
          <div className="mt-2 bg-forest-200 rounded-full h-1.5">
            <div className="bg-forest-600 h-1.5 rounded-full transition-all" style={{ width: `${progression}%` }} />
          </div>
        </div>
        <div className={`card p-5 ${Number(facture.solde_restant) > 0 ? 'bg-amber-50 border-amber-100' : 'border-[#ece2d3]'}`}>
          <p className={`font-display text-xs uppercase tracking-wide mb-1 ${Number(facture.solde_restant) > 0 ? 'text-amber-600' : 'text-[#A59F9B]'}`}>
            Solde restant
          </p>
          <p className={`font-display font-bold text-2xl ${Number(facture.solde_restant) > 0 ? 'text-amber-700' : 'text-[#A59F9B]'}`}>
            {fmt(facture.solde_restant)} F
          </p>
          <p className="font-body text-xs text-[#A59F9B] mt-1">Échéance : {facture.date_echeance}</p>
        </div>
      </div>

      {/* Formulaire paiement inline */}
      {showPaie && (
        <div className="card p-5 border-forest-200 bg-forest-50">
          <p className="font-display font-semibold text-forest-800 mb-4">Enregistrer un paiement</p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={enregistrerPaiement} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Montant (F) *</label>
              <input type="number" className="input" placeholder={fmt(facture.solde_restant)}
                value={paie.montant} onChange={(e) => setPaie({ ...paie, montant: e.target.value })} required />
            </div>
            <div>
              <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Mode *</label>
              <select className="input" value={paie.mode} onChange={(e) => setPaie({ ...paie, mode: e.target.value })}>
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="mobile">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date *</label>
              <input type="date" className="input" value={paie.date} onChange={(e) => setPaie({ ...paie, date: e.target.value })} required />
            </div>
            <div>
              <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Référence</label>
              <input className="input" placeholder="N° virement…" value={paie.reference}
                onChange={(e) => setPaie({ ...paie, reference: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowPaie(false)}>Annuler</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Valider le paiement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lignes de facturation */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ece2d3]">
          <p className="font-display font-semibold text-[#1C1817] text-sm">Lignes ({facture.lignes?.length ?? 0})</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#fbf7f0]">
            <tr>
              {['Désignation', 'Qté', 'Prix unit.', 'Montant HT'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4ebe0]">
            {(facture.lignes ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[#A59F9B] font-body text-sm">Aucune ligne</td></tr>
            ) : (facture.lignes ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-[#fbf7f0]">
                <td className="px-4 py-3 font-body text-[#1C1817]">{l.designation}</td>
                <td className="px-4 py-3 font-body text-[#A59F9B]">{l.quantite}</td>
                <td className="px-4 py-3 font-body text-[#1C1817]">{fmt(l.prix_unitaire)} F</td>
                <td className="px-4 py-3 font-display font-semibold text-[#1C1817]">{fmt(l.montant_ht)} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historique paiements */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ece2d3]">
          <p className="font-display font-semibold text-[#1C1817] text-sm">Paiements reçus ({paiements.length})</p>
        </div>
        {paiements.length === 0 ? (
          <p className="px-4 py-6 text-center text-[#A59F9B] font-body text-sm">Aucun paiement enregistré</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0]">
              <tr>
                {['Date', 'Montant', 'Mode', 'Référence'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {paiements.map((p) => (
                <tr key={p.id} className="hover:bg-[#fbf7f0]">
                  <td className="px-4 py-3 font-body text-[#1C1817]">{p.date}</td>
                  <td className="px-4 py-3 font-display font-semibold text-forest-700">{fmt(p.montant)} F</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] capitalize">{p.mode}</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
