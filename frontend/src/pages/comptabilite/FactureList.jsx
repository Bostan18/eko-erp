import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import { StatusBadge, CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { COMPTA_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconInvoice, IconWallet, IconHourglass, IconAlert } from '../../components/ui/Icons'
import FactureForm from '../../components/forms/FactureForm'
import { useFetchList } from '../../hooks/useFetchList'
import { FACTURE_STATUT_LABEL, factureEnRetard } from '../../utils/constants'
import { apiErrorMessage } from '../../utils/errors'
import { fmt } from '../../utils/format'

export default function FactureList() {
  const { items: factures, loading, error, charger } = useFetchList(
    '/comptabilite/factures/',
    'Impossible de charger les factures.'
  )
  const navigate = useNavigate()
  const [filtre, setFiltre] = useState('toutes')
  const [filtreCentre, setFiltreCentre] = useState('tous')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [centres, setCentres] = useState([])

  function fermerDrawer() {
    setModal(false)
    setEditing(null)
  }

  async function confirmerSuppression() {
    if (!deleting) return
    setRemoving(true)
    setActionError('')
    try {
      await api.delete(`/comptabilite/factures/${deleting.id}/`)
      setDeleting(null)
      charger()
    } catch (err) {
      setActionError(apiErrorMessage(err))
      setDeleting(null)
    } finally {
      setRemoving(false)
    }
  }

  useEffect(() => {
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
  }, [])

  const filtrees = factures
    .filter((f) => {
      if (filtre === 'toutes') return true
      if (filtre === 'en_retard') return factureEnRetard(f)
      return f.statut === filtre
    })
    .filter((f) => filtreCentre === 'tous' ? true : String(f.centre_cout) === filtreCentre)
    .filter((f) =>
      !search
        ? true
        : (f.numero_local ?? '').toLowerCase().includes(search.toLowerCase()) ||
          f.client_nom?.toLowerCase().includes(search.toLowerCase())
    )

  const totalFacture  = factures.reduce((s, f) => s + Number(f.total_ttc ?? 0), 0)
  const totalEncaisse = factures.reduce((s, f) => s + Number(f.montant_paye ?? 0), 0)
  const totalEnAttente = factures
    .filter((f) => f.statut !== 'payee' && f.statut !== 'annulee')
    .reduce((s, f) => s + Number(f.solde_restant ?? 0), 0)
  const nbEnRetard = factures.filter(factureEnRetard).length

  // Filtre de statut secondaire (select dans le th-row)
  const STATUTS = [
    { key: 'toutes',    label: 'Tous les statuts' },
    { key: 'brouillon', label: 'Brouillons' },
    { key: 'certifiee', label: 'Certifiées FNE' },
    { key: 'payee',     label: 'Payées' },
    { key: 'en_retard', label: 'En retard' },
    { key: 'annulee',   label: 'Annulées' },
  ]

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Facturation &amp; FNE</div>
          <div className="sec-sub">
            Factures ventes · Certification FNE ·{' '}
            {loading ? '…' : `${factures.length} facture${factures.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">⬇ Exporter</button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* ─── Alerte ─────────────────────────────────────── */}
      {nbEnRetard > 0 && (
        <div className="alert-gold">
          <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
          <strong className="font-display font-semibold">
            {nbEnRetard} facture{nbEnRetard > 1 ? 's' : ''} en retard
          </strong>
          <span className="text-gold-600">· relance recommandée</span>
        </div>
      )}

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconInvoice />} tone="sand"
          label="Total facturé"
          value={<>{fmt(totalFacture)} <span className="kpi-unit">FCFA</span></>}
          sub={`${factures.length} facture${factures.length !== 1 ? 's' : ''} · cumul`}
        />
        <KpiCard
          icon={<IconWallet />} tone="forest"
          label="Encaissé"
          value={<>{fmt(totalEncaisse)} <span className="kpi-unit">FCFA</span></>}
          sub="Factures payées"
        />
        <KpiCard
          icon={<IconHourglass />} tone="gold"
          label="En attente"
          value={<>{fmt(totalEnAttente)} <span className="kpi-unit">FCFA</span></>}
          sub="Soldes envoyés non réglés"
        />
        <KpiCard
          icon={<IconAlert />} tone="red"
          label="En retard"
          value={nbEnRetard}
          sub={nbEnRetard > 0 ? 'Action requise' : 'Tout est à jour'}
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={COMPTA_TABS} />

        <div className="th-row">
          <div className="th-title">
            Factures ventes ·{' '}
            <span className="text-sand-500 font-normal">{filtrees.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input input-sm w-auto"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            >
              {STATUTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <select
              className="input input-sm w-auto"
              value={filtreCentre}
              onChange={(e) => setFiltreCentre(e.target.value)}
            >
              <option value="tous">Tous les centres</option>
              {centres.map((c) => <option key={c.id} value={String(c.id)}>{c.nom}</option>)}
            </select>
            <input
              type="text"
              className="input input-sm w-[210px]"
              placeholder="Rechercher numéro ou client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {actionError && (
          <p className="alert-red m-5">
            {actionError}
            <button
              type="button"
              onClick={() => setActionError('')}
              className="ml-3 text-[11px] underline decoration-dotted opacity-70 hover:opacity-100"
            >Fermer</button>
          </p>
        )}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Numéro', 'Client', 'Projet', 'Centre', 'TTC', 'Payé', 'Solde', 'Statut', 'Échéance'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucune facture
                  </td>
                </tr>
              ) : (
                filtrees.map((f) => {
                  const enRetard = factureEnRetard(f)
                  const verrouillee = !!f.fne_reference
                  const lockReason = verrouillee
                    ? 'Facture certifiée FNE — verrouillée'
                    : null
                  return (
                  <tr key={f.id} className={enRetard ? 'bg-red-50/40 hover:bg-red-50' : ''}>
                    <td>
                      <Link
                        to={`/comptabilite/factures/${f.id}`}
                        className="mono-cell text-forest-700 hover:text-forest-900 font-medium"
                      >
                        {f.numero_local}
                      </Link>
                    </td>
                    <td className="font-display font-medium text-ink">
                      {f.client_nom}
                      {f.type_facture === 'avoir' && <span className="badge-red ml-2">Avoir</span>}
                    </td>
                    <td className="text-[12px] text-sand-500">{f.projet_nom || '—'}</td>
                    <td>{f.centre_cout_display ? <CenterBadge center={f.centre_cout_display} /> : <span className="text-sand-400">—</span>}</td>
                    <td className="num">
                      {fmt(f.total_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span>
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
                    <td className={enRetard ? 'text-red-700 font-semibold' : 'text-sand-600'}>
                      {f.date_echeance || '—'}
                    </td>
                    <td>
                      <RowActions
                        onView={() => navigate(`/comptabilite/factures/${f.id}`)}
                        onEdit={() => setEditing(f)}
                        onDelete={() => setDeleting(f)}
                        editDisabledReason={lockReason}
                        deleteDisabledReason={lockReason}
                      />
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        )}
      </div>

      {(modal || editing) && (
        <Modal
          titre={editing ? `Modifier la facture ${editing.numero_local}` : 'Nouvelle facture'}
          sousTitre={editing
            ? 'Échéance, mode de règlement, notes — les lignes restent figées.'
            : 'Client, lignes de facturation, échéance.'}
          onClose={fermerDrawer}
          width={620}
        >
          <FactureForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer la facture ?"
          message={`La facture ${deleting.numero_local} (${deleting.client_nom}) sera supprimée. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          busy={removing}
          onConfirm={confirmerSuppression}
          onCancel={() => setDeleting(null)}
        />
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
