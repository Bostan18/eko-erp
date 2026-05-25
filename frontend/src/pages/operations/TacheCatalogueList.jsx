import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { OPERATIONS_TABS } from '../../components/ui/ModuleTabs'
import TacheCatalogueForm from '../../components/forms/TacheCatalogueForm'
import { useFetchList } from '../../hooks/useFetchList'
import { apiErrorMessage } from '../../utils/errors'

export default function TacheCatalogueList() {
  const { items: taches, loading, error, charger } = useFetchList(
    '/operations/taches-catalogue/', 'Impossible de charger le référentiel.'
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
      await api.delete(`/operations/taches-catalogue/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  const filtres = taches.filter((t) =>
    !search ? true
      : t.libelle.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        (t.activite_display ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Opérations terrain</div>
          <div className="sec-sub">
            Référentiel des tâches · {loading ? '…' : `${taches.length} tâche${taches.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle tâche
        </button>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={OPERATIONS_TABS} />
        <div className="th-row">
          <div className="th-title">Catalogue · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher libellé, activité…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <thead><tr>{['Code', 'Libellé', 'Activité', 'Type', 'Unité', 'Tarif réf.', 'Statut'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucune tâche dans le catalogue</td></tr>
              ) : filtres.map((t) => (
                <tr key={t.id}>
                  <td className="mono-cell text-forest-700">{t.code}</td>
                  <td className="font-display font-medium text-ink">{t.libelle}</td>
                  <td className="text-sand-600">
                    {t.activite_display
                      ? <span className="inline-flex items-center gap-1.5">
                          {t.activite_couleur && <span className="w-2 h-2 rounded-full" style={{ background: t.activite_couleur }} />}
                          {t.activite_display}
                        </span>
                      : '—'}
                  </td>
                  <td className="text-[12px] text-sand-500">{t.type_objectif_display}</td>
                  <td className="text-sand-600">{t.unite_label || '—'}</td>
                  <td className="num">
                    {Number(t.tarif_reference).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-sand-500">F</span>
                  </td>
                  <td>{t.actif ? <Badge tone="green">Actif</Badge> : <Badge tone="gray">Inactif</Badge>}</td>
                  <td>
                    <RowActions
                      onEdit={() => setEditing(t)}
                      onDelete={() => setDeleting(t)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(modal || editing) && (
        <Modal
          titre={editing ? `Modifier ${editing.code} — ${editing.libelle}` : 'Nouvelle tâche du catalogue'}
          sousTitre="Modèle réutilisable pour les chantiers."
          onClose={fermerDrawer}
        >
          <TacheCatalogueForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer cette tâche du catalogue ?"
          message={`La tâche ${deleting.code} — ${deleting.libelle} sera supprimée. Cette action est irréversible.`}
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
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
