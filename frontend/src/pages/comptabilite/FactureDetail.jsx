import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { FACTURE_STATUT_BADGE, FACTURE_STATUT_LABEL, factureEnRetard, TVA_LABEL } from '../../utils/constants'
import { fmt, today } from '../../utils/format'

function exportFile(url, filename) {
  api.get(url, { responseType: 'blob' }).then(({ data }) => {
    const href = URL.createObjectURL(data)
    Object.assign(document.createElement('a'), { href, download: filename }).click()
    URL.revokeObjectURL(href)
  })
}

export default function FactureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [facture, setFacture]     = useState(null)
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showPaie, setShowPaie]   = useState(false)
  const [paie, setPaie]           = useState({ montant: '', mode: 'transfer', reference: '', date: today() })
  const [saving, setSaving]       = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // 'certifier' | 'avoir' | null
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

  useEffect(() => { charger() /* eslint-disable-next-line */ }, [id])

  async function enregistrerPaiement(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/comptabilite/paiements/', { ...paie, facture: id })
      setShowPaie(false)
      setPaie({ montant: '', mode: 'transfer', reference: '', date: today() })
      charger()
    } catch (err) {
      setError(err.response?.data?.detail ?? "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  async function certifier() {
    if (!confirm('Certifier cette facture auprès de la DGI (FNE) ?')) return
    setActionLoading('certifier')
    setError('')
    try {
      const { data } = await api.post(`/comptabilite/factures/${id}/certifier/`)
      setFacture(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Échec de la certification FNE.')
    } finally {
      setActionLoading(null)
    }
  }

  async function emettreAvoir() {
    if (!confirm('Émettre un avoir FNE pour cette facture ?')) return
    setActionLoading('avoir')
    setError('')
    try {
      const { data } = await api.post(`/comptabilite/factures/${id}/avoir/`)
      navigate(`/comptabilite/factures/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail ?? "Échec de l'émission d'avoir.")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>
  if (!facture) return <div className="p-12 text-center text-red-500 font-body">Facture introuvable.</div>

  const enRetard = factureEnRetard(facture)
  const progression = Number(facture.total_ttc) > 0
    ? Math.min(100, (Number(facture.montant_paye) / Number(facture.total_ttc)) * 100)
    : 0

  const peutCertifier = facture.statut === 'brouillon' && (facture.lignes?.length ?? 0) > 0
  const peutEmettreAvoir = facture.statut !== 'annulee' && facture.type_facture !== 'avoir' && !!facture.fne_reference

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-body text-[#A59F9B]">
        <Link to="/comptabilite/factures" className="hover:text-forest-700 transition-colors">Factures</Link>
        <span>/</span>
        <span className="text-[#1C1817]">{facture.numero_local}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-display font-bold text-[#1C1817] text-xl">{facture.numero_local}</h1>
            <span className={FACTURE_STATUT_BADGE[facture.statut] ?? 'badge-gray'}>
              {FACTURE_STATUT_LABEL[facture.statut] ?? facture.statut}
            </span>
            {enRetard && <span className="badge-red">Retard</span>}
            {facture.type_facture === 'avoir' && <span className="badge-yellow">Avoir</span>}
          </div>
          <p className="font-body text-[#1C1817]">{facture.client_nom}</p>
          {facture.projet_nom && <p className="font-body text-[#A59F9B] text-sm">{facture.projet_nom}</p>}
          {facture.fne_reference && (
            <p className="font-mono text-xs text-[#A59F9B] mt-1">FNE : {facture.fne_reference}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {peutCertifier && (
            <button className="btn-primary" onClick={certifier} disabled={actionLoading === 'certifier'}>
              {actionLoading === 'certifier' ? 'Certification…' : 'Certifier FNE'}
            </button>
          )}
          {peutEmettreAvoir && (
            <button className="btn-secondary" onClick={emettreAvoir} disabled={actionLoading === 'avoir'}>
              {actionLoading === 'avoir' ? 'Émission…' : 'Émettre un avoir'}
            </button>
          )}
          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
            <button className="btn-secondary" onClick={() => setShowPaie(true)}>+ Paiement</button>
          )}
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/pdf/`, `${facture.numero_local}.pdf`)}>↓ PDF</button>
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/export_excel/`, `${facture.numero_local}.xlsx`)}>↓ Excel</button>
        </div>
      </div>

      {facture.devis_source && (
        <div className="bg-[#fbf7f0] ring-1 ring-[#ece2d3] rounded-xl px-4 py-2.5 flex items-center gap-2 text-[12.8px] font-body text-[#7a6b54]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] text-[#A59F9B] shrink-0">
            <path d="M6 3h9l4 4v14H6z" />
            <path d="M15 3v4h4" />
            <path d="M9 12h7M9 16h5" />
          </svg>
          <span>Générée depuis le devis</span>
          <Link
            to={`/comptabilite/devis/${facture.devis_source.id}`}
            className="font-medium text-[#5d4f3a] underline hover:no-underline"
          >
            {facture.devis_source.numero}
          </Link>
        </div>
      )}

      {error && (
        <div className="card p-4 bg-red-50 ring-red-200">
          <p className="text-red-700 text-sm font-body">{error}</p>
        </div>
      )}

      {/* Bloc certification FNE */}
      {facture.fne_token && (
        <div className="card p-5 bg-forest-50 ring-forest-200 flex items-start gap-5">
          <FneQrCode token={facture.fne_token} />
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-forest-800 text-sm mb-1">Facture certifiée FNE</p>
            <p className="font-body text-xs text-[#1C1817] mb-0.5">
              Référence DGI : <span className="font-mono">{facture.fne_reference}</span>
            </p>
            {facture.fne_balance_sticker !== null && facture.fne_balance_sticker !== undefined && (
              <p className="font-body text-xs text-[#A59F9B]">Stickers restants : {facture.fne_balance_sticker}</p>
            )}
            {facture.fne_certifiee_at && (
              <p className="font-body text-xs text-[#A59F9B]">Certifiée le {new Date(facture.fne_certifiee_at).toLocaleString('fr-FR')}</p>
            )}
            <a href={facture.fne_token} target="_blank" rel="noreferrer" className="text-xs text-forest-700 hover:underline font-display font-medium mt-2 inline-block">
              Vérifier auprès de la DGI ↗
            </a>
          </div>
        </div>
      )}

      {/* Montants + progression */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-1">Total TTC</p>
          <p className="font-display font-bold text-[#1C1817] text-2xl">{fmt(facture.total_ttc)} F</p>
          <p className="font-body text-xs text-[#A59F9B] mt-1">HT : {fmt(facture.total_ht)} F · TVA : {fmt(facture.total_tva)} F</p>
        </div>
        <div className="card p-5 bg-forest-50 ring-forest-100">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Payé</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{fmt(facture.montant_paye)} F</p>
          <div className="mt-2 bg-forest-200 rounded-full h-1.5">
            <div className="bg-forest-600 h-1.5 rounded-full transition-all" style={{ width: `${progression}%` }} />
          </div>
        </div>
        <div className={`card p-5 ${Number(facture.solde_restant) > 0 ? 'bg-amber-50 ring-amber-100' : ''}`}>
          <p className={`font-display text-xs uppercase tracking-wide mb-1 ${Number(facture.solde_restant) > 0 ? 'text-amber-600' : 'text-[#A59F9B]'}`}>
            Solde restant
          </p>
          <p className={`font-display font-bold text-2xl ${Number(facture.solde_restant) > 0 ? 'text-amber-700' : 'text-[#A59F9B]'}`}>
            {fmt(facture.solde_restant)} F
          </p>
          <p className="font-body text-xs text-[#A59F9B] mt-1">Échéance : {facture.date_echeance ?? '—'}</p>
        </div>
      </div>

      {/* Formulaire paiement inline */}
      {showPaie && (
        <div className="card p-5 ring-forest-200 bg-forest-50">
          <p className="font-display font-semibold text-forest-800 mb-4">Enregistrer un paiement</p>
          <form onSubmit={enregistrerPaiement} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Montant (F) *</label>
              <input type="number" className="input" placeholder={fmt(facture.solde_restant)}
                value={paie.montant} onChange={(e) => setPaie({ ...paie, montant: e.target.value })} required />
            </div>
            <div>
              <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Mode *</label>
              <select className="input" value={paie.mode} onChange={(e) => setPaie({ ...paie, mode: e.target.value })}>
                <option value="cash">Espèces</option>
                <option value="card">Carte</option>
                <option value="check">Chèque</option>
                <option value="mobile-money">Mobile Money</option>
                <option value="transfer">Virement</option>
                <option value="deferred">Différé</option>
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

      {/* Lignes */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ece2d3]">
          <p className="font-display font-semibold text-[#1C1817] text-sm">Lignes ({facture.lignes?.length ?? 0})</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#fbf7f0]">
            <tr>
              {['Désignation', 'Qté', 'Prix unit.', 'Remise', 'TVA', 'Total HT', 'TTC'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4ebe0]">
            {(facture.lignes ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[#A59F9B] font-body text-sm">Aucune ligne</td></tr>
            ) : (facture.lignes ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-[#fbf7f0]">
                <td className="px-4 py-3 font-body text-[#1C1817]">{l.designation}</td>
                <td className="px-4 py-3 font-body text-[#A59F9B]">{l.quantite}</td>
                <td className="px-4 py-3 font-body text-[#1C1817]">{fmt(l.prix_unitaire)} F</td>
                <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{Number(l.remise_pct) > 0 ? `${l.remise_pct}%` : '—'}</td>
                <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{TVA_LABEL[l.taux_tva] ?? l.taux_tva}</td>
                <td className="px-4 py-3 font-display text-[#1C1817]">{fmt(l.total_ht)} F</td>
                <td className="px-4 py-3 font-display font-semibold text-[#1C1817]">{fmt(l.montant_ttc)} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paiements */}
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

function FneQrCode({ token }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${encodeURIComponent(token)}`
  return <img src={src} alt="QR FNE" className="w-[110px] h-[110px] rounded-md ring-1 ring-forest-200 bg-white p-1 shrink-0" />
}
