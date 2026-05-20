import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import FactureForm from '../../components/forms/FactureForm'
import { useFetchList } from '../../hooks/useFetchList'
import { FACTURE_STATUT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function FactureList() {
  const { items: factures, loading, error, charger } = useFetchList(
    '/comptabilite/factures/',
    'Impossible de charger les factures.'
  )
  const [filtre, setFiltre] = useState('toutes')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtrees = factures
    .filter((f) => (filtre === 'toutes' ? true : f.statut === filtre))
    .filter((f) =>
      !search
        ? true
        : f.numero.toLowerCase().includes(search.toLowerCase()) ||
          f.client_nom?.toLowerCase().includes(search.toLowerCase())
    )

  const totalEncaisse  = factures
    .filter((f) => f.statut === 'payee')
    .reduce((s, f) => s + Number(f.montant_ttc), 0)
  const totalEnAttente = factures
    .filter((f) => ['envoyee', 'partiellement_payee'].includes(f.statut))
    .reduce((s, f) => s + Number(f.solde_restant ?? 0), 0)
  const nbEnRetard = factures.filter((f) => f.statut === 'en_retard').length

  const FILTRES = [
    { key: 'toutes',              label: 'Toutes' },
    { key: 'brouillon',           label: 'Brouillons' },
    { key: 'envoyee',             label: 'Envoyées' },
    { key: 'partiellement_payee', label: 'Partiellement' },
    { key: 'payee',               label: 'Payées' },
    { key: 'en_retard',           label: 'En retard', danger: true },
  ]

  return (
    <div className="space-y-6">
      {/* ─── Head ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">Finance / Comptabilité</p>
          <h1 className="page-title">Factures</h1>
          <p className="page-sub mt-1.5">
            {loading
              ? '…'
              : `${factures.length} facture${factures.length !== 1 ? 's' : ''} · Ventes & FNE`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">⬇ Exporter</button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* ─── KPI bandeau ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi">
          <p className="kpi-label">Encaissé</p>
          <p className="kpi-value text-forest-700">
            {fmt(totalEncaisse)} <span className="kpi-unit">FCFA</span>
          </p>
          <p className="kpi-sub text-sand-500">Factures payées (cumul)</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">En attente</p>
          <p className="kpi-value text-gold-600">
            {fmt(totalEnAttente)} <span className="kpi-unit">FCFA</span>
          </p>
          <p className="kpi-sub text-sand-500">Soldes envoyés non réglés</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">En retard</p>
          <p className={`kpi-value ${nbEnRetard > 0 ? 'text-red-600' : 'text-sand-400'}`}>
            {nbEnRetard}
          </p>
          <p className="kpi-sub text-sand-500">
            {nbEnRetard > 0 ? 'Action requise' : 'Tout est à jour'}
          </p>
        </div>
      </div>

      {/* ─── Filtres + search ──────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {FILTRES.map(({ key, label, danger }) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={
                'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors ' +
                (filtre === key
                  ? danger
                    ? 'bg-red-500 text-white'
                    : 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
              }
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input input-sm max-w-xs ml-auto"
          placeholder="Rechercher numéro ou client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Numéro', 'Client', 'Projet', 'TTC', 'Payé', 'Solde', 'Statut', 'Échéance'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucune facture
                  </td>
                </tr>
              ) : (
                filtrees.map((f) => (
                  <tr key={f.id} className={f.statut === 'en_retard' ? 'bg-red-50/40 hover:bg-red-50' : ''}>
                    <td>
                      <Link
                        to={`/comptabilite/factures/${f.id}`}
                        className="mono-cell text-forest-700 hover:text-forest-900 font-medium"
                      >
                        {f.numero}
                      </Link>
                    </td>
                    <td className="font-display font-medium text-ink">{f.client_nom}</td>
                    <td className="text-[12px] text-sand-500">{f.projet_nom || '—'}</td>
                    <td className="num">
                      {fmt(f.montant_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span>
                    </td>
                    <td className="mono-cell">{fmt(f.montant_paye)}</td>
                    <td className={`num ${Number(f.solde_restant) > 0 ? 'text-gold-600' : 'text-sand-400'}`}>
                      {fmt(f.solde_restant)}
                    </td>
                    <td>
                      <StatusBadge
                        status={f.statut}
                        label={FACTURE_STATUT_LABEL[f.statut] ?? f.statut}
                      />
                    </td>
                    <td className={f.statut === 'en_retard' ? 'text-red-700 font-semibold' : 'text-sand-600'}>
                      {f.date_echeance || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          titre="Nouvelle facture"
          sousTitre="Client, lignes de facturation, échéance."
          onClose={() => setModal(false)}
          width={620}
        >
          <FactureForm
            onClose={() => setModal(false)}
            onSuccess={() => { setModal(false); charger() }}
          />
        </Modal>
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
