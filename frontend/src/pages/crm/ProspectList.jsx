import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import ModuleTabs, { CRM_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconTarget, IconFolder, IconPhone } from '../../components/ui/Icons'
import ClientForm from '../../components/forms/ClientForm'
import { useFetchList } from '../../hooks/useFetchList'
import { CLIENT_STATUT_BADGE } from '../../utils/constants'
import { apiErrorMessage } from '../../utils/errors'

export default function ProspectList() {
  const { items: prospects, loading, error, charger } = useFetchList(
    '/crm/clients/?type_client=prospect',
    'Impossible de charger les prospects.'
  )
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)
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
    } finally { setRemoving(false) }
  }

  const filtered = prospects.filter(
    (p) =>
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  )

  const nbSecteurs = new Set(prospects.map((p) => p.secteur).filter(Boolean)).size
  const nbAvecTel  = prospects.filter((p) => p.telephone).length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Prospects</div>
          <div className="sec-sub">
            Clients potentiels à convertir ·{' '}
            {loading ? '…' : `${prospects.length} prospect${prospects.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="sec-actions">
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouveau prospect
          </button>
        </div>
      </div>

      {/* ─── KPI ────────────────────────────────────────── */}
      <div className="three-col">
        <KpiCard
          icon={<IconTarget />} tone="gold"
          label="Total prospects"
          value={prospects.length}
          sub="À convertir en clients"
        />
        <KpiCard
          icon={<IconFolder />} tone="sand"
          label="Secteurs"
          value={nbSecteurs}
          sub="Secteurs distincts"
        />
        <KpiCard
          icon={<IconPhone />} tone="forest"
          label="Avec téléphone"
          value={nbAvecTel}
          sub="Joignables directement"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={CRM_TABS} />

        <div className="th-row">
          <div className="th-title">
            Prospects ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <input
            type="text"
            className="input input-sm w-[210px]"
            placeholder="Rechercher par nom ou code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <table className="table-eko">
            <thead>
              <tr>
                {['Code', 'Nom', 'Secteur', 'Statut', 'Téléphone', 'Localité'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucun prospect trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono-cell text-forest-700">{p.code}</td>
                    <td className="font-display font-medium text-ink">{p.nom}</td>
                    <td className="text-sand-600 capitalize">{p.secteur || '—'}</td>
                    <td>
                      <span className={CLIENT_STATUT_BADGE[p.statut] ?? 'badge-gray'}>{p.statut}</span>
                    </td>
                    <td className="mono-cell">{p.telephone || '—'}</td>
                    <td className="text-sand-600">{p.localite || '—'}</td>
                    <td>
                      <RowActions
                        onEdit={() => setEditing(p)}
                        onDelete={() => setDeleting(p)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {(modal || editing) && (
        <Modal
          titre={editing ? `Modifier ${editing.code} — ${editing.nom}` : 'Nouveau prospect'}
          onClose={fermerDrawer}
        >
          <ClientForm
            typeDefault="prospect"
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce prospect ?"
          message={`Le prospect ${deleting.code} — ${deleting.nom} sera supprimé. Cette action est irréversible.`}
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
