import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { DEVIS_STATUT_BADGE, DEVIS_STATUT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

const STATUTS_SUIVANTS = {
  brouillon: [{ value: 'envoye',  label: 'Marquer envoyé' }],
  envoye:    [
    { value: 'accepte', label: 'Marquer accepté' },
    { value: 'refuse',  label: 'Marquer refusé' },
    { value: 'expire',  label: 'Marquer expiré' },
  ],
  accepte: [],
  refuse:  [],
  expire:  [],
}

export default function DevisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [devis, setDevis]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [actionLoading, setActionLoading] = useState(null) // 'convertir' | 'statut' | null

  function charger() {
    api.get(`/comptabilite/devis/${id}/`)
      .then(({ data }) => setDevis(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() /* eslint-disable-next-line */ }, [id])

  async function changerStatut(value) {
    setActionLoading('statut')
    setError('')
    try {
      const { data } = await api.patch(`/comptabilite/devis/${id}/`, { statut: value })
      setDevis(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Échec du changement de statut.')
    } finally {
      setActionLoading(null)
    }
  }

  async function convertirEnFacture() {
    if (!confirm('Convertir ce devis en facture brouillon ?')) return
    setActionLoading('convertir')
    setError('')
    try {
      const { data: facture } = await api.post(`/comptabilite/devis/${id}/convertir-facture/`)
      navigate(`/comptabilite/factures/${facture.id}`)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Échec de la conversion.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>
  if (!devis) return <div className="p-12 text-center text-red-500 font-body">Devis introuvable.</div>

  const transitions = STATUTS_SUIVANTS[devis.statut] ?? []
  const peutConvertir = devis.statut === 'accepte'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-body text-[#A59F9B]">
        <Link to="/comptabilite/devis" className="hover:text-forest-700 transition-colors">Devis</Link>
        <span>/</span>
        <span className="text-[#1C1817]">{devis.numero}</span>
      </div>

      <div className="card p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-display font-bold text-[#1C1817] text-xl">{devis.numero}</h1>
            <span className={DEVIS_STATUT_BADGE[devis.statut] ?? 'badge-gray'}>
              {DEVIS_STATUT_LABEL[devis.statut] ?? devis.statut}
            </span>
          </div>
          <p className="font-body text-[#1C1817]">{devis.client_nom}</p>
          {devis.projet_nom && <p className="font-body text-[#A59F9B] text-sm">{devis.projet_nom}</p>}
          {devis.date_validite && <p className="font-body text-[#A59F9B] text-xs mt-1">Valide jusqu'au {devis.date_validite}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {transitions.map((t) => (
            <button
              key={t.value}
              className="btn-secondary"
              onClick={() => changerStatut(t.value)}
              disabled={actionLoading === 'statut'}
            >
              {t.label}
            </button>
          ))}
          {peutConvertir && (
            <button className="btn-primary" onClick={convertirEnFacture} disabled={actionLoading === 'convertir'}>
              {actionLoading === 'convertir' ? 'Conversion…' : 'Convertir en facture'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 ring-red-200">
          <p className="text-red-700 text-sm font-body">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Tile label="Total HT" value={`${fmt(devis.total_ht)} F`} />
        <Tile label="TVA" value={`${fmt(devis.total_tva)} F`} />
        <Tile label="Total TTC" value={`${fmt(devis.total_ttc)} F`} highlight />
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ece2d3]">
          <p className="font-display font-semibold text-[#1C1817] text-sm">Lignes ({devis.lignes?.length ?? 0})</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#fbf7f0]">
            <tr>
              {['Désignation', 'Qté', 'Prix unit.', 'Remise', 'TVA %', 'Total HT', 'TTC'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4ebe0]">
            {(devis.lignes ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[#A59F9B] font-body text-sm">Aucune ligne</td></tr>
            ) : (devis.lignes ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-[#fbf7f0]">
                <td className="px-4 py-3 font-body text-[#1C1817]">{l.designation}</td>
                <td className="px-4 py-3 font-body text-[#A59F9B]">{l.quantite}</td>
                <td className="px-4 py-3 font-body text-[#1C1817]">{fmt(l.prix_unitaire)} F</td>
                <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{Number(l.remise_pct) > 0 ? `${l.remise_pct}%` : '—'}</td>
                <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{l.taux_tva}%</td>
                <td className="px-4 py-3 font-display text-[#1C1817]">{fmt(l.total_ht)} F</td>
                <td className="px-4 py-3 font-display font-semibold text-[#1C1817]">{fmt(l.montant_ttc)} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {devis.notes && (
        <div className="card p-5">
          <p className="font-display font-semibold text-[#1C1817] text-sm mb-2">Notes</p>
          <p className="font-body text-[#1C1817] text-sm whitespace-pre-line">{devis.notes}</p>
        </div>
      )}
    </div>
  )
}

function Tile({ label, value, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? 'bg-forest-50 ring-forest-100' : ''}`}>
      <p className={`font-display text-xs uppercase tracking-wide mb-1 ${highlight ? 'text-forest-600' : 'text-[#A59F9B]'}`}>{label}</p>
      <p className={`font-display font-bold text-2xl ${highlight ? 'text-forest-700' : 'text-[#1C1817]'}`}>{value}</p>
    </div>
  )
}
