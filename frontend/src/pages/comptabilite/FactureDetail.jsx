import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import Badge from '../../components/ui/Badge'

function exportFile(url, filename) {
  api.get(url, { responseType: 'blob' }).then(({ data }) => {
    const href = URL.createObjectURL(data)
    Object.assign(document.createElement('a'), { href, download: filename }).click()
    URL.revokeObjectURL(href)
  })
}

function fmt(n) { return Number(n).toLocaleString('fr-FR') }
function today() { return new Date().toISOString().slice(0, 10) }

const STATUT_TONE = {
  brouillon: 'gray', envoyee: 'blue', partiellement_payee: 'gold',
  payee: 'green', en_retard: 'red', annulee: 'gray',
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
      setError("Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (!facture) return <div className="p-12 text-center text-red-500 font-body">Facture introuvable.</div>

  const progression = facture.montant_ttc > 0
    ? Math.min(100, (Number(facture.montant_paye) / Number(facture.montant_ttc)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/comptabilite/factures" className="hover:text-forest-700 transition-colors">Factures</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">{facture.numero}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display font-bold text-ink text-xl">{facture.numero}</h1>
            <Badge tone={STATUT_TONE[facture.statut] ?? 'gray'}>
              {STATUT_LABEL[facture.statut] ?? facture.statut}
            </Badge>
          </div>
          <p className="font-display font-medium text-ink text-[15px]">{facture.client_nom}</p>
          {facture.projet_nom && <p className="font-body text-sand-500 text-[12px] mt-0.5">{facture.projet_nom}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {facture.statut !== 'payee' && (
            <button className="btn-primary" onClick={() => setShowPaie(true)}>
              <IconPlus className="w-3.5 h-3.5" /> Paiement
            </button>
          )}
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/export_excel/`, `facture_${facture.numero}.xlsx`)}>
            ⬇ Excel
          </button>
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/export_pdf/`, `facture_${facture.numero}.pdf`)}>
            ⬇ PDF
          </button>
          <Link to="/comptabilite/factures" className="btn-ghost">← Retour</Link>
        </div>
      </div>

      {/* Montants */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi">
          <p className="kpi-label">Montant TTC</p>
          <p className="kpi-value">{fmt(facture.montant_ttc)} <span className="kpi-unit">F</span></p>
          <p className="kpi-sub text-sand-500">HT : {fmt(facture.montant_ht)} · TVA : {fmt(facture.montant_tva)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Payé</p>
          <p className="kpi-value text-forest-700">{fmt(facture.montant_paye)} <span className="kpi-unit">F</span></p>
          <div className="mt-3 bg-sand-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-forest-500 h-full rounded-full transition-all" style={{ width: `${progression}%` }} />
          </div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Solde restant</p>
          <p className={`kpi-value ${Number(facture.solde_restant) > 0 ? 'text-gold-700' : 'text-sand-400'}`}>
            {fmt(facture.solde_restant)} <span className="kpi-unit">F</span>
          </p>
          <p className="kpi-sub text-sand-500">Échéance : {facture.date_echeance}</p>
        </div>
      </div>

      {/* Formulaire paiement inline */}
      {showPaie && (
        <div className="card p-5 border-forest-200 bg-forest-50/40">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-forest-800">Enregistrer un paiement</p>
            <button className="btn-ghost btn-sm" onClick={() => setShowPaie(false)}>Annuler</button>
          </div>
          {error && <p className="alert-red mb-3">{error}</p>}
          <form onSubmit={enregistrerPaiement} className="grid grid-cols-2 gap-3">
            <Field label="Montant (F)" required>
              <input type="number" className="input" placeholder={fmt(facture.solde_restant)}
                value={paie.montant} onChange={(e) => setPaie({ ...paie, montant: e.target.value })} required />
            </Field>
            <Field label="Mode" required>
              <select className="input" value={paie.mode} onChange={(e) => setPaie({ ...paie, mode: e.target.value })}>
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="mobile">Mobile Money</option>
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" className="input" value={paie.date} onChange={(e) => setPaie({ ...paie, date: e.target.value })} required />
            </Field>
            <Field label="Référence">
              <input className="input" placeholder="N° virement…" value={paie.reference}
                onChange={(e) => setPaie({ ...paie, reference: e.target.value })} />
            </Field>
            <div className="col-span-2 flex justify-end mt-1">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Valider le paiement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lignes */}
      <div className="card overflow-hidden">
        <div className="card-head"><p className="card-title">Lignes ({facture.lignes?.length ?? 0})</p></div>
        <table className="table-eko">
          <thead><tr>{['Désignation', 'Qté', 'Prix unit.', 'Montant HT'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {(facture.lignes ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-sand-500 font-body text-sm">Aucune ligne</td></tr>
            ) : facture.lignes.map((l) => (
              <tr key={l.id}>
                <td className="font-display font-medium text-ink">{l.designation}</td>
                <td className="mono-cell">{l.quantite}</td>
                <td className="num">{fmt(l.prix_unitaire)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                <td className="num">{fmt(l.montant_ht)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paiements */}
      <div className="card overflow-hidden">
        <div className="card-head"><p className="card-title">Paiements reçus ({paiements.length})</p></div>
        {paiements.length === 0 ? (
          <p className="px-4 py-6 text-center text-sand-500 font-body text-sm">Aucun paiement enregistré</p>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Date', 'Montant', 'Mode', 'Référence'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {paiements.map((p) => (
                <tr key={p.id}>
                  <td className="mono-cell">{p.date}</td>
                  <td className="num text-forest-700">{fmt(p.montant)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="text-sand-600 capitalize">{p.mode}</td>
                  <td className="mono-cell text-sand-500">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-display font-medium text-ink">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
