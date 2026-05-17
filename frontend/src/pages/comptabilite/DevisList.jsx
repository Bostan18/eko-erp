import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import DevisForm from '../../components/forms/DevisForm'
import { useFetchList } from '../../hooks/useFetchList'
import { useConvertirDevis } from '../../hooks/useConvertirDevis'
import { ConvertirDevisModal, ConvertirDevisToast } from '../../components/comptabilite/ConvertirDevisDialog'
import { DEVIS_STATUT_BADGE, DEVIS_STATUT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

const FILTRES = [
  { key: 'toutes',    label: 'Tous' },
  { key: 'brouillon', label: 'Brouillons' },
  { key: 'envoye',    label: 'Envoyés' },
  { key: 'accepte',   label: 'Acceptés' },
  { key: 'refuse',    label: 'Refusés' },
  { key: 'expire',    label: 'Expirés' },
]

export default function DevisList() {
  const navigate = useNavigate()
  const { items: devis, loading, error, charger } = useFetchList('/comptabilite/devis/', 'Impossible de charger les devis.')
  const [filtre, setFiltre] = useState('toutes')
  const [modal, setModal]   = useState(false)
  const [confirmDevis, setConfirmDevis] = useState(null)
  const [toast, setToast] = useState(null)
  const [conversionError, setConversionError] = useState('')

  const { convertir } = useConvertirDevis({
    onSuccess: (data) => {
      setConfirmDevis(null)
      setToast({ numero_local: data.numero_local })
      setTimeout(() => navigate(data.redirect_url), 1500)
      setTimeout(() => setToast(null), 4000)
    },
    onError: (msg) => {
      setConfirmDevis(null)
      setConversionError(msg)
      setTimeout(() => setConversionError(''), 5000)
    },
  })

  const filtres = devis.filter((d) => filtre === 'toutes' || d.statut === filtre)
  const totalAccepte = devis
    .filter((d) => d.statut === 'accepte')
    .reduce((s, d) => s + Number(d.total_ttc ?? 0), 0)
  const totalEnAttente = devis
    .filter((d) => ['brouillon', 'envoye'].includes(d.statut))
    .reduce((s, d) => s + Number(d.total_ttc ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${devis.length} devis`}
        </p>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouveau devis</button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div className="card p-4 ring-forest-100 bg-forest-50">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Devis acceptés</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{fmt(totalAccepte)} F</p>
        </div>
        <div className="card p-4">
          <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-1">En attente</p>
          <p className="font-display font-bold text-[#1C1817] text-2xl">{fmt(totalEnAttente)} F</p>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {FILTRES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
              filtre === key
                ? 'bg-forest-700 text-white'
                : 'bg-white border border-[#ece2d3] text-[#1C1817] hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Numéro', 'Client', 'Projet', 'Total TTC', 'Statut', 'Validité', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtres.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A59F9B] font-body">Aucun devis</td></tr>
              ) : filtres.map((d) => (
                <tr key={d.id} className="hover:bg-[#fbf7f0] transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/comptabilite/devis/${d.id}`} className="font-display font-medium text-forest-700 hover:text-forest-900">
                      {d.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-[#1C1817]">{d.client_nom}</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{d.projet_nom || '—'}</td>
                  <td className="px-4 py-3 font-display font-semibold text-[#1C1817]">{fmt(d.total_ttc)} F</td>
                  <td className="px-4 py-3">
                    <span className={DEVIS_STATUT_BADGE[d.statut] ?? 'badge-gray'}>
                      {DEVIS_STATUT_LABEL[d.statut] ?? d.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-sm">{d.date_validite || '—'}</td>
                  <td className="px-4 py-3">
                    {d.facture_liee_id ? (
                      <Link
                        to={`/comptabilite/factures/${d.facture_liee_id}`}
                        className="text-[#A59F9B] font-mono text-[11px] hover:text-forest-700 transition-colors"
                      >
                        {d.facture_liee_numero} ↗
                      </Link>
                    ) : d.statut === 'accepte' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDevis(d)}
                        className="text-forest-700 font-display text-[12px] font-medium bg-forest-50 hover:bg-forest-100 px-2.5 py-1 rounded-md ring-1 ring-forest-200 transition-colors"
                      >
                        → Facture
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau devis" onClose={() => setModal(false)}>
          <DevisForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}

      {confirmDevis && (
        <ConvertirDevisModal
          devis={confirmDevis}
          onCancel={() => setConfirmDevis(null)}
          onConfirm={() => convertir(confirmDevis.id)}
        />
      )}

      {toast && <ConvertirDevisToast numeroLocal={toast.numero_local} visible={!!toast} />}

      {conversionError && (
        <div className="fixed top-5 right-5 z-50 bg-red-50 ring-1 ring-red-200 rounded-xl px-4 py-3 text-red-700 text-[13px] font-body shadow-xl">
          {conversionError}
        </div>
      )}
    </div>
  )
}
