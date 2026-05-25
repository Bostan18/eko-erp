import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { CRM_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconHandshake, IconCheck, IconTarget, IconMoon } from '../../components/ui/Icons'
import ClientForm from '../../components/forms/ClientForm'
import { useFetchList } from '../../hooks/useFetchList'
import { apiErrorMessage } from '../../utils/errors'

const TYPE_TONE   = { particulier: 'gray', entreprise: 'blue', collectivite: 'green' }
const STATUT_TONE = { actif: 'green', prospect: 'gold', inactif: 'gray' }

export default function ClientList() {
  const { items: clients, loading, error, charger } = useFetchList(
    '/crm/clients/', 'Impossible de charger les clients.'
  )
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [removing, setRemoving]   = useState(false)
  const [actionError, setActionError] = useState('')

  function fermerDrawer() { setModal(false); setEditing(null) }

  async function confirmerSuppression() {
    if (!deleting) return
    setRemoving(true); setActionError('')
    try {
      await api.delete(`/crm/clients/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally {
      setRemoving(false)
    }
  }

  const filtered = clients
    .filter((c) => filtre === 'tous' ? true : c.statut === filtre)
    .filter((c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )

  const nbActifs    = clients.filter((c) => c.statut === 'actif').length
  const nbProspects = clients.filter((c) => c.statut === 'prospect').length
  const nbInactifs  = clients.filter((c) => c.statut === 'inactif').length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Clients</div>
          <div className="sec-sub">
            Base clients & prospects ·{' '}
            {loading ? '…' : `${clients.length} fiche${clients.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="sec-actions">
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouveau client
          </button>
        </div>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconHandshake />} tone="sand"
          label="Total fiches"
          value={clients.length}
          sub="Clients & prospects"
        />
        <KpiCard
          icon={<IconCheck />} tone="forest"
          label="Actifs"
          value={nbActifs}
          sub="Clients en activité"
        />
        <KpiCard
          icon={<IconTarget />} tone="gold"
          label="Prospects"
          value={nbProspects}
          sub="À convertir"
        />
        <KpiCard
          icon={<IconMoon />} tone="sand"
          label="Inactifs"
          value={nbInactifs}
          sub="Sans activité récente"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={CRM_TABS} />

        <div className="th-row">
          <div className="th-title">
            Base clients ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <div className="th-filters">
            <select
              className="input input-sm w-auto"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="prospect">Prospects</option>
              <option value="inactif">Inactifs</option>
            </select>
            <input
              type="text"
              className="input input-sm"
              placeholder="Rechercher nom ou code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {actionError && (
          <p className="alert-red m-5">
            {actionError}
            <button type="button" onClick={() => setActionError('')}
              className="ml-3 text-[11px] underline decoration-dotted opacity-70 hover:opacity-100">Fermer</button>
          </p>
        )}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
        <>
          {/* ─── Cards mobile (< md) ─────────────────────── */}
          <div className="md:hidden divide-y divide-sand-100">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sand-500 font-body text-sm">Aucun client</div>
            ) : filtered.map((c) => (
              <div key={c.id} className="px-4 py-3 hover:bg-sand-50 transition-colors">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="mono-cell text-forest-700 text-[11.5px]">{c.code}</p>
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUT_TONE[c.statut] ?? 'gray'}>{c.statut}</Badge>
                    <RowActions
                      onEdit={() => setEditing(c)}
                      onDelete={() => setDeleting(c)}
                    />
                  </div>
                </div>
                <p className="font-display font-medium text-ink text-[13.5px] mt-0.5 truncate">{c.nom}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-sand-600">
                  <Badge tone={TYPE_TONE[c.type_client] ?? 'gray'}>{c.type_client}</Badge>
                  {c.secteur && <span className="capitalize">{c.secteur}</span>}
                  {c.localite && (<><span className="text-sand-300">·</span><span>{c.localite}</span></>)}
                </div>
                {c.telephone && (
                  <p className="mt-1 font-mono text-[11px] text-sand-500">{c.telephone}</p>
                )}
              </div>
            ))}
          </div>

          {/* ─── Table desktop (≥ md) ───────────────────── */}
          <div className="hidden md:block">
            <table className="table-eko">
              <thead>
                <tr>
                  {['Code','Nom','Type','Secteur','Statut','Téléphone','Localité'].map(h => <th key={h}>{h}</th>)}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun client</td></tr>
                ) : filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="mono-cell text-forest-700">{c.code}</td>
                    <td className="font-display font-medium text-ink">{c.nom}</td>
                    <td><Badge tone={TYPE_TONE[c.type_client] ?? 'gray'}>{c.type_client}</Badge></td>
                    <td className="text-sand-600 capitalize">{c.secteur || '—'}</td>
                    <td><Badge tone={STATUT_TONE[c.statut] ?? 'gray'}>{c.statut}</Badge></td>
                    <td className="mono-cell">{c.telephone || '—'}</td>
                    <td className="text-sand-600">{c.localite || '—'}</td>
                    <td>
                      <RowActions
                        onEdit={() => setEditing(c)}
                        onDelete={() => setDeleting(c)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}
      </div>

      {(modal || editing) && (
        <Modal
          titre={editing ? `Modifier ${editing.code} — ${editing.nom}` : 'Nouveau client'}
          sousTitre="Coordonnées et secteur d'activité."
          onClose={fermerDrawer}
        >
          <ClientForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce client ?"
          message={`Le client ${deleting.code} — ${deleting.nom} sera supprimé. Cette action est irréversible.`}
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
