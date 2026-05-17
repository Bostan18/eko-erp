import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { DEVIS_STATUT_BADGE, DEVIS_STATUT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'
import { useConvertirDevis } from '../../hooks/useConvertirDevis'
import {
  ConvertirDevisModal,
  ConvertirDevisToast,
  IconCheck,
  IconInvoice,
} from '../../components/comptabilite/ConvertirDevisDialog'

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
  const [actionLoading, setActionLoading] = useState(null) // 'statut' | null
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState(null) // { numero_local } | null

  function charger() {
    api.get(`/comptabilite/devis/${id}/`)
      .then(({ data }) => setDevis(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() /* eslint-disable-next-line */ }, [id])

  const { convertir, loading: convertirLoading } = useConvertirDevis({
    onSuccess: (data) => {
      setShowConfirm(false)
      setToast({ numero_local: data.numero_local })
      setTimeout(() => navigate(data.redirect_url), 1500)
      setTimeout(() => setToast(null), 4000)
    },
    onError: (msg) => {
      setShowConfirm(false)
      setError(msg)
    },
  })

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

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>
  if (!devis) return <div className="p-12 text-center text-red-500 font-body">Devis introuvable.</div>

  const transitions = STATUTS_SUIVANTS[devis.statut] ?? []
  const dejaConverti = !!devis.facture_liee_id
  const peutConvertir = devis.statut === 'accepte' && !dejaConverti

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
        <div className="flex items-center gap-2 flex-wrap">
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
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={convertirLoading}
              className={`bg-forest-700 hover:bg-forest-800 text-white font-display font-medium text-[14px] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                convertirLoading ? 'opacity-60 cursor-wait' : ''
              }`}
            >
              {convertirLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Conversion en cours…
                </>
              ) : (
                <>
                  <IconInvoice className="w-4 h-4" />
                  Convertir en facture
                </>
              )}
            </button>
          )}
          {dejaConverti && (
            <div className="bg-forest-50 ring-1 ring-forest-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <IconCheck className="w-5 h-5 text-forest-600 shrink-0" />
              <span className="font-body text-[13px] text-forest-700">Converti en</span>
              <Link
                to={`/comptabilite/factures/${devis.facture_liee_id}`}
                className="font-mono text-forest-800 font-medium underline hover:no-underline"
              >
                {devis.facture_liee_numero}
              </Link>
            </div>
          )}
          {devis.statut !== 'accepte' && !dejaConverti && (
            <div
              className="group relative inline-flex items-center text-[#A59F9B]"
              title="La conversion est disponible uniquement pour les devis au statut Accepté."
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8h.01M11 12h1v4h1" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 ring-1 ring-red-200 rounded-xl px-4 py-3">
          <p className="text-red-700 text-[13px] font-body">{error}</p>
        </div>
      )}

      {showConfirm && (
        <ConvertirDevisModal
          devis={devis}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => convertir(devis.id)}
        />
      )}

      {toast && <ConvertirDevisToast numeroLocal={toast.numero_local} visible={!!toast} />}

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
