import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import ModuleTabs, { COMPTA_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconDocument, IconCheck, IconHourglass, IconClock } from '../../components/ui/Icons'
import DevisForm from '../../components/forms/DevisForm'
import { useFetchList } from '../../hooks/useFetchList'
import { useConvertirDevis } from '../../hooks/useConvertirDevis'
import { ConvertirDevisModal, ConvertirDevisToast } from '../../components/comptabilite/ConvertirDevisDialog'
import { DEVIS_STATUT_BADGE, DEVIS_STATUT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

const STATUTS = [
  { key: 'toutes',    label: 'Tous les statuts' },
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
  const totalFacture = devis.reduce((s, d) => s + Number(d.total_ttc ?? 0), 0)
  const totalAccepte = devis
    .filter((d) => d.statut === 'accepte')
    .reduce((s, d) => s + Number(d.total_ttc ?? 0), 0)
  const totalEnAttente = devis
    .filter((d) => ['brouillon', 'envoye'].includes(d.statut))
    .reduce((s, d) => s + Number(d.total_ttc ?? 0), 0)
  const nbExpire = devis.filter((d) => d.statut === 'expire').length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Devis</div>
          <div className="sec-sub">
            Devis commerciaux · Conversion en facture ·{' '}
            {loading ? '…' : `${devis.length} devis`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau devis
        </button>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconDocument />} tone="sand"
          label="Total devis"
          value={<>{fmt(totalFacture)} <span className="kpi-unit">FCFA</span></>}
          sub={`${devis.length} devis · cumul`}
        />
        <KpiCard
          icon={<IconCheck />} tone="forest" valueTone="forest"
          label="Acceptés"
          value={<>{fmt(totalAccepte)} <span className="kpi-unit">FCFA</span></>}
          sub="Montant validé"
        />
        <KpiCard
          icon={<IconHourglass />} tone="gold" valueTone="gold"
          label="En attente"
          value={<>{fmt(totalEnAttente)} <span className="kpi-unit">FCFA</span></>}
          sub="Brouillons & envoyés"
        />
        <KpiCard
          icon={<IconClock />} tone={nbExpire > 0 ? 'red' : 'sand'} valueTone={nbExpire > 0 ? 'red' : 'sand'}
          label="Expirés"
          value={nbExpire}
          sub={nbExpire > 0 ? 'À renouveler' : 'Aucun'}
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={COMPTA_TABS} />

        <div className="th-row">
          <div className="th-title">
            Devis commerciaux ·{' '}
            <span className="text-sand-500 font-normal">{filtres.length}</span>
          </div>
          <select
            className="input input-sm w-auto"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          >
            {STATUTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Numéro', 'Client', 'Projet', 'Total TTC', 'Statut', 'Validité', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucun devis</td></tr>
              ) : filtres.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/comptabilite/devis/${d.id}`} className="mono-cell text-forest-700 hover:text-forest-900 font-medium">
                      {d.numero}
                    </Link>
                  </td>
                  <td className="font-display font-medium text-ink">{d.client_nom}</td>
                  <td className="text-[12px] text-sand-500">{d.projet_nom || '—'}</td>
                  <td className="num">{fmt(d.total_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td>
                    <span className={DEVIS_STATUT_BADGE[d.statut] ?? 'badge-gray'}>
                      {DEVIS_STATUT_LABEL[d.statut] ?? d.statut}
                    </span>
                  </td>
                  <td className="text-sand-600">{d.date_validite || '—'}</td>
                  <td>
                    {d.facture_liee_id ? (
                      <Link
                        to={`/comptabilite/factures/${d.facture_liee_id}`}
                        className="text-sand-500 font-mono text-[11px] hover:text-forest-700 transition-colors"
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

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
